/**
 * RSS Feed Type Definitions
 * Matches backend Pydantic models from rss_admin_api.py
 */

export interface RSSFeed {
  id: string;
  feed_url: string;
  feed_name: string;
  feed_category: string;
  is_active: boolean;
  priority: number;
  fetch_interval_minutes: number;
  created_at: string;
  updated_at: string;
  last_fetched_at?: string;
  last_fetch_status?: 'success' | 'error' | 'partial';
  total_fetches: number;
  total_hazards_found: number;
  avg_processing_time_seconds?: number;
  error_count: number;
  last_error_message?: string;
}

export interface RSSFeedCreate {
  feed_url: string;
  feed_name: string;
  feed_category: string;
  priority: number;
  fetch_interval_minutes: number;
  is_active?: boolean;
}

export interface RSSFeedUpdate {
  feed_name?: string;
  feed_category?: string;
  priority?: number;
  fetch_interval_minutes?: number;
  is_active?: boolean;
}

export interface ProcessingLog {
  id: string;
  feed_id: string;
  feed_url: string;
  status: 'success' | 'error' | 'partial';
  items_processed: number;
  items_added: number;
  duplicates_detected: number;
  processing_time_seconds: number;
  processed_at: string;
  error_details?: Record<string, unknown>;
  hazard_ids?: string[];
}

export interface RSSStatistics {
  total_feeds: number;
  active_feeds: number;
  total_hazards_found: number;
  last_24h_hazards: number;
  last_24h_processing_time_avg: number;
  last_24h_success_rate: number;
  duplicate_detection_rate: number;
  feeds_with_errors: number;
}

export interface ProcessFeedsRequest {
  feed_ids?: string[];
  force?: boolean;
}

export interface TestFeedResult {
  feed_url: string;
  status: 'success' | 'error';
  preview_items: Array<{
    title: string;
    link: string;
    published: string;
    description_preview: string;
  }>;
  total_items: number;
  error?: string;
}
