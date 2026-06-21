"""
Unit tests for Geo-NER location extraction, specificity scoring, and sorting.
"""
# pyrefly: ignore [missing-import]
import pytest
from unittest.mock import MagicMock, patch
from backend.python.models.geo_ner import GeoNER

def test_specificity_score():
    """Test that different location types get the correct specificity score"""
    geo = GeoNER(ner_model_name='dummy', cache_dir='dummy')
    
    # 1. Street (score 1)
    assert geo._get_location_specificity_score({'location_name': 'Rizal Street', 'location_type': 'street'}) == 1
    
    # 2. Barangay (score 2)
    assert geo._get_location_specificity_score({'location_name': 'Barangay San Jose', 'location_type': 'barangay'}) == 2
    
    # 3. City / Municipality / Town (score 3)
    assert geo._get_location_specificity_score({'location_name': 'Cebu City', 'location_type': 'city'}) == 3
    assert geo._get_location_specificity_score({'location_name': 'Maasim', 'location_type': 'location', 'city': 'Maasim'}) == 3
    
    # 4. Landmark / Volcano (score 4)
    assert geo._get_location_specificity_score({'location_name': 'Mayon Volcano', 'location_type': 'volcano'}) == 4
    
    # 5. Province (score 5)
    assert geo._get_location_specificity_score({'location_name': 'Sarangani', 'location_type': 'province'}) == 5
    assert geo._get_location_specificity_score({'location_name': 'Sarangani', 'location_type': 'location', 'province': 'Sarangani'}) == 5
    
    # 6. General 'location' default fallback (score 6)
    assert geo._get_location_specificity_score({'location_name': 'Random Place', 'location_type': 'location'}) == 6
    
    # 7. Island groups / Regions (score 7)
    assert geo._get_location_specificity_score({'location_name': 'Mindanao', 'location_type': 'location'}) == 7
    assert geo._get_location_specificity_score({'location_name': 'NCR', 'location_type': 'region'}) == 7
    assert geo._get_location_specificity_score({'location_name': 'CALABARZON', 'location_type': 'location'}) == 7
    
    # 8. Country (score 8)
    assert geo._get_location_specificity_score({'location_name': 'Philippines', 'location_type': 'location'}) == 8


def test_location_sorting():
    """Test that locations list is sorted correctly by coordinate presence, specificity, and confidence"""
    geo = GeoNER(ner_model_name='dummy', cache_dir='dummy')
    
    locations = [
        # Rizal Street: score 1, no coords, conf 0.85
        {'location_name': 'Rizal Street', 'location_type': 'street', 'confidence': 0.85},
        # Mindanao: score 7, has coords, conf 0.99
        {'location_name': 'Mindanao', 'location_type': 'location', 'confidence': 0.99, 'latitude': 7.85, 'longitude': 125.15},
        # Sarangani: score 5, has coords, conf 0.95
        {'location_name': 'Sarangani', 'location_type': 'province', 'confidence': 0.95, 'latitude': 5.89, 'longitude': 125.26},
        # Maasim: score 3, has coords, conf 0.92
        {'location_name': 'Maasim', 'location_type': 'location', 'confidence': 0.92, 'latitude': 5.86, 'longitude': 125.08, 'city': 'Maasim'},
    ]
    
    def sort_key(loc):
        has_coords = 0 if (loc.get('latitude') is not None and loc.get('longitude') is not None) else 1
        spec_score = geo._get_location_specificity_score(loc)
        confidence = loc.get('confidence', 0.0)
        return (has_coords, spec_score, -confidence)
        
    sorted_locs = sorted(locations, key=sort_key)
    
    # Expected order:
    # 1. Maasim (has coords, specificity 3)
    # 2. Sarangani (has coords, specificity 5)
    # 3. Mindanao (has coords, specificity 7)
    # 4. Rizal Street (no coords, specificity 1)
    assert sorted_locs[0]['location_name'] == 'Maasim'
    assert sorted_locs[1]['location_name'] == 'Sarangani'
    assert sorted_locs[2]['location_name'] == 'Mindanao'
    assert sorted_locs[3]['location_name'] == 'Rizal Street'


@patch('backend.python.models.geo_ner.Nominatim')
@patch('backend.python.models.geo_ner.pipeline')
@patch('backend.python.models.geo_ner.AutoTokenizer')
@patch('backend.python.models.geo_ner.AutoModelForTokenClassification')
def test_extract_locations_end_to_end_sorting(mock_model, mock_tokenizer, mock_pipeline, mock_nominatim):
    """Test that extract_locations returns sorted results on a sample text"""
    # Mock NER pipeline output
    mock_ner = MagicMock()
    mock_ner.return_value = [
        {'entity_group': 'LOC', 'word': 'Mindanao', 'score': 0.99},
        {'entity_group': 'LOC', 'word': 'Maasim', 'score': 0.92},
    ]
    mock_pipeline.return_value = mock_ner
    
    # Mock geocoder result
    mock_geocoder = MagicMock()
    
    def mock_geocode(query, **kwargs):
        mock_loc = MagicMock()
        if 'Mindanao' in query:
            mock_loc.latitude = 7.85
            mock_loc.longitude = 125.15
            mock_loc.raw = {'address': {'region': 'Mindanao', 'country': 'Philippines'}}
            return mock_loc
        elif 'Maasim' in query:
            mock_loc.latitude = 5.86
            mock_loc.longitude = 125.08
            mock_loc.raw = {'address': {'municipality': 'Maasim', 'state': 'Sarangani', 'country': 'Philippines'}}
            return mock_loc
        elif 'Sarangani' in query:
            mock_loc.latitude = 5.89
            mock_loc.longitude = 125.26
            mock_loc.raw = {'address': {'state': 'Sarangani', 'country': 'Philippines'}}
            return mock_loc
        return None
        
    mock_geocoder.geocode = mock_geocode
    mock_nominatim.return_value = mock_geocoder
    
    # Initialize and load model (uses mocks)
    geo = GeoNER(ner_model_name='dummy', cache_dir='dummy')
    geo.load_model()
    
    # Sample text matching the scenario
    text = "Magnitude 7.8 earthquake hits Mindanao. It was located of Maasim, Sarangani."
    
    # Sarangani will be matched by patterns, Mindanao and Maasim by mock NER
    locations = geo.extract_locations(text)
    
    # Check that Maasim is first because it has coords and is the most specific (city/municipality)
    assert len(locations) >= 3
    assert locations[0]['location_name'] == 'Maasim'
    assert locations[0]['location_type'] == 'location' # From class default (updated from city coords dynamically)
    assert locations[0]['city'] == 'Maasim'
    assert locations[0]['province'] == 'Sarangani'
    
    # Check that Sarangani is second (province)
    assert locations[1]['location_name'] == 'Sarangani'
    assert locations[1]['location_type'] == 'province'
    
    # Check that Mindanao is third (region)
    assert locations[2]['location_name'] == 'Mindanao'
