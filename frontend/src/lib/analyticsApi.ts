/**
 * Analytics API Client
 * 
 * Provides methods to fetch analytics and statistics from the backend
 * All methods return cached data via React Query hooks in useAnalytics.ts
 * 
 * Module: AAM-01 (Advanced Analytics Module)
 */

import { apiRequest } from './api';

const ANALYTICS_BASE_PATH = '/api/v1/analytics';

export interface HazardStats {
  total_hazards: number;
  active_hazards: number;
  resolved_hazards: number;
  unverified_reports: number;
  avg_confidence: number;
  avg_time_to_action: number | null;
}

export interface HazardTrend {
  date: string;
  volcanic_eruption: number;
  earthquake: number;
  flood: number;
  landslide: number;
  fire: number;
  storm_surge: number;
  total: number;
}

export interface RegionStats {
  region: string;
  total_count: number;
  active_count: number;
  resolved_count: number;
}

export interface HazardTypeDistribution {
  hazard_type: string;
  count: number;
  percentage: number;
}

export interface SourceBreakdown {
  source_type: 'rss' | 'citizen_report';
  count: number;
  percentage: number;
  avg_confidence: number;
  [key: string]: string | number;
}

export interface RecentAlert {
  id: string;
  hazard_type: string;
  location_name: string;
  admin_division?: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  source_type: 'rss' | 'citizen_report';
  status: 'active' | 'resolved' | 'archived';
  confidence_score: number;
  detected_at: string;
}

// ============================================================================
// AI/ML Quality Metrics Interfaces (New)
// ============================================================================

export interface ConfidenceByTypeMetric {
  hazard_type: string;
  avg_confidence: number;
  count: number;
  min_confidence: number;
  max_confidence: number;
}

export interface FalsePositiveRateMetric {
  fpr_percentage: number;
  rejected_count: number;
  total_verified: number;
  total_rejected: number;
  trend: 'up' | 'down' | 'stable';
  previous_period_fpr: number | null;
}

export interface SourceAccuracyMetric {
  rss_verified_count: number;
  rss_rejected_count: number;
  rss_accuracy_percentage: number;
  citizen_verified_count: number;
  citizen_rejected_count: number;
  citizen_accuracy_percentage: number;
  overall_accuracy_percentage: number;
}

export interface ProcessingRateMetric {
  hourly_average: number;
  daily_average: number;
  last_24h_total: number;
  last_hour_count: number;
  trend: 'up' | 'down' | 'stable';
  highest_hour: string | null;
  highest_hour_count: number;
}

export interface DuplicateDetectionMetric {
  duplicate_percentage: number;
  duplicate_count: number;
  total_hazards: number;
  duplicate_detection_enabled: boolean;
  trend: 'up' | 'down' | 'stable';
}

export interface SystemHealthMetric {
  health_score: number; // 0-100
  status: 'healthy' | 'warning' | 'critical';
  avg_response_time_ms: number;
  error_rate_percentage: number;
  uptime_percentage: number;
  metrics_timestamp: string;
}

/**
 * Analytics API client - provides methods to fetch various analytics data
 */
export const analyticsApi = {
  /**
   * Get overall hazard statistics
   */
  async getStats(): Promise<HazardStats> {
    return apiRequest<HazardStats>(`${ANALYTICS_BASE_PATH}/stats`);
  },

  /**
   * Get hazard trends over time
   * @param days Number of days to retrieve (7-90)
   */
  async getTrends(days: number = 30): Promise<HazardTrend[]> {
    return apiRequest<HazardTrend[]>(`${ANALYTICS_BASE_PATH}/trends?days=${days}`);
  },

  /**
   * Get statistics by administrative region
   */
  async getRegionStats(): Promise<RegionStats[]> {
    return apiRequest<RegionStats[]>(`${ANALYTICS_BASE_PATH}/regions`);
  },

  /**
   * Get hazard type distribution (count and percentage)
   */
  async getDistribution(): Promise<HazardTypeDistribution[]> {
    return apiRequest<HazardTypeDistribution[]>(`${ANALYTICS_BASE_PATH}/distribution`);
  },

  /**
   * Get breakdown by source type (RSS vs citizen reports)
   */
  async getSourceBreakdown(): Promise<SourceBreakdown[]> {
    return apiRequest<SourceBreakdown[]>(`${ANALYTICS_BASE_PATH}/source-breakdown`);
  },

  /**
   * Get recent hazard alerts
   * @param limit Number of alerts to retrieve
   */
  async getRecentAlerts(limit: number = 10): Promise<RecentAlert[]> {
    return apiRequest<RecentAlert[]>(`${ANALYTICS_BASE_PATH}/recent-alerts?limit=${limit}`);
  },

  // ============================================================================
  // AI/ML Quality Metrics Endpoints (New)
  // ============================================================================

  /**
   * Get average confidence score by hazard type (AI/ML Quality Metric)
   * Shows which hazard types have better model confidence
   */
  async getConfidenceByType(): Promise<ConfidenceByTypeMetric[]> {
    return apiRequest<ConfidenceByTypeMetric[]>(`${ANALYTICS_BASE_PATH}/confidence-by-type`);
  },

  /**
   * Get false positive rate from citizen reports (AI/ML Quality Metric)
   * Measures validation quality - ratio of rejected to verified reports
   */
  async getFalsePositiveRate(): Promise<FalsePositiveRateMetric> {
    return apiRequest<FalsePositiveRateMetric>(`${ANALYTICS_BASE_PATH}/false-positive-rate`);
  },

  /**
   * Get accuracy comparison between RSS feeds and citizen reports (AI/ML Quality Metric)
   * Shows which source type has better reliability
   */
  async getSourceAccuracy(): Promise<SourceAccuracyMetric> {
    return apiRequest<SourceAccuracyMetric>(`${ANALYTICS_BASE_PATH}/source-accuracy`);
  },

  /**
   * Get hazard processing/detection rate (Performance Metric)
   * Shows system throughput - hazards detected per hour
   */
  async getProcessingRate(): Promise<ProcessingRateMetric> {
    return apiRequest<ProcessingRateMetric>(`${ANALYTICS_BASE_PATH}/processing-rate`);
  },

  /**
   * Get duplicate detection rate (Data Quality Metric)
   * Shows effectiveness of duplicate detection
   */
  async getDuplicateRate(): Promise<DuplicateDetectionMetric> {
    return apiRequest<DuplicateDetectionMetric>(`${ANALYTICS_BASE_PATH}/duplicate-rate`);
  },

  /**
   * Get system health and performance metrics (System Health Metric)
   * Overall system status including response time and reliability
   */
  async getSystemHealth(): Promise<SystemHealthMetric> {
    return apiRequest<SystemHealthMetric>(`${ANALYTICS_BASE_PATH}/system-health`);
  },
};
