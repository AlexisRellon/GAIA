"""
Processing Pipeline Module
- RSS aggregation
- AI pipeline orchestration
- PostGIS validation
"""

from backend.python.pipeline.rss_processor import RSSProcessor, rss_processor

__all__ = ['RSSProcessor', 'rss_processor']
