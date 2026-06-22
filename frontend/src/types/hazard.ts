/**
 * Hazard Types
 * 
 * Centralized type definitions for hazard data across the application.
 * These types align with the backend API responses and database schema.
 * 
 * Module: GV-02 (Geospatial Visualization)
 */

import type {
  CommunityAssessment,
  CrisisSelections,
  DamageSeverity,
  DebrisStatus,
  InfrastructureType,
} from './undpTypes';

// ============================================================================
// Core Hazard Types
// ============================================================================

/**
 * Hazard record from the database
 * Used for display on maps and in dashboards
 */
export interface Hazard {
  id: string;
  hazard_type: string;
  severity: string;
  status?: 'active' | 'resolved' | 'archived';
  location_name: string;
  admin_division?: string;
  latitude: number;
  longitude: number;
  confidence_score: number;
  model_version?: string;
  source_type: 'rss' | 'citizen_report';
  source_url?: string;
  source_title?: string;
  source_content?: string;
  source_published_at?: string;
  source?: string; // Feed URL for RSS sources
  validated: boolean;
  validated_at?: string;
  validated_by?: string;
  validation_notes?: string;
  detected_at?: string;
  created_at: string;
  updated_at?: string;

  // UNDP damage assessment fields
  infrastructure_types?: InfrastructureType[];
  infrastructure_details?: string;
  infrastructure_other_text?: string;
  crisis_categories?: CrisisSelections;
  community_assessment?: CommunityAssessment;
  debris_status?: DebrisStatus;
  damage_severity?: DamageSeverity;
  image_urls?: string[];
}

/**
 * Simplified hazard for map display
 * Subset of fields needed for marker rendering
 */
export interface MapHazard {
  id: string;
  hazard_type: string;
  severity: string;
  location_name: string;
  latitude: number;
  longitude: number;
  confidence_score: number;
  source_type: string;
  validated: boolean;
  created_at: string;
  source_content?: string;
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Aggregated hazard statistics from backend
 */
export interface HazardStats {
  total_hazards: number;
  validated_hazards: number;
  unvalidated_hazards: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_source: Record<string, number>;
  last_24h: number;
  last_7d: number;
  last_30d: number;
}

/**
 * Trend data for time-series charts
 */
export interface HazardTrend {
  date: string;
  count: number;
  hazard_type?: string;
}

/**
 * Distribution data for pie/bar charts
 */
export interface HazardDistribution {
  category: string;
  count: number;
  percentage: number;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Query parameters for hazard API
 */
export interface HazardFilters {
  hazard_types?: string[];
  source_types?: string[];
  validated?: boolean;
  min_confidence?: number;
  severity?: string[];
  time_window_hours?: number;
  region?: string;
  province?: string;
  limit?: number;
  offset?: number;
}

/**
 * Source type enumeration
 */
export type SourceType = 'rss' | 'citizen_report' | 'rss_feed' | 'citizen_verified';

/**
 * Time window presets
 */
export type TimeWindow = '1h' | '6h' | '24h' | '7d' | '30d' | 'all' | 'custom';

// ============================================================================
// Constants
// ============================================================================

/**
 * All available hazard types in the system
 */
export const HAZARD_TYPES = [
  'flood',
  'flooding',
  'typhoon',
  'landslide',
  'earthquake',
  'volcanic_eruption',
  'storm_surge',
  'tsunami',
  'fire',
  'drought',
  'heat_wave',
  'heat_index',
  'heavy_rain',
  'other',
] as const;

export type HazardType = typeof HAZARD_TYPES[number];

/**
 * Severity levels (ordered from most to least severe)
 */
export const SEVERITY_LEVELS = ['critical', 'severe', 'moderate', 'minor'] as const;

export type SeverityLevel = typeof SEVERITY_LEVELS[number];

/**
 * Hazard type display configuration
 */
export const HAZARD_TYPE_CONFIG: Record<string, { label: string; color: string; icon?: string }> = {
  flood: { label: 'Flood', color: '#3b82f6' },
  flooding: { label: 'Flooding', color: '#3b82f6' },
  typhoon: { label: 'Typhoon', color: '#6366f1' },
  landslide: { label: 'Landslide', color: '#d97706' },
  earthquake: { label: 'Earthquake', color: '#ef4444' },
  volcanic_eruption: { label: 'Volcanic Eruption', color: '#dc2626' },
  storm_surge: { label: 'Storm Surge', color: '#0891b2' },
  tsunami: { label: 'Tsunami', color: '#0284c7' },
  fire: { label: 'Fire', color: '#f97316' },
  drought: { label: 'Drought', color: '#ca8a04' },
  heat_wave: { label: 'Heat Wave', color: '#ea580c' },
  heat_index: { label: 'Heat Index', color: '#dc2626' },
  heavy_rain: { label: 'Heavy Rain', color: '#2563eb' },
  other: { label: 'Other', color: '#6b7280' },
};

/**
 * Severity level display configuration
 */
export const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  critical: { label: 'Critical', color: '#dc2626', bgColor: '#fef2f2' },
  severe: { label: 'Severe', color: '#ea580c', bgColor: '#fff7ed' },
  moderate: { label: 'Moderate', color: '#ca8a04', bgColor: '#fefce8' },
  minor: { label: 'Minor', color: '#16a34a', bgColor: '#f0fdf4' },
  unknown: { label: 'Unknown', color: '#6b7280', bgColor: '#f9fafb' },
};
