#!/usr/bin/env python3
"""
Download and Aggregate Philippine Municipality Boundaries

This script downloads municipality-level GeoJSON files from the faeldon/philippines-json-maps
repository and aggregates them into a single municipalities.geojson file.

Repository: https://github.com/faeldon/philippines-json-maps
Data Source: PSGC (Philippine Standard Geographic Code) December 31, 2023
License: MIT

Usage:
    python scripts/download_municipality_boundaries.py [--resolution lowres|medres|hires]
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Dict, List
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Repository configuration
GITHUB_REPO_BASE = "https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson"

# Philippine regions (17 total) - from faeldon repository
REGIONS = {
    "01": "region-i",
    "02": "region-ii", 
    "03": "region-iii",
    "04": "region-iv-a",  # CALABARZON
    "05": "region-v",
    "06": "region-vi",
    "07": "region-vii",
    "08": "region-viii",
    "09": "region-ix",
    "10": "region-x",
    "11": "region-xi",
    "12": "region-xii",
    "13": "region-xiii",  # CARAGA
    "14": "ncr",  # National Capital Region
    "15": "car",  # Cordillera Administrative Region
    "16": "region-iv-b",  # MIMAROPA
    "17": "barmm"  # Bangsamoro Autonomous Region in Muslim Mindanao
}

# Map resolution to tolerance level
RESOLUTION_MAP = {
    "lowres": "0.001",  # 0.1% simplification (~200KB per province)
    "medres": "0.01",   # 1% simplification (~1-2MB per province)
    "hires": "0.1"      # 10% simplification (~5-10MB per province)
}

# Default resolution to use (changed from lowres to hires for better detail)
DEFAULT_RESOLUTION = "hires"


def download_geojson(url: str, retry_count: int = 3, retry_delay: int = 2) -> Dict:
    """
    Download GeoJSON file from URL with retry logic.
    
    Args:
        url: URL to download from
        retry_count: Number of retry attempts
        retry_delay: Delay between retries in seconds
        
    Returns:
        Dict containing GeoJSON data
        
    Raises:
        HTTPError: If download fails after retries
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    for attempt in range(retry_count):
        try:
            request = Request(url, headers=headers)
            with urlopen(request, timeout=30) as response:
                data = response.read()
                return json.loads(data)
        except HTTPError as e:
            if e.code == 404:
                logger.warning(f"File not found: {url}")
                return None
            if attempt < retry_count - 1:
                logger.warning(f"Download failed (attempt {attempt + 1}/{retry_count}): {e}")
                time.sleep(retry_delay)
            else:
                raise
        except URLError as e:
            if attempt < retry_count - 1:
                logger.warning(f"Network error (attempt {attempt + 1}/{retry_count}): {e}")
                time.sleep(retry_delay)
            else:
                raise
    
    return None


def download_province_municipalities(region_code: str, resolution: str = "lowres") -> List[Dict]:
    """
    Download municipality boundaries for all provinces in a region.
    
    Args:
        region_code: Region code (e.g., "01", "04")
        resolution: File resolution (lowres, medres, hires)
        
    Returns:
        List of GeoJSON features (municipalities)
    """
    region_name = REGIONS[region_code]
    tolerance = RESOLUTION_MAP[resolution]
    
    # Construct URL for province districts in this region
    # Example: https://raw.githubusercontent.com/.../regions/lowres/provdists-region-100000000.0.001.json
    region_psgc = int(region_code) * 100000000
    url = f"{GITHUB_REPO_BASE}/regions/{resolution}/provdists-region-{region_psgc}.{tolerance}.json"
    
    logger.info(f"Downloading province boundaries for Region {region_code} ({region_name})")
    logger.debug(f"URL: {url}")
    
    try:
        province_data = download_geojson(url)
        
        if not province_data or "features" not in province_data:
            logger.warning(f"No province data found for region {region_code}")
            return []
        
        logger.info(f"Found {len(province_data['features'])} provinces in Region {region_code}")
        
        # Now download municipalities for each province
        all_municipalities = []
        
        for province_feature in province_data["features"]:
            province_psgc = province_feature["properties"]["adm2_psgc"]
            province_name = province_feature["properties"]["adm2_en"]
            
            # Construct URL for municipalities in this province
            # Example: https://raw.githubusercontent.com/.../provdists/lowres/municities-provdist-401000000.0.001.json
            muni_url = f"{GITHUB_REPO_BASE}/provdists/{resolution}/municities-provdist-{province_psgc}.{tolerance}.json"
            
            logger.info(f"  Downloading municipalities for {province_name} (PSGC: {province_psgc})")
            logger.debug(f"  URL: {muni_url}")
            
            try:
                muni_data = download_geojson(muni_url)
                
                if muni_data and "features" in muni_data:
                    logger.info(f"  Found {len(muni_data['features'])} municipalities in {province_name}")
                    all_municipalities.extend(muni_data["features"])
                else:
                    logger.warning(f"  No municipality data for {province_name}")
                    
            except Exception as e:
                logger.error(f"  Error downloading municipalities for {province_name}: {e}")
                continue
        
        return all_municipalities
        
    except Exception as e:
        logger.error(f"Error processing region {region_code}: {e}")
        return []


def aggregate_municipalities(resolution: str = "lowres", output_dir: Path = None) -> None:
    """
    Download and aggregate all municipality boundaries into a single GeoJSON file.
    
    Args:
        resolution: File resolution (lowres, medres, hires)
        output_dir: Output directory for municipalities.geojson
    """
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "frontend" / "public" / "data" / "boundaries"
    
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "municipalities.geojson"
    
    logger.info(f"Starting municipality boundary aggregation (resolution: {resolution})")
    logger.info(f"Output: {output_file}")
    
    all_features = []
    total_municipalities = 0
    
    # Process each region
    for region_code in sorted(REGIONS.keys()):
        municipalities = download_province_municipalities(region_code, resolution)
        all_features.extend(municipalities)
        total_municipalities += len(municipalities)
        logger.info(f"Region {region_code}: {len(municipalities)} municipalities (Total: {total_municipalities})")
    
    # Create FeatureCollection
    feature_collection = {
        "type": "FeatureCollection",
        "features": all_features,
        "metadata": {
            "source": "faeldon/philippines-json-maps",
            "license": "MIT",
            "data_vintage": "PSGC December 31, 2023",
            "coordinate_system": "WGS84/EPSG:4326",
            "resolution": resolution,
            "tolerance": RESOLUTION_MAP[resolution],
            "total_municipalities": total_municipalities,
            "generated_by": "GAIA download_municipality_boundaries.py"
        }
    }
    
    # Write to file
    logger.info(f"Writing {total_municipalities} municipalities to {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(feature_collection, f, ensure_ascii=False)
    
    # Get file size
    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    logger.info(f"✓ Successfully created {output_file}")
    logger.info(f"  Total municipalities: {total_municipalities}")
    logger.info(f"  File size: {file_size_mb:.2f} MB")
    
    # Validate GeoJSON structure
    logger.info("Validating GeoJSON structure...")
    sample_count = min(5, len(all_features))
    for i, feature in enumerate(all_features[:sample_count]):
        props = feature.get("properties", {})
        logger.info(f"  Sample {i+1}: {props.get('adm3_en', 'Unknown')} "
                   f"(PSGC: {props.get('adm3_psgc', 'N/A')})")


def download_provinces(resolution: str = "lowres", output_dir: Path = None) -> None:
    """
    Download and aggregate all province boundaries into a single GeoJSON file.
    
    Args:
        resolution: File resolution (lowres, medres, hires)
        output_dir: Output directory for provinces.geojson
    """
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "frontend" / "public" / "data" / "boundaries"
    
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "provinces.geojson"
    
    logger.info(f"Starting province boundary aggregation (resolution: {resolution})")
    logger.info(f"Output: {output_file}")
    
    all_features = []
    total_provinces = 0
    
    # Process each region
    for region_code in sorted(REGIONS.keys()):
        region_name = REGIONS[region_code]
        tolerance = RESOLUTION_MAP[resolution]
        region_psgc = int(region_code) * 100000000
        
        url = f"{GITHUB_REPO_BASE}/regions/{resolution}/provdists-region-{region_psgc}.{tolerance}.json"
        
        logger.info(f"Downloading provinces for Region {region_code} ({region_name})")
        
        try:
            province_data = download_geojson(url)
            
            if province_data and "features" in province_data:
                all_features.extend(province_data["features"])
                total_provinces += len(province_data["features"])
                logger.info(f"  Found {len(province_data['features'])} provinces")
            else:
                logger.warning(f"  No province data for region {region_code}")
                
        except Exception as e:
            logger.error(f"  Error downloading provinces for region {region_code}: {e}")
            continue
    
    # Create FeatureCollection
    feature_collection = {
        "type": "FeatureCollection",
        "features": all_features,
        "metadata": {
            "source": "faeldon/philippines-json-maps",
            "license": "MIT",
            "data_vintage": "PSGC December 31, 2023",
            "coordinate_system": "WGS84/EPSG:4326",
            "resolution": resolution,
            "tolerance": RESOLUTION_MAP[resolution],
            "total_provinces": total_provinces,
            "generated_by": "GAIA download_municipality_boundaries.py"
        }
    }
    
    # Write to file
    logger.info(f"Writing {total_provinces} provinces to {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(feature_collection, f, ensure_ascii=False)
    
    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    logger.info(f"✓ Successfully created {output_file}")
    logger.info(f"  Total provinces: {total_provinces}")
    logger.info(f"  File size: {file_size_mb:.2f} MB")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Download and aggregate Philippine municipality boundaries from faeldon/philippines-json-maps"
    )
    parser.add_argument(
        "--resolution",
        choices=["lowres", "medres", "hires"],
        default=DEFAULT_RESOLUTION,  # Now defaults to hires for better boundary detail
        help="GeoJSON resolution (lowres=0.1%%, medres=1%%, hires=10%% simplification)"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Output directory (default: frontend/public/data/boundaries/)"
    )
    parser.add_argument(
        "--provinces-only",
        action="store_true",
        help="Download only province boundaries (skip municipalities)"
    )
    parser.add_argument(
        "--municipalities-only",
        action="store_true",
        help="Download only municipality boundaries (skip provinces)"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        if args.municipalities_only:
            aggregate_municipalities(args.resolution, args.output_dir)
        elif args.provinces_only:
            download_provinces(args.resolution, args.output_dir)
        else:
            # Download both by default
            download_provinces(args.resolution, args.output_dir)
            aggregate_municipalities(args.resolution, args.output_dir)
            
        logger.info("✓ Download complete!")
        
    except KeyboardInterrupt:
        logger.warning("\nDownload interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
