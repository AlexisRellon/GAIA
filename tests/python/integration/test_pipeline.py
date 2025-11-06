"""
Integration tests for GAIA AI Pipeline.
Tests end-to-end workflow: RSS → Classification → Geo-NER → Output
"""

import pytest
import asyncio
import logging
from backend.python.models.classifier import classifier
from backend.python.models.geo_ner import geo_ner
from backend.python.pipeline.rss_processor import rss_processor

logger = logging.getLogger(__name__)


@pytest.fixture(scope="module")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.mark.integration
class TestAIPipelineIntegration:
    """Integration tests for complete AI pipeline"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Load models before tests"""
        classifier.load_model()
        geo_ner.load_model()
    
    def test_classifier_to_geo_ner_pipeline(self):
        """Test classification followed by location extraction"""
        text = "Severe flooding reported in Marikina City and Pasig after Marikina River overflowed. " \
               "Residents of Metro Manila are evacuating to higher ground."
        
        # Step 1: Classify
        classification = classifier.classify(text, threshold=0.5)
        assert classification['is_hazard'] is True
        assert classification['hazard_type'] in classifier.get_categories()
        
        # Step 2: Extract locations
        locations = geo_ner.extract_locations(text)
        assert len(locations) > 0
        
        # Verify location details
        location_names = [loc['location_name'] for loc in locations]
        assert any('Marikina' in name for name in location_names)
    
    def test_full_pipeline_with_rss_simulation(self):
        """Test complete pipeline with simulated RSS article"""
        article_text = "Typhoon Karding made landfall in Aurora province with winds of 150 km/h. " \
                      "Residents of Baler and nearby municipalities are urged to evacuate. " \
                      "The typhoon is expected to affect Central Luzon and Metro Manila."
        
        # Step 1: Classification
        classification = classifier.classify(article_text, threshold=0.5)
        assert classification['is_hazard'] is True
        assert classification['hazard_type'] == 'typhoon'
        assert classification['score'] > 0.7
        
        # Step 2: Location extraction
        locations = geo_ner.extract_locations(article_text)
        assert len(locations) >= 2
        
        # Verify location hierarchy
        for location in locations:
            assert 'location_name' in location
            assert 'location_type' in location
            assert 'confidence' in location
    
    @pytest.mark.asyncio
    async def test_rss_processor_basic(self):
        """Test RSS processor with simulated data"""
        test_feeds = ['https://www.gmanetwork.com/news/rss/news/']
        
        rss_processor.set_feeds(test_feeds)
        results = await rss_processor.process_all_feeds()
        
        assert len(results) == 1
        result = results[0]
        
        assert result['status'] in ['success', 'error']
        assert 'items_processed' in result
        assert 'items_added' in result


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-m', 'integration'])
