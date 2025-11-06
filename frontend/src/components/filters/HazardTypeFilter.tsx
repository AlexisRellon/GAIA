/**
 * HazardTypeFilter Component
 * 
 * Multi-select checkbox group for filtering hazards by type.
 * Displays hazard count per type and supports "Select All" functionality.
 * 
 * Module: FP-01
 * Change: add-advanced-map-features
 * 
 * Features:
 * - Checkbox list of all hazard types
 * - "Select All" / "Deselect All" toggle
 * - Hazard count per type (from current filtered data)
 * - Icon visualization for each hazard type
 * - Responsive layout with grid display
 */

import React from 'react';
import { 
  Droplets, 
  Wind, 
  Mountain, 
  Activity, 
  Flame, 
  Waves, 
  CloudRain, 
  Sun, 
  Thermometer, 
  AlertTriangle,
  type LucideIcon
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ALL_HAZARD_TYPES } from '../../hooks/useHazardFilters';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HazardTypeFilterProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  hazardCounts?: Record<string, number>;
  disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Hazard type labels
const HAZARD_LABELS: Record<string, string> = {
  flood: 'Flood',
  typhoon: 'Typhoon',
  landslide: 'Landslide',
  earthquake: 'Earthquake',
  volcanic_eruption: 'Volcanic Eruption',
  storm_surge: 'Storm Surge',
  tsunami: 'Tsunami',
  fire: 'Fire',
  drought: 'Drought',
  heat_wave: 'Heat Wave',
  heavy_rain: 'Heavy Rain',
  other: 'Other Hazards',
};

// Hazard icons and colors mapping
const HAZARD_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  flood: { icon: Droplets, color: '#3b82f6' },
  typhoon: { icon: Wind, color: '#6366f1' },
  landslide: { icon: Mountain, color: '#a855f7' },
  earthquake: { icon: Activity, color: '#ef4444' },
  volcanic_eruption: { icon: Flame, color: '#dc2626' },
  storm_surge: { icon: Waves, color: '#0891b2' },
  tsunami: { icon: Waves, color: '#06b6d4' },
  fire: { icon: Flame, color: '#f97316' },
  drought: { icon: Sun, color: '#eab308' },
  heat_wave: { icon: Thermometer, color: '#f59e0b' },
  heavy_rain: { icon: CloudRain, color: '#0ea5e9' },
  other: { icon: AlertTriangle, color: '#64748b' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function HazardTypeFilter({
  selectedTypes,
  onTypesChange,
  hazardCounts = {},
  disabled = false,
}: HazardTypeFilterProps) {
  
  /**
   * Check if all types are selected
   */
  const allSelected = selectedTypes.length === ALL_HAZARD_TYPES.length;
  
  /**
   * Check if no types are selected
   */
  const noneSelected = selectedTypes.length === 0;
  
  /**
   * Toggle all hazard types
   */
  const handleToggleAll = () => {
    if (allSelected || noneSelected) {
      // If all selected or none selected, deselect all
      onTypesChange([]);
    } else {
      // If some selected, select all
      onTypesChange([...ALL_HAZARD_TYPES]);
    }
  };
  
  /**
   * Toggle individual hazard type
   */
  const handleToggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };
  
  /**
   * Get total hazard count
   */
  const totalCount = Object.values(hazardCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header with Select All */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Hazard Type</h3>
          <button
            onClick={handleToggleAll}
            disabled={disabled}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Summary Badge */}
        {!noneSelected && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Badge variant="secondary" className="font-medium">
              {selectedTypes.length} of {ALL_HAZARD_TYPES.length} selected
            </Badge>
            {totalCount > 0 && (
              <span className="text-xs">
                ({totalCount} hazard{totalCount !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}

        {/* Hazard Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALL_HAZARD_TYPES.map((type) => {
            const { icon: Icon, color } = HAZARD_ICONS[type] || HAZARD_ICONS.other;
            const count = hazardCounts[type] || 0;
            const isSelected = noneSelected || selectedTypes.includes(type);
            
            return (
              <label
                key={type}
                className={`
                  flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50/50 hover:bg-blue-50' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleType(type)}
                    disabled={disabled}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed"
                  />
                  
                  {/* Icon */}
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
                    style={{ 
                      backgroundColor: `${color}20`, 
                      color: isSelected ? color : '#9ca3af' 
                    }}
                  >
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  
                  {/* Label */}
                  <span className={`text-sm font-medium truncate ${
                    isSelected ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {HAZARD_LABELS[type]}
                  </span>
                </div>
                
                {/* Count Badge */}
                <Badge 
                  variant={count > 0 ? 'secondary' : 'outline'}
                  className={`text-xs flex-shrink-0 ml-2 ${
                    count > 0 ? 'font-semibold' : 'font-normal'
                  }`}
                >
                  {count}
                </Badge>
              </label>
            );
          })}
        </div>

        {/* No Selection Message */}
        {noneSelected && (
          <div className="text-center py-4 px-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              All hazard types are visible
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Select specific types to filter
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
