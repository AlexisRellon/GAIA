"""
Boundaries API - Serve Philippine administrative boundaries by location
Provides on-demand GeoJSON boundaries for cities/municipalities to avoid
loading large files in the browser.

Part of GV-01: Philippine Administrative Boundaries
"""

import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from philippine_regions import (
    get_region_from_location,
    PHILIPPINE_ADMIN_MAPPING,
    normalize_location_with_region
)
from backend.python.middleware.rate_limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/boundaries", tags=["boundaries"])

# Path to GeoJSON boundary files
BOUNDARIES_DATA_DIR = Path(__file__).parent.parent.parent / "frontend" / "public" / "data" / "boundaries"


def load_geojson_file(filename: str) -> Optional[Dict[str, Any]]:
    """Load and parse a GeoJSON file."""
    filepath = BOUNDARIES_DATA_DIR / filename
    
    if not filepath.exists():
        logger.warning(f"GeoJSON file not found: {filepath}")
        return None
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading GeoJSON file {filepath}: {e}")
        return None


def extract_feature_by_name(geojson: Dict[str, Any], location_name: str, field_priority: list = None) -> Optional[Dict[str, Any]]:
    """Extract a specific feature from GeoJSON by name with field priority."""
    if not geojson or geojson.get('type') != 'FeatureCollection':
        return None
    
    features = geojson.get('features', [])
    location_lower = location_name.lower().strip()
    
    if field_priority is None:
        field_priority = ['adm3_en', 'adm2_en', 'adm1_en', 'name']
    
    for feature in features:
        properties = feature.get('properties', {})
        for field in field_priority:
            if field in properties:
                feature_name = str(properties[field]).lower().strip()
                if location_lower == feature_name or location_lower in feature_name:
                    return feature
    return None


@router.get("/health")
@limiter.limit("60/minute")  # Allow 60 health checks per minute for monitoring
async def health_check(request: Request):
    """Health check endpoint."""
    regions_file = BOUNDARIES_DATA_DIR / "regions.geojson"
    provinces_file = BOUNDARIES_DATA_DIR / "provinces.geojson"
    municipalities_file = BOUNDARIES_DATA_DIR / "municipalities.geojson"
    
    return {
        "status": "healthy" if all([f.exists() for f in [regions_file, provinces_file, municipalities_file]]) else "degraded",
        "files": {
            "regions": {"exists": regions_file.exists(), "size_mb": round(regions_file.stat().st_size / 1024 / 1024, 2) if regions_file.exists() else 0},
            "provinces": {"exists": provinces_file.exists(), "size_mb": round(provinces_file.stat().st_size / 1024 / 1024, 2) if provinces_file.exists() else 0},
            "municipalities": {"exists": municipalities_file.exists(), "size_mb": round(municipalities_file.stat().st_size / 1024 / 1024, 2) if municipalities_file.exists() else 0}
        }
    }


@router.get("/{location_name}")
@limiter.limit("20/minute")  # Limit boundary requests to 20 per minute per IP
async def get_location_boundary(location_name: str, request: Request):
    """Get GeoJSON boundary for location (municipality > province > region priority)."""
    logger.info(f"Boundary request: {location_name}")
    location_clean = location_name.strip()[:100]
    
    if not location_clean:
        raise HTTPException(status_code=400, detail="Invalid location name")
    
    # Try as city first, then as province
    region_data = get_region_from_location(city=location_clean)
    if not region_data:
        region_data = get_region_from_location(province=location_clean)
    
    # Case-insensitive fallback
    if not region_data:
        for key in PHILIPPINE_ADMIN_MAPPING.keys():
            if key.lower() == location_clean.lower():
                region_data = get_region_from_location(city=key)
                if not region_data:
                    region_data = get_region_from_location(province=key)
                location_clean = key
                break
    
    if not region_data:
        raise HTTPException(status_code=404, detail=f"Location '{location_name}' not found")
    
    region = region_data.get('region')
    province = region_data.get('province')
    region_name = region_data.get('region_name')
    
    feature = None
    boundary_level = None
    
    # Try municipality first
    municipalities_geojson = load_geojson_file("municipalities.geojson")
    if municipalities_geojson:
        feature = extract_feature_by_name(municipalities_geojson, location_clean, ['adm3_en'])
        if feature:
            boundary_level = "municipality"
            logger.info(f"Municipality boundary: {location_clean}")
    
    # Try province
    if not feature:
        provinces_geojson = load_geojson_file("provinces.geojson")
        if provinces_geojson:
            feature = extract_feature_by_name(provinces_geojson, province, ['adm2_en'])
            if feature:
                boundary_level = "province"
                logger.info(f"Province boundary: {province}")
    
    # Fallback to region
    if not feature:
        regions_geojson = load_geojson_file("regions.geojson")
        if not regions_geojson:
            raise HTTPException(status_code=500, detail="Boundary data unavailable")
        feature = extract_feature_by_name(regions_geojson, region_name, ['adm1_en'])
        if feature:
            boundary_level = "region"
            logger.info(f"Region fallback: {region_name}")
    
    if not feature:
        raise HTTPException(status_code=404, detail=f"Boundary not found for {location_name}")
    
    if 'properties' not in feature:
        feature['properties'] = {}
    
    feature['properties'].update({
        'searched_location': location_clean,
        'city': location_clean,
        'province': province,
        'region': region,
        'region_name': region_name,
        'boundary_level': boundary_level,
        'highlight': True
    })
    
    return JSONResponse(content={
        "type": "FeatureCollection",
        "features": [feature],
        "metadata": {
            "location": location_clean,
            "province": province,
            "region": region,
            "region_name": region_name,
            "boundary_level": boundary_level
        }
    })
