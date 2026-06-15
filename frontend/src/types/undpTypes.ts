/**
 * UNDP Damage Assessment Types & Constants
 *
 * Type definitions and display configurations for the UNDP-mandated
 * data collection fields added to the Citizen Report Form and
 * displayed in the Live Map Damage Report Sidebar.
 *
 * Icon identifiers reference Lucide icon names. Rendering is handled
 * by consuming components via the icon map utility.
 *
 * Module: CR-01 (Citizen Report), GV-02 (Map Visualization)
 */

// ============================================================================
// INFRASTRUCTURE TYPES
// ============================================================================

export const INFRASTRUCTURE_TYPES = [
  'residential',
  'commercial',
  'government_building',
  'utility_infrastructure',
  'transport_communication',
  'community_infrastructure',
  'public_spaces_recreation',
  'other',
] as const;

export type InfrastructureType = typeof INFRASTRUCTURE_TYPES[number];

export const INFRASTRUCTURE_TYPE_CONFIG: Record<
  InfrastructureType,
  { label: string; iconName: string; color: string; bgColor: string }
> = {
  residential: {
    label: 'Residential',
    iconName: 'home',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.12)',
  },
  commercial: {
    label: 'Commercial',
    iconName: 'building-2',
    color: '#0891b2',
    bgColor: 'rgba(8, 145, 178, 0.12)',
  },
  government_building: {
    label: 'Government Building',
    iconName: 'landmark',
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.12)',
  },
  utility_infrastructure: {
    label: 'Utility Infrastructure',
    iconName: 'zap',
    color: '#ca8a04',
    bgColor: 'rgba(202, 138, 4, 0.12)',
  },
  transport_communication: {
    label: 'Transport & Communication',
    iconName: 'route',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.12)',
  },
  community_infrastructure: {
    label: 'Community Infrastructure',
    iconName: 'school',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.12)',
  },
  public_spaces_recreation: {
    label: 'Public Spaces / Recreation',
    iconName: 'trees',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.12)',
  },
  other: {
    label: 'Other',
    iconName: 'clipboard-list',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.12)',
  },
};

// ============================================================================
// SUPPLEMENTARY CRISIS FACTORS (Optional)
// Natural hazards are covered by the Hazard Type selector.
// These categories capture additional technological or human-made factors.
// ============================================================================

export const CRISIS_CATEGORIES = {
  technological_hazards: {
    label: 'Technological / Industrial',
    iconName: 'factory',
    color: '#d97706',
    options: [
      { value: 'explosion', label: 'Explosion', iconName: 'bomb' },
      { value: 'chemical_incident', label: 'Chemical Incident', iconName: 'flask-conical' },
    ],
  },
  human_made_crises: {
    label: 'Human-Made Crises',
    iconName: 'shield-alert',
    color: '#dc2626',
    options: [
      { value: 'conflict', label: 'Conflict', iconName: 'swords' },
      { value: 'civil_unrest', label: 'Civil Unrest', iconName: 'megaphone' },
    ],
  },
} as const;

export type CrisisCategoryKey = keyof typeof CRISIS_CATEGORIES;

/** All selectable crisis values (flat list) */
export const ALL_CRISIS_OPTIONS = Object.values(CRISIS_CATEGORIES)
  .flatMap((cat) => cat.options.map((o) => o.value));

export type CrisisValue = typeof ALL_CRISIS_OPTIONS[number];

/** Structured crisis selections mirroring the form state */
export interface CrisisSelections {
  technological_hazards: string[];
  human_made_crises: string[];
}

// ============================================================================
// DEBRIS ASSESSMENT
// ============================================================================

export type DebrisStatus = 'yes' | 'no' | 'unsure';

export const DEBRIS_OPTIONS: { value: DebrisStatus; label: string; iconName: string; description: string }[] = [
  {
    value: 'yes',
    label: 'Yes',
    iconName: 'alert-triangle',
    description: 'Debris requires clearing',
  },
  {
    value: 'no',
    label: 'No',
    iconName: 'check-circle-2',
    description: 'No debris present',
  },
  {
    value: 'unsure',
    label: 'Unsure',
    iconName: 'help-circle',
    description: 'Unable to confirm',
  },
];

export const DEBRIS_DISPLAY: Record<
  DebrisStatus,
  { label: string; iconName: string; badgeColor: string; badgeBg: string }
> = {
  yes: {
    label: 'Debris Clearance Required',
    iconName: 'alert-triangle',
    badgeColor: '#dc2626',
    badgeBg: 'rgba(220, 38, 38, 0.12)',
  },
  no: {
    label: 'No Debris',
    iconName: 'check-circle-2',
    badgeColor: '#16a34a',
    badgeBg: 'rgba(22, 163, 74, 0.12)',
  },
  unsure: {
    label: 'Debris Status Unknown',
    iconName: 'help-circle',
    badgeColor: '#ca8a04',
    badgeBg: 'rgba(202, 138, 4, 0.12)',
  },
};

// ============================================================================
// DAMAGE SEVERITY (user-selected)
// ============================================================================

export const DAMAGE_SEVERITY_LEVELS = [
  'destroyed',
  'severe',
  'moderate',
  'minor',
  'no_visible_damage',
] as const;

export type DamageSeverity = typeof DAMAGE_SEVERITY_LEVELS[number];

export const DAMAGE_SEVERITY_CONFIG: Record<
  DamageSeverity,
  { label: string; iconName: string; color: string; bgColor: string; ring: string }
> = {
  destroyed: {
    label: 'Destroyed',
    iconName: 'x-octagon',
    color: '#7f1d1d',
    bgColor: 'rgba(127, 29, 29, 0.15)',
    ring: 'ring-red-900/40',
  },
  severe: {
    label: 'Severe Damage',
    iconName: 'alert-octagon',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.12)',
    ring: 'ring-red-500/40',
  },
  moderate: {
    label: 'Moderate Damage',
    iconName: 'alert-triangle',
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.12)',
    ring: 'ring-orange-500/40',
  },
  minor: {
    label: 'Minor Damage',
    iconName: 'minus-circle',
    color: '#ca8a04',
    bgColor: 'rgba(202, 138, 4, 0.12)',
    ring: 'ring-yellow-500/40',
  },
  no_visible_damage: {
    label: 'No Visible Damage',
    iconName: 'check-circle-2',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.12)',
    ring: 'ring-green-500/40',
  },
};

// ============================================================================
// COMPOSITE FORM / REPORT TYPES
// ============================================================================

/**
 * Extended form data including UNDP-mandated fields.
 * Used by the CitizenReportForm during state management.
 */
export interface UNDPFormData {
  // Existing fields
  hazardType: string;
  description: string;
  name: string;
  contactNumber: string;
  latitude?: number;
  longitude?: number;
  image?: File;
  imageMetadata?: { timestamp?: string; device?: string };
  website?: string; // Honeypot

  // UNDP-mandated fields
  infrastructureTypes: InfrastructureType[];
  infrastructureOtherText: string; // conditional on 'other' selected
  infrastructureDetails: string; // free text: name + nature of infrastructure
  crisisCategories: CrisisSelections; // optional supplementary factors
  debrisStatus: DebrisStatus | '';
  damageSeverity: DamageSeverity | '';
}

/**
 * Data shape stored in DB / returned by API for a citizen damage report.
 * Consumed by the DamageReportSidebar.
 */
export interface DamageReportData {
  id: string;
  tracking_id: string;
  hazard_type: string;
  severity: string; // mapped from damageSeverity
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  confidence_score: number;
  source_type: 'citizen_report';
  validated: boolean;
  created_at: string;
  image_url?: string[];

  // UNDP fields
  infrastructure_types: InfrastructureType[];
  infrastructure_other_text?: string;
  infrastructure_details?: string;
  crisis_categories?: CrisisSelections;
  debris_status: DebrisStatus;
  damage_severity: DamageSeverity;
}
