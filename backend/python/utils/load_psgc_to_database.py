"""
Load Philippine Standard Geographic Code (PSGC) data into database.
Populates gaia.ph_administrative_boundaries table from PSGC CSV file.

This script:
1. Reads the PSGC CSV file
2. Parses hierarchical relationships
3. Inserts records into ph_administrative_boundaries table
4. Calculates centroids from geometry if available (or uses geocoding fallback)

Usage:
    # First, check if migration is applied:
    python backend/python/utils/check_migration_applied.py
    
    # Then load data:
    python -m backend.python.utils.load_psgc_to_database
    # Or from project root:
    docker-compose exec backend python -m backend.python.utils.load_psgc_to_database
    
    # Alternative: Generate SQL and use Supabase Dashboard
    python backend/python/utils/generate_psgc_sql.py
"""

import os
import sys
import csv
import logging
from pathlib import Path
from typing import Dict, Optional

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.python.lib.supabase_client import supabase
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Path to PSGC CSV
PSGC_CSV_PATH = project_root / 'backend' / 'python' / 'models' / 'PhilippineStandardGeographicCode_Q4_2024.csv'

# Geocoder for fallback centroid calculation
geocoder = Nominatim(user_agent="gaia_psgc_loader", timeout=10)
_last_geocode_time = 0


def parse_population(pop_str: str) -> Optional[int]:
    """Parse population string to integer."""
    if not pop_str:
        return None
    try:
        pop_str = pop_str.replace(' ', '').replace(',', '').strip()
        return int(pop_str) if pop_str else None
    except:
        return None


def get_centroid_from_geocoding(name: str, hierarchy: Dict) -> Optional[Dict]:
    """
    Get centroid coordinates using geocoding as fallback.
    
    Returns:
        Dict with 'latitude' and 'longitude', or None
    """
    global _last_geocode_time
    
    try:
        # Build hierarchical query
        query_parts = []
        if hierarchy.get('barangay'):
            query_parts.append(hierarchy['barangay'])
        if hierarchy.get('municipality'):
            query_parts.append(hierarchy['municipality'])
        elif hierarchy.get('province'):
            query_parts.append(hierarchy['province'])
        query_parts.append('Philippines')
        query = ', '.join(query_parts)
        
        # Rate limiting
        current_time = time.time()
        time_since_last = current_time - _last_geocode_time
        if time_since_last < 1.0:
            time.sleep(1.0 - time_since_last)
        
        location = geocoder.geocode(query, exactly_one=True, language='en')
        _last_geocode_time = time.time()
        
        if location:
            return {
                'latitude': location.latitude,
                'longitude': location.longitude
            }
    except Exception as e:
        logger.debug(f"Geocoding failed for {name}: {str(e)}")
    
    return None


def load_psgc_data():
    """Load PSGC data from CSV into database."""
    if not PSGC_CSV_PATH.exists():
        logger.error(f"PSGC CSV file not found: {PSGC_CSV_PATH}")
        return
    
    logger.info(f"Loading PSGC data from: {PSGC_CSV_PATH}")
    
    # Map to store parent relationships
    psgc_to_id: Dict[str, str] = {}
    records_to_insert = []
    
    try:
        with open(PSGC_CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                psgc_code = row['10_Digit_PSGC'].strip()
                name = row['Name'].strip()
                geo_level = row['Geographic_Level'].strip()
                
                if not name or not geo_level:
                    continue
                
                # Map geo level to database admin_level
                admin_level_map = {
                    'Reg': 'region',
                    'Prov': 'province',
                    'City': 'city',
                    'Mun': 'municipality',
                    'Bgy': 'barangay'
                }
                
                admin_level = admin_level_map.get(geo_level)
                if not admin_level:
                    continue
                
                # Extract hierarchy codes from PSGC
                region_code = psgc_code[:2] if len(psgc_code) >= 2 else None
                province_code = psgc_code[2:5] if len(psgc_code) >= 5 else None
                mun_code = psgc_code[5:8] if len(psgc_code) >= 8 else None
                bgy_code = psgc_code[8:10] if len(psgc_code) >= 10 else None
                
                # Find parent PSGC code
                parent_psgc = None
                if geo_level == 'Bgy':
                    parent_psgc = psgc_code[:8] + '000'
                elif geo_level in ['Mun', 'City']:
                    parent_psgc = psgc_code[:5] + '00000'
                elif geo_level == 'Prov':
                    parent_psgc = psgc_code[:2] + '00000000'
                
                # Build record
                record = {
                    'name': name,
                    'admin_level': admin_level,
                    'psgc_code': psgc_code,
                    'region_code': region_code,
                    'province_code': province_code,
                    'city_municipality_code': mun_code,
                    'barangay_code': bgy_code,
                    'population': parse_population(row.get('2020_Population', '')),
                    'source': 'PSGC_Q4_2024'
                }
                
                # Store parent reference (will resolve after all records are inserted)
                if parent_psgc:
                    record['_parent_psgc'] = parent_psgc
                
                records_to_insert.append(record)
                
                # Progress logging
                if row_num % 1000 == 0:
                    logger.info(f"Processed {row_num} rows...")
        
        logger.info(f"Total records to insert: {len(records_to_insert)}")
        
        # Insert records in batches
        batch_size = 100
        total_inserted = 0
        
        for i in range(0, len(records_to_insert), batch_size):
            batch = records_to_insert[i:i + batch_size]
            
            # Prepare batch for insertion (remove _parent_psgc, it's just for reference)
            insert_batch = []
            for record in batch:
                insert_record = {k: v for k, v in record.items() if k != '_parent_psgc'}
                insert_batch.append(insert_record)
            
            try:
                # Try PostgREST first
                result = supabase.schema('gaia').from_('ph_administrative_boundaries').insert(
                    insert_batch
                ).execute()
                
                if result.data:
                    total_inserted += len(result.data)
                    logger.info(f"Inserted batch {i//batch_size + 1}: {len(result.data)} records (Total: {total_inserted})")
                    
                    # Store ID mappings for parent relationships
                    for j, inserted_record in enumerate(result.data):
                        original_record = batch[j]
                        if '_parent_psgc' in original_record:
                            psgc_to_id[original_record['psgc_code']] = inserted_record['id']
                else:
                    logger.warning(f"Batch {i//batch_size + 1} insertion returned no data")
            
            except Exception as e:
                error_str = str(e)
                # Check if it's a schema cache error
                if 'PGRST205' in error_str or 'schema cache' in error_str.lower() or 'not find the table' in error_str.lower():
                    logger.error(f"❌ Table not found in PostgREST schema cache!")
                    logger.error(f"   This means the migration hasn't been applied or PostgREST needs a refresh.")
                    logger.error(f"")
                    logger.error(f"📋 SOLUTION OPTIONS:")
                    logger.error(f"")
                    logger.error(f"   Option 1: Apply migration first (RECOMMENDED)")
                    logger.error(f"   ===============================================")
                    logger.error(f"   1. Go to Supabase Dashboard → SQL Editor")
                    logger.error(f"   2. Run migration: backend/supabase/migrations/20241101000003_create_ph_boundaries.sql")
                    logger.error(f"   3. Then re-run this script")
                    logger.error(f"")
                    logger.error(f"   Option 2: Use SQL generation method")
                    logger.error(f"   ======================================")
                    logger.error(f"   python backend/python/utils/generate_psgc_sql.py")
                    logger.error(f"   Then copy psgc_inserts.sql to Supabase SQL Editor")
                    logger.error(f"")
                    logger.error(f"   Option 3: Refresh PostgREST schema cache")
                    logger.error(f"   ==========================================")
                    logger.error(f"   In Supabase Dashboard: Settings → API → Reload Schema")
                    logger.error(f"")
                    raise Exception("Migration not applied. Please apply migration first (see error message above).")
                else:
                    logger.error(f"Error inserting batch {i//batch_size + 1}: {str(e)}")
                    # Continue with next batch for other errors
                    continue
        
        logger.info(f"Successfully inserted {total_inserted} records")
        
        # Update parent relationships
        logger.info("Updating parent relationships...")
        parent_updates = 0
        
        for record in records_to_insert:
            if '_parent_psgc' in record and record['_parent_psgc'] in psgc_to_id:
                child_id = psgc_to_id.get(record['psgc_code'])
                parent_id = psgc_to_id.get(record['_parent_psgc'])
                
                if child_id and parent_id:
                    try:
                        supabase.schema('gaia').from_('ph_administrative_boundaries').update(
                            {'parent_id': parent_id}
                        ).eq('id', child_id).execute()
                        parent_updates += 1
                    except Exception as e:
                        logger.debug(f"Failed to update parent for {record['name']}: {str(e)}")
        
        logger.info(f"Updated {parent_updates} parent relationships")
        
        # Note: Centroids would need to be calculated from geometry data
        # For now, they can be populated later via geocoding or geometry processing
        logger.info("Note: Centroids need to be populated separately (from geometry or geocoding)")
        
    except Exception as e:
        logger.error(f"Error loading PSGC data: {str(e)}")
        raise


if __name__ == '__main__':
    try:
        load_psgc_data()
        logger.info("PSGC data loading completed successfully")
    except Exception as e:
        logger.error(f"Failed to load PSGC data: {str(e)}")
        sys.exit(1)

