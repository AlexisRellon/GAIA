"""
Unit tests for the geocoding utility module.

Tests cover:
- Successful geocoding with valid responses
- Empty/missing location strings
- Invalid coordinates outside Philippine bounds
- API timeout and network errors
- Malformed JSON responses
- Rate limiting behavior
"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
import httpx
import requests

from backend.python.utils.geocoding import (
    get_coordinates_from_nominatim_async,
    get_coordinates_from_nominatim_sync,
    get_centroid_from_geocoding,
    _is_within_philippine_bounds,
    _prepare_query_string,
    _parse_nominatim_response,
)


# =============================================================================
# Test Helper Functions
# =============================================================================

class TestIsWithinPhilippineBounds:
    """Tests for _is_within_philippine_bounds helper function."""
    
    def test_valid_manila_coordinates(self):
        """Test coordinates within Manila are valid."""
        assert _is_within_philippine_bounds(14.5995, 120.9842) is True
    
    def test_valid_davao_coordinates(self):
        """Test coordinates within Davao are valid."""
        assert _is_within_philippine_bounds(7.1907, 125.4553) is True
    
    def test_valid_boundary_coordinates(self):
        """Test coordinates at boundary edges are valid."""
        assert _is_within_philippine_bounds(4.0, 116.0) is True
        assert _is_within_philippine_bounds(21.0, 127.0) is True
    
    def test_invalid_coordinates_south(self):
        """Test coordinates south of Philippines are invalid."""
        assert _is_within_philippine_bounds(3.9, 120.0) is False
    
    def test_invalid_coordinates_north(self):
        """Test coordinates north of Philippines are invalid."""
        assert _is_within_philippine_bounds(21.1, 120.0) is False
    
    def test_invalid_coordinates_west(self):
        """Test coordinates west of Philippines are invalid."""
        assert _is_within_philippine_bounds(14.0, 115.9) is False
    
    def test_invalid_coordinates_east(self):
        """Test coordinates east of Philippines are invalid."""
        assert _is_within_philippine_bounds(14.0, 127.1) is False
    
    def test_zero_zero_coordinates(self):
        """Test (0, 0) coordinates are invalid (Gulf of Guinea)."""
        assert _is_within_philippine_bounds(0.0, 0.0) is False


class TestPrepareQueryString:
    """Tests for _prepare_query_string helper function."""
    
    def test_adds_philippines_suffix(self):
        """Test that 'Philippines' is added to location string."""
        result = _prepare_query_string("Biclatan, General Trias")
        assert result == "Biclatan, General Trias, Philippines"
    
    def test_does_not_duplicate_philippines(self):
        """Test that 'Philippines' is not duplicated if already present."""
        result = _prepare_query_string("Biclatan, General Trias, Philippines")
        assert result == "Biclatan, General Trias, Philippines"
    
    def test_strips_whitespace(self):
        """Test that whitespace is stripped."""
        result = _prepare_query_string("  Biclatan, General Trias  ")
        assert result == "Biclatan, General Trias, Philippines"


class TestParseNominatimResponse:
    """Tests for _parse_nominatim_response helper function."""
    
    def test_successful_parsing(self):
        """Test successful parsing of valid response."""
        results = [{'lat': '14.5995', 'lon': '120.9842'}]
        coords = _parse_nominatim_response(results, "Manila")
        assert coords is not None
        assert coords['latitude'] == 14.5995
        assert coords['longitude'] == 120.9842
    
    def test_empty_results(self):
        """Test parsing returns None for empty results."""
        coords = _parse_nominatim_response([], "Unknown Location")
        assert coords is None
    
    def test_none_results(self):
        """Test parsing returns None for None results."""
        coords = _parse_nominatim_response(None, "Unknown Location")
        assert coords is None
    
    def test_missing_lat(self):
        """Test parsing returns None when 'lat' is missing."""
        results = [{'lon': '120.9842'}]
        coords = _parse_nominatim_response(results, "Manila")
        assert coords is None
    
    def test_missing_lon(self):
        """Test parsing returns None when 'lon' is missing."""
        results = [{'lat': '14.5995'}]
        coords = _parse_nominatim_response(results, "Manila")
        assert coords is None
    
    def test_invalid_lat_value(self):
        """Test parsing returns None for invalid lat value."""
        results = [{'lat': 'invalid', 'lon': '120.9842'}]
        coords = _parse_nominatim_response(results, "Manila")
        assert coords is None
    
    def test_coordinates_outside_bounds(self):
        """Test parsing returns None for coordinates outside Philippine bounds."""
        results = [{'lat': '0.0', 'lon': '0.0'}]  # Gulf of Guinea
        coords = _parse_nominatim_response(results, "Somewhere")
        assert coords is None


# =============================================================================
# Test Sync Geocoding Function
# =============================================================================

class TestGetCoordinatesFromNominatimSync:
    """Tests for get_coordinates_from_nominatim_sync function."""
    
    def test_empty_location_string(self):
        """Test that empty location string returns None."""
        result = get_coordinates_from_nominatim_sync("")
        assert result is None
    
    def test_whitespace_only_location_string(self):
        """Test that whitespace-only location string returns None."""
        result = get_coordinates_from_nominatim_sync("   ")
        assert result is None
    
    def test_none_location_string(self):
        """Test that None location string returns None."""
        result = get_coordinates_from_nominatim_sync(None)
        assert result is None
    
    @patch('backend.python.utils.geocoding.requests.get')
    def test_successful_geocoding(self, mock_get):
        """Test successful geocoding with mocked API response."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {'lat': '14.5995', 'lon': '120.9842'}
        ]
        mock_get.return_value = mock_response
        
        result = get_coordinates_from_nominatim_sync("Manila")
        
        assert result is not None
        assert result['latitude'] == 14.5995
        assert result['longitude'] == 120.9842
    
    @patch('backend.python.utils.geocoding.requests.get')
    def test_no_results(self, mock_get):
        """Test geocoding returns None when no results found."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = []
        mock_get.return_value = mock_response
        
        result = get_coordinates_from_nominatim_sync("Unknown Location XYZ")
        
        assert result is None
    
    @patch('backend.python.utils.geocoding.requests.get')
    def test_timeout_error(self, mock_get):
        """Test geocoding handles timeout gracefully."""
        mock_get.side_effect = requests.exceptions.Timeout("Connection timed out")
        
        result = get_coordinates_from_nominatim_sync("Manila")
        
        assert result is None
    
    @patch('backend.python.utils.geocoding.requests.get')
    def test_network_error(self, mock_get):
        """Test geocoding handles network errors gracefully."""
        mock_get.side_effect = requests.exceptions.RequestException("Network error")
        
        result = get_coordinates_from_nominatim_sync("Manila")
        
        assert result is None
    
    @patch('backend.python.utils.geocoding.requests.get')
    def test_invalid_json_response(self, mock_get):
        """Test geocoding handles invalid JSON gracefully."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.side_effect = ValueError("Invalid JSON")
        mock_get.return_value = mock_response
        
        result = get_coordinates_from_nominatim_sync("Manila")
        
        assert result is None
    
    @patch('backend.python.utils.geocoding.requests.get')
    def test_coordinates_outside_bounds(self, mock_get):
        """Test geocoding returns None for coordinates outside Philippine bounds."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {'lat': '35.6762', 'lon': '139.6503'}  # Tokyo, Japan
        ]
        mock_get.return_value = mock_response
        
        result = get_coordinates_from_nominatim_sync("Tokyo")
        
        assert result is None


# =============================================================================
# Test Async Geocoding Function
# =============================================================================

class TestGetCoordinatesFromNominatimAsync:
    """Tests for get_coordinates_from_nominatim_async function."""
    
    @pytest.mark.asyncio
    async def test_empty_location_string(self):
        """Test that empty location string returns None."""
        result = await get_coordinates_from_nominatim_async("")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_whitespace_only_location_string(self):
        """Test that whitespace-only location string returns None."""
        result = await get_coordinates_from_nominatim_async("   ")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_none_location_string(self):
        """Test that None location string returns None."""
        result = await get_coordinates_from_nominatim_async(None)
        assert result is None
    
    @pytest.mark.asyncio
    @patch('backend.python.utils.geocoding.httpx.AsyncClient')
    async def test_successful_geocoding(self, mock_client_class):
        """Test successful geocoding with mocked API response."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {'lat': '14.5995', 'lon': '120.9842'}
        ]
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client_class.return_value = mock_client
        
        result = await get_coordinates_from_nominatim_async("Manila")
        
        assert result is not None
        assert result['latitude'] == 14.5995
        assert result['longitude'] == 120.9842
    
    @pytest.mark.asyncio
    @patch('backend.python.utils.geocoding.httpx.AsyncClient')
    async def test_no_results(self, mock_client_class):
        """Test geocoding returns None when no results found."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = []
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client_class.return_value = mock_client
        
        result = await get_coordinates_from_nominatim_async("Unknown Location XYZ")
        
        assert result is None
    
    @pytest.mark.asyncio
    @patch('backend.python.utils.geocoding.httpx.AsyncClient')
    async def test_timeout_error(self, mock_client_class):
        """Test geocoding handles timeout gracefully."""
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.TimeoutException("Connection timed out")
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client_class.return_value = mock_client
        
        result = await get_coordinates_from_nominatim_async("Manila")
        
        assert result is None
    
    @pytest.mark.asyncio
    @patch('backend.python.utils.geocoding.httpx.AsyncClient')
    async def test_network_error(self, mock_client_class):
        """Test geocoding handles network errors gracefully."""
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.RequestError("Network error")
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client_class.return_value = mock_client
        
        result = await get_coordinates_from_nominatim_async("Manila")
        
        assert result is None


# =============================================================================
# Test Centroid Geocoding Function
# =============================================================================

class TestGetCentroidFromGeocoding:
    """Tests for get_centroid_from_geocoding function."""
    
    @patch('backend.python.utils.geocoding.get_coordinates_from_nominatim_sync')
    def test_with_barangay_and_municipality(self, mock_sync):
        """Test centroid geocoding with barangay and municipality."""
        mock_sync.return_value = {'latitude': 14.5, 'longitude': 120.9}
        
        hierarchy = {
            'barangay': 'Biclatan',
            'municipality': 'General Trias'
        }
        result = get_centroid_from_geocoding('Biclatan', hierarchy)
        
        assert result is not None
        assert result['latitude'] == 14.5
        assert result['longitude'] == 120.9
        mock_sync.assert_called_once_with('Biclatan, General Trias')
    
    @patch('backend.python.utils.geocoding.get_coordinates_from_nominatim_sync')
    def test_with_province_only(self, mock_sync):
        """Test centroid geocoding with province only."""
        mock_sync.return_value = {'latitude': 14.5, 'longitude': 120.9}
        
        hierarchy = {
            'province': 'Cavite'
        }
        result = get_centroid_from_geocoding('Cavite', hierarchy)
        
        assert result is not None
        mock_sync.assert_called_once_with('Cavite')
    
    @patch('backend.python.utils.geocoding.get_coordinates_from_nominatim_sync')
    def test_with_empty_hierarchy(self, mock_sync):
        """Test centroid geocoding with empty hierarchy uses name."""
        mock_sync.return_value = {'latitude': 14.5, 'longitude': 120.9}
        
        hierarchy = {}
        result = get_centroid_from_geocoding('Metro Manila', hierarchy)
        
        assert result is not None
        mock_sync.assert_called_once_with('Metro Manila')
    
    @patch('backend.python.utils.geocoding.get_coordinates_from_nominatim_sync')
    def test_geocoding_fails(self, mock_sync):
        """Test centroid geocoding returns None when geocoding fails."""
        mock_sync.return_value = None
        
        hierarchy = {'municipality': 'Unknown Place'}
        result = get_centroid_from_geocoding('Unknown', hierarchy)
        
        assert result is None
