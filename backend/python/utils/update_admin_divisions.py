"""
Update admin_division field for all hazards in the database.
Uses philippine_regions.py mapping to determine region from location_name.

Run with: docker-compose exec backend python backend/python/utils/update_admin_divisions.py
"""

import os
import sys
import logging

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, project_root)

from backend.python.philippine_regions import (
    get_region_from_location,
    PHILIPPINE_ADMIN_MAPPING,
    PROVINCE_TO_REGION
)
from backend.python.lib.supabase_client import supabase

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def extract_location_parts(location_name: str) -> dict:
    """
    Extract city/province from location_name string.
    Handles formats like:
    - "Manila" (city only)
    - "Quezon City" (city with multi-word)
    - "Batangas City" (city with suffix)
    - "Philippines" (country fallback)
    - "Maguindanao del Sur" (province)
    """
    if not location_name or location_name == "Philippines":
        return {'city': None, 'province': None}
    
    location_clean = location_name.strip()
    
    # Try direct city match (case-insensitive)
    for city_key in PHILIPPINE_ADMIN_MAPPING.keys():
        if city_key.lower() == location_clean.lower():
            return {'city': city_key, 'province': None}
    
    # Try direct province match
    for province_key in PROVINCE_TO_REGION.keys():
        if province_key.lower() == location_clean.lower():
            return {'city': None, 'province': province_key}
    
    # Try partial matches (for multi-word locations)
    # Example: "Bais City" should match if "Bais" is not found
    words = location_clean.split()
    if len(words) > 1:
        # Try without last word (City, Municipality, etc.)
        without_suffix = ' '.join(words[:-1])
        for city_key in PHILIPPINE_ADMIN_MAPPING.keys():
            if city_key.lower() == without_suffix.lower():
                return {'city': city_key, 'province': None}
    
    return {'city': location_clean, 'province': None}


def determine_admin_division(location_name: str) -> str:
    """
    Determine admin_division from location_name.
    Returns region name (e.g., "Region III", "NCR") or "Unknown".
    """
    parts = extract_location_parts(location_name)
    
    # Get region data
    region_data = get_region_from_location(
        city=parts['city'],
        province=parts['province']
    )
    
    if region_data:
        # Use region code (e.g., "Region III", "NCR")
        return region_data.get('region', 'Unknown')
    
    # Fallback: return location_name as-is if no region found
    logger.warning(f"No region mapping found for: {location_name}")
    return location_name if location_name != "Philippines" else "Unknown"


def update_all_hazards():
    """Update admin_division for all hazards with NULL or incorrect values."""
    
    logger.info("Starting admin_division update...")
    
    # Get all hazards from gaia schema
    response = supabase.schema('gaia').table('hazards').select('id, location_name, admin_division').execute()
    
    if not response.data:
        logger.warning("No hazards found in database")
        return
    
    hazards = response.data
    logger.info(f"Found {len(hazards)} hazards to process")
    
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for hazard in hazards:
        hazard_id = hazard['id']
        location_name = hazard.get('location_name', '')
        current_admin_division = hazard.get('admin_division')
        
        if not location_name:
            logger.warning(f"Hazard {hazard_id}: No location_name, skipping")
            skipped_count += 1
            continue
        
        # Determine new admin_division
        new_admin_division = determine_admin_division(location_name)
        
        # Skip if already correct
        if current_admin_division == new_admin_division:
            logger.debug(f"Hazard {hazard_id}: admin_division already correct ({new_admin_division})")
            skipped_count += 1
            continue
        
        # Update database
        try:
            update_response = supabase.schema('gaia').table('hazards').update({
                'admin_division': new_admin_division
            }).eq('id', hazard_id).execute()
            
            logger.info(
                f"Updated hazard {hazard_id}: "
                f"location_name='{location_name}' -> admin_division='{new_admin_division}' "
                f"(was: {current_admin_division})"
            )
            updated_count += 1
            
        except Exception as e:
            logger.error(f"Error updating hazard {hazard_id}: {str(e)}")
            error_count += 1
    
    # Summary
    logger.info("=" * 60)
    logger.info("Admin Division Update Summary")
    logger.info("=" * 60)
    logger.info(f"Total hazards processed: {len(hazards)}")
    logger.info(f"Updated: {updated_count}")
    logger.info(f"Skipped (already correct or no location): {skipped_count}")
    logger.info(f"Errors: {error_count}")
    logger.info("=" * 60)


def show_mapping_stats():
    """Display statistics about the mapping coverage."""
    from backend.python.philippine_regions import (
        get_all_cities,
        get_all_provinces,
        get_all_regions
    )
    
    cities = get_all_cities()
    provinces = get_all_provinces()
    regions = get_all_regions()
    
    logger.info("Philippine Regions Mapping Stats:")
    logger.info(f"  Cities mapped: {len(cities)}")
    logger.info(f"  Provinces mapped: {len(provinces)}")
    logger.info(f"  Regions: {len(regions)}")
    logger.info(f"  Region codes: {', '.join(regions)}")


if __name__ == "__main__":
    try:
        show_mapping_stats()
        logger.info("")
        update_all_hazards()
    except KeyboardInterrupt:
        logger.info("\nUpdate cancelled by user")
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        sys.exit(1)
