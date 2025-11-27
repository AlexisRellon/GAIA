"""
Geocoding Utility Module

Provides shared geocoding functionality using the OpenStreetMap Nominatim API.
This module centralizes all Nominatim API interactions to ensure:
- Consistent rate limiting (1 request per second as per Nominatim usage policy)
- Proper error handling
- Philippine bounds validation
- Compliance with Nominatim usage policies

Usage:
    # Async version (for FastAPI endpoints)
    from backend.python.utils.geocoding import get_coordinates_from_nominatim_async
    coords = await get_coordinates_from_nominatim_async("Biclatan, General Trias")
    
    # Sync version (for scripts/batch processing)
    from backend.python.utils.geocoding import get_coordinates_from_nominatim_sync
    coords = get_coordinates_from_nominatim_sync("Biclatan, General Trias")
"""

import asyncio
import logging
import time
import threading
from typing import Dict, Optional

import httpx
import requests

logger = logging.getLogger(__name__)

# Shared rate limiting state using a thread-safe lock
# This ensures the 1-second interval is enforced across all Nominatim API calls application-wide
_nominatim_lock = threading.Lock()
_last_nominatim_call_time: float = 0

# Philippine geographic bounds (4-21°N, 116-127°E)
PH_LAT_MIN = 4.0
PH_LAT_MAX = 21.0
PH_LON_MIN = 116.0
PH_LON_MAX = 127.0

# Nominatim API configuration
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_USER_AGENT = "gaia_hazard_detection/1.0"
NOMINATIM_TIMEOUT = 10


def _is_within_philippine_bounds(lat: float, lon: float) -> bool:
    """Check if coordinates are within Philippine geographic bounds."""
    return PH_LAT_MIN <= lat <= PH_LAT_MAX and PH_LON_MIN <= lon <= PH_LON_MAX


def _prepare_query_string(location_string: str) -> str:
    """
    Prepare the query string for Nominatim API.
    Adds 'Philippines' suffix if not already present for better geographic precision.
    """
    location_string = location_string.strip()
    if "Philippines" not in location_string:
        return f"{location_string}, Philippines"
    return location_string


def _build_nominatim_params(query: str) -> Dict[str, str]:
    """Build the query parameters for Nominatim API request."""
    return {
        'q': query,
        'format': 'jsonv2',
        'limit': '1',
        'addressdetails': '1',
        'countrycodes': 'ph'
    }


def _get_headers() -> Dict[str, str]:
    """Get HTTP headers for Nominatim API request (required by usage policy)."""
    return {
        'User-Agent': NOMINATIM_USER_AGENT
    }


def _parse_nominatim_response(results: list, location_string: str) -> Optional[Dict[str, float]]:
    """
    Parse Nominatim API response and extract validated coordinates.
    
    Args:
        results: JSON response array from Nominatim API
        location_string: Original location string for logging
        
    Returns:
        Dict with 'latitude' and 'longitude' keys, or None if parsing fails
    """
    if not results or len(results) == 0:
        logger.debug(f"No geocoding results found for: {location_string}")
        return None
    
    best_result = results[0]
    
    # Explicitly check for presence of 'lat' and 'lon'
    if 'lat' not in best_result or 'lon' not in best_result:
        logger.error(f"Missing lat/lon in geocoding response for {location_string}")
        return None
    
    try:
        lat = float(best_result['lat'])
        lon = float(best_result['lon'])
    except (ValueError, TypeError) as e:
        logger.error(f"Error converting lat/lon to float for {location_string}: {str(e)}")
        return None
    
    # Validate coordinates are within Philippine bounds
    if not _is_within_philippine_bounds(lat, lon):
        # Do NOT log actual coordinates per Data Privacy Act (RA 10173)
        logger.warning("Geocoded coordinates outside Philippine bounds for location")
        return None
    
    return {
        'latitude': lat,
        'longitude': lon
    }


async def get_coordinates_from_nominatim_async(location_string: str) -> Optional[Dict[str, float]]:
    """
    Get coordinates from OpenStreetMap Nominatim API (async version).
    
    This function is designed for use in FastAPI async endpoints.
    Uses httpx for async HTTP requests and asyncio.sleep for rate limiting.
    
    Args:
        location_string: Location name or address string from report
                        (e.g., "Biclatan, General Trias")
        
    Returns:
        Dict with 'latitude' and 'longitude' keys, or None if geocoding fails
        
    Example:
        >>> coords = await get_coordinates_from_nominatim_async("Biclatan, General Trias")
        >>> # Returns: {'latitude': 14.3456, 'longitude': 120.7890}
    """
    global _last_nominatim_call_time
    
    # Validate input
    if not location_string or not location_string.strip():
        logger.debug("Empty location string provided for geocoding")
        return None
    
    query_string = _prepare_query_string(location_string)
    
    try:
        # Rate limiting: Wait 1 second between requests (Nominatim requirement)
        # Use thread lock to coordinate with sync version
        sleep_time = 0.0
        with _nominatim_lock:
            current_time = time.time()
            time_since_last = current_time - _last_nominatim_call_time
            if time_since_last < 1.0:
                sleep_time = 1.0 - time_since_last
        
        # Perform the async sleep outside the lock
        if sleep_time > 0:
            await asyncio.sleep(sleep_time)
        
        # Make async HTTP request
        async with httpx.AsyncClient(timeout=NOMINATIM_TIMEOUT) as client:
            response = await client.get(
                NOMINATIM_BASE_URL,
                params=_build_nominatim_params(query_string),
                headers=_get_headers()
            )
            response.raise_for_status()
        
        # Update last call time after successful request
        with _nominatim_lock:
            _last_nominatim_call_time = time.time()
        
        # Parse response
        results = response.json()
        coords = _parse_nominatim_response(results, location_string)
        
        if coords:
            logger.info(f"Successfully geocoded location using Nominatim: {location_string}")
        
        return coords
        
    except httpx.TimeoutException:
        logger.warning(f"Geocoding timeout for: {location_string}")
        return None
    
    except httpx.HTTPStatusError as e:
        logger.error(f"Geocoding HTTP error for {location_string}: {str(e)}")
        return None
    
    except httpx.RequestError as e:
        logger.error(f"Geocoding service error for {location_string}: {str(e)}")
        return None
    
    except (ValueError, KeyError) as e:
        logger.error(f"Error parsing geocoding response for {location_string}: {str(e)}")
        return None
    
    except Exception as e:
        logger.error(f"Unexpected geocoding error for {location_string}: {str(e)}")
        return None


def get_coordinates_from_nominatim_sync(location_string: str) -> Optional[Dict[str, float]]:
    """
    Get coordinates from OpenStreetMap Nominatim API (sync version).
    
    This function is designed for use in synchronous scripts like
    batch processing or data loading utilities.
    
    Args:
        location_string: Location name or address string
                        (e.g., "Biclatan, General Trias")
        
    Returns:
        Dict with 'latitude' and 'longitude' keys, or None if geocoding fails
        
    Example:
        >>> coords = get_coordinates_from_nominatim_sync("Biclatan, General Trias")
        >>> # Returns: {'latitude': 14.3456, 'longitude': 120.7890}
    """
    global _last_nominatim_call_time
    
    # Validate input
    if not location_string or not location_string.strip():
        logger.debug("Empty location string provided for geocoding")
        return None
    
    query_string = _prepare_query_string(location_string)
    
    try:
        # Rate limiting: Wait 1 second between requests (Nominatim requirement)
        with _nominatim_lock:
            current_time = time.time()
            time_since_last = current_time - _last_nominatim_call_time
            if time_since_last < 1.0:
                time.sleep(1.0 - time_since_last)
        
        # Make synchronous HTTP request
        response = requests.get(
            NOMINATIM_BASE_URL,
            params=_build_nominatim_params(query_string),
            headers=_get_headers(),
            timeout=NOMINATIM_TIMEOUT
        )
        response.raise_for_status()
        
        # Update last call time after successful request
        with _nominatim_lock:
            _last_nominatim_call_time = time.time()
        
        # Parse response
        results = response.json()
        coords = _parse_nominatim_response(results, location_string)
        
        if coords:
            logger.info(f"Successfully geocoded location using Nominatim: {location_string}")
        
        return coords
        
    except requests.exceptions.Timeout:
        logger.warning(f"Geocoding timeout for: {location_string}")
        return None
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Geocoding service error for {location_string}: {str(e)}")
        return None
    
    except (ValueError, KeyError) as e:
        logger.error(f"Error parsing geocoding response for {location_string}: {str(e)}")
        return None
    
    except Exception as e:
        logger.error(f"Unexpected geocoding error for {location_string}: {str(e)}")
        return None


def get_centroid_from_geocoding(name: str, hierarchy: Dict) -> Optional[Dict[str, float]]:
    """
    Get centroid coordinates for an administrative boundary using Nominatim.
    
    Builds a hierarchical query from the provided hierarchy dict
    (e.g., "Biclatan, General Trias, Philippines").
    
    Args:
        name: Name of the administrative unit
        hierarchy: Dict containing 'barangay', 'municipality', and/or 'province' keys
        
    Returns:
        Dict with 'latitude' and 'longitude', or None if geocoding fails
    """
    # Build hierarchical query
    query_parts = []
    if hierarchy.get('barangay'):
        query_parts.append(hierarchy['barangay'])
    if hierarchy.get('municipality'):
        query_parts.append(hierarchy['municipality'])
    elif hierarchy.get('province'):
        query_parts.append(hierarchy['province'])
    
    if not query_parts:
        query_parts.append(name)
    
    # Join parts and use sync version
    query = ', '.join(query_parts)
    return get_coordinates_from_nominatim_sync(query)
