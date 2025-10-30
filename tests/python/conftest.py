"""
Pytest configuration for GAIA backend tests
"""
import pytest
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

@pytest.fixture(scope="session")
def test_config():
    """Test configuration fixture"""
    return {
        "supabase_url": os.getenv("SUPABASE_URL", "http://localhost:54322"),
        "supabase_anon_key": os.getenv("SUPABASE_ANON_KEY", "test-key"),
        "min_confidence": float(os.getenv("MIN_CONFIDENCE_THRESHOLD", "0.7")),
    }

@pytest.fixture(scope="session")
def mock_hazard_data():
    """Mock hazard data for testing"""
    return [
        {
            "type": "Typhoon",
            "location": "Manila",
            "coordinates": {"lat": 14.5995, "lng": 120.9842},
            "confidence": 0.95,
            "source": "RSS"
        },
        {
            "type": "Flood",
            "location": "Quezon City",
            "coordinates": {"lat": 14.6760, "lng": 121.0437},
            "confidence": 0.82,
            "source": "Citizen Report"
        }
    ]

@pytest.fixture(scope="session")
def mock_philippine_boundaries():
    """Mock Philippine administrative boundaries for testing"""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "Metro Manila", "type": "region"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [120.9, 14.4],
                        [121.1, 14.4],
                        [121.1, 14.8],
                        [120.9, 14.8],
                        [120.9, 14.4]
                    ]]
                }
            }
        ]
    }
