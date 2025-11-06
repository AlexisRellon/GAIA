"""
Unit tests for ClimateNLIClassifier (Zero-Shot Classification).
Tests model loading, classification accuracy, batch processing, and error handling.
"""

import pytest
import os
from backend.python.models.classifier import ClimateNLIClassifier


class TestClimateNLIClassifier:
    """Test suite for Zero-Shot Classifier"""
    
    @pytest.fixture
    def classifier(self):
        """Create a classifier instance for testing"""
        return ClimateNLIClassifier(cache_dir='/tmp/test_cache')
    
    def test_classifier_initialization(self, classifier):
        """Test classifier initializes with correct parameters"""
        assert classifier.model_name == 'facebook/bart-large-mnli'
        assert classifier.model is None  # Not loaded yet
        assert len(classifier.categories) == 10
        assert 'flooding' in classifier.categories
        assert 'typhoon' in classifier.categories
    
    def test_get_categories(self, classifier):
        """Test get_categories returns all hazard types"""
        categories = classifier.get_categories()
        assert len(categories) == 10
        assert 'flooding' in categories
        assert 'fire' in categories
        assert 'earthquake' in categories
        assert 'typhoon' in categories
        assert 'landslide' in categories
        assert 'volcanic eruption' in categories
        assert 'drought' in categories
        assert 'tsunami' in categories
        assert 'storm surge' in categories
        assert 'tornado' in categories
    
    def test_model_loading(self, classifier):
        """Test model loads successfully"""
        classifier.load_model()
        assert classifier.model is not None
    
    def test_classify_flooding_text(self, classifier):
        """Test classification of flooding-related text"""
        text = "Heavy rainfall caused severe flooding in Metro Manila. " \
               "Streets are submerged and residents are evacuated."
        
        result = classifier.classify(text, threshold=0.5)
        
        assert 'hazard_type' in result
        assert 'score' in result
        assert 'is_hazard' in result
        assert result['is_hazard'] is True
        assert result['hazard_type'] in classifier.categories
        assert result['score'] > 0.5
    
    def test_classify_typhoon_text(self, classifier):
        """Test classification of typhoon-related text"""
        text = "Super Typhoon Yolanda made landfall in Tacloban City " \
               "with winds exceeding 300 km/h, causing widespread destruction."
        
        result = classifier.classify(text, threshold=0.5)
        
        assert result['is_hazard'] is True
        assert result['hazard_type'] == 'typhoon'
        assert result['score'] > 0.7  # Should have high confidence
    
    def test_classify_fire_text(self, classifier):
        """Test classification of fire-related text"""
        text = "A massive fire broke out in Quezon City destroying hundreds of homes. " \
               "Firefighters are battling the blaze."
        
        result = classifier.classify(text, threshold=0.5)
        
        assert result['is_hazard'] is True
        assert result['hazard_type'] == 'fire'
        assert result['score'] > 0.6
    
    def test_classify_earthquake_text(self, classifier):
        """Test classification of earthquake-related text"""
        text = "A magnitude 7.2 earthquake struck Mindanao this morning, " \
               "causing buildings to collapse and widespread panic."
        
        result = classifier.classify(text, threshold=0.5)
        
        assert result['is_hazard'] is True
        assert result['hazard_type'] == 'earthquake'
        assert result['score'] > 0.6
    
    def test_classify_non_hazard_text(self, classifier):
        """Test classification of non-hazard text"""
        text = "The mayor announced new infrastructure projects for the city. " \
               "Construction will begin next month."
        
        result = classifier.classify(text, threshold=0.5)
        
        # Non-hazard text should have low scores
        assert result['score'] < 0.6  # Below typical hazard threshold
    
    def test_classify_empty_text(self, classifier):
        """Test classification with empty text"""
        result = classifier.classify("", threshold=0.5)
        
        assert result['hazard_type'] is None
        assert result['score'] == 0.0
        assert result['is_hazard'] is False
    
    def test_classify_threshold_filtering(self, classifier):
        """Test that threshold filters low-confidence predictions"""
        text = "Weather update: partly cloudy with chance of rain."
        
        # High threshold should filter out low-confidence predictions
        result = classifier.classify(text, threshold=0.8)
        
        if result['score'] < 0.8:
            assert result['hazard_type'] is None
            assert result['is_hazard'] is False
    
    def test_classify_returns_all_scores(self, classifier):
        """Test that classify returns scores for all categories"""
        text = "Flooding reported in several areas after heavy rain."
        
        result = classifier.classify(text, threshold=0.5)
        
        assert 'all_scores' in result
        assert len(result['all_scores']) == 10
        
        # All scores should sum to approximately 1.0 (softmax distribution)
        total_score = sum(result['all_scores'].values())
        assert 0.95 <= total_score <= 1.05  # Allow for floating point errors
    
    def test_classify_batch_empty_list(self, classifier):
        """Test batch classification with empty list"""
        results = classifier.classify_batch([])
        assert results == []
    
    def test_classify_batch_single_text(self, classifier):
        """Test batch classification with single text"""
        texts = ["Flooding in Manila"]
        results = classifier.classify_batch(texts, threshold=0.5)
        
        assert len(results) == 1
        assert 'hazard_type' in results[0]
        assert 'score' in results[0]
    
    def test_classify_batch_multiple_texts(self, classifier):
        """Test batch classification with multiple texts"""
        texts = [
            "Severe flooding in Metro Manila due to heavy rainfall",
            "Fire destroys residential area in Quezon City",
            "Magnitude 6.5 earthquake felt in Mindanao",
            "Typhoon Karding approaches Luzon with strong winds"
        ]
        
        results = classifier.classify_batch(texts, threshold=0.5)
        
        assert len(results) == 4
        
        # Check that different hazard types are identified
        hazard_types = [r['hazard_type'] for r in results if r['is_hazard']]
        assert len(set(hazard_types)) >= 2  # At least 2 different hazard types
    
    def test_classify_batch_performance(self, classifier):
        """Test batch classification performance"""
        import time
        
        texts = [
            "Flooding in Manila",
            "Fire in Quezon City",
            "Earthquake in Mindanao"
        ] * 10  # 30 texts total
        
        start_time = time.time()
        results = classifier.classify_batch(texts, threshold=0.5)
        elapsed_time = time.time() - start_time
        
        assert len(results) == 30
        assert elapsed_time < 60  # Should complete in under 60 seconds
    
    def test_model_caching(self, classifier):
        """Test that model is cached after first load"""
        classifier.load_model()
        model_ref1 = classifier.model
        
        # Load again - should return same model instance
        classifier.load_model()
        model_ref2 = classifier.model
        
        assert model_ref1 is model_ref2  # Same object reference
    
    def test_custom_threshold(self, classifier):
        """Test classification with custom thresholds"""
        text = "Moderate rainfall expected in northern Luzon"
        
        # Low threshold
        result_low = classifier.classify(text, threshold=0.3)
        
        # High threshold
        result_high = classifier.classify(text, threshold=0.8)
        
        # Score should be the same, but is_hazard flag differs
        assert result_low['score'] == result_high['score']
        
        if 0.3 <= result_low['score'] < 0.8:
            assert result_low['is_hazard'] is True
            assert result_high['is_hazard'] is False
    
    def test_philippine_context(self, classifier):
        """Test classification with Philippine locations and context"""
        texts = [
            "Flooding in Taguig City after Marikina River overflowed",
            "Fire in Tondo, Manila destroys 200 homes",
            "Earthquake felt in Davao City, magnitude 6.0",
            "Typhoon Odette hits Cebu with 150 km/h winds"
        ]
        
        for text in texts:
            result = classifier.classify(text, threshold=0.5)
            assert result['is_hazard'] is True
            assert result['hazard_type'] is not None


@pytest.mark.integration
class TestClassifierIntegration:
    """Integration tests requiring actual model downloads"""
    
    def test_full_pipeline_rss_simulation(self):
        """Simulate RSS article classification pipeline"""
        classifier = ClimateNLIClassifier()
        classifier.load_model()
        
        # Simulated RSS articles
        articles = [
            {
                'title': 'Heavy floods hit Metro Manila',
                'description': 'Severe flooding reported across several cities in Metro Manila due to continuous heavy rainfall.'
            },
            {
                'title': 'Fire in residential area',
                'description': 'A large fire broke out in a residential area of Quezon City, destroying multiple homes.'
            },
            {
                'title': 'President announces infrastructure projects',
                'description': 'The president announced new infrastructure projects to boost economic development.'
            }
        ]
        
        results = []
        for article in articles:
            text = f"{article['title']}. {article['description']}"
            result = classifier.classify(text, threshold=0.5)
            results.append(result)
        
        # First two should be hazards, third should not
        assert results[0]['is_hazard'] is True
        assert results[1]['is_hazard'] is True
        # Third may or may not be classified as hazard depending on model


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
