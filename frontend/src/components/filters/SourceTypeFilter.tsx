/**
 * SourceTypeFilter Component
 * 
 * Checkbox group for filtering hazards by source type.
 * Hides "Citizen Report - Unverified" option from public users.
 * 
 * Module: FP-04
 * Change: add-advanced-map-features
 * 
 * Features:
 * - Checkbox list for source types (RSS, Citizen Verified, Citizen Unverified)
 * - Authentication-aware: shows unverified option only to authenticated users
 * - Source type count badges
 * - Visual distinction for unverified reports
 * - Automatic session checking with Supabase
 */

import React, { useState, useEffect } from 'react';
import { Newspaper, UserCheck, ShieldAlert } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase';
import type { SourceType } from '../../hooks/useHazardFilters';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SourceTypeFilterProps {
  selectedSources: SourceType[];
  onSourcesChange: (sources: SourceType[]) => void;
  sourceCounts?: Record<SourceType, number>;
  disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SOURCE_OPTIONS = [
  {
    value: 'rss_feed' as SourceType,
    label: 'Verified News Feed',
    description: 'Official news sources (GMA, ABS-CBN, Inquirer)',
    icon: Newspaper,
    color: '#3b82f6',
    requiresAuth: false,
  },
  {
    value: 'citizen_verified' as SourceType,
    label: 'Citizen Report - Validated',
    description: 'Citizen reports verified by authorities',
    icon: UserCheck,
    color: '#10b981',
    requiresAuth: false,
  },
  {
    value: 'citizen_unverified' as SourceType,
    label: 'Citizen Report - Unverified',
    description: 'Pending validation (visible to authenticated users only)',
    icon: ShieldAlert,
    color: '#f59e0b',
    requiresAuth: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function SourceTypeFilter({
  selectedSources,
  onSourcesChange,
  sourceCounts = {} as Record<SourceType, number>,
  disabled = false,
}: SourceTypeFilterProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  /**
   * Check user authentication status on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth check error:', error);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!user);
        }
      } catch (err) {
        console.error('Failed to check auth status:', err);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Check if all sources are selected
   */
  const availableSources = SOURCE_OPTIONS.filter(
    opt => !opt.requiresAuth || isAuthenticated
  ).map(opt => opt.value);
  
  const allSelected = availableSources.every(source => selectedSources.includes(source));
  
  /**
   * Check if no sources are selected
   */
  const noneSelected = selectedSources.length === 0;

  /**
   * Toggle all source types
   */
  const handleToggleAll = () => {
    if (allSelected || noneSelected) {
      // Deselect all
      onSourcesChange([]);
    } else {
      // Select all available
      onSourcesChange(availableSources);
    }
  };

  /**
   * Toggle individual source type
   */
  const handleToggleSource = (source: SourceType) => {
    if (selectedSources.includes(source)) {
      onSourcesChange(selectedSources.filter(s => s !== source));
    } else {
      onSourcesChange([...selectedSources, source]);
    }
  };

  /**
   * Get total source count
   */
  const totalCount = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header with Select All */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Source Type</h3>
          {!isCheckingAuth && (
            <button
              onClick={handleToggleAll}
              disabled={disabled}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Summary Badge */}
        {!noneSelected && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Badge variant="secondary" className="font-medium">
              {selectedSources.length} of {availableSources.length} selected
            </Badge>
            {totalCount > 0 && (
              <span className="text-xs">
                ({totalCount} hazard{totalCount !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}

        {/* Source Type List */}
        <div className="space-y-2">
          {SOURCE_OPTIONS.map((option) => {
            // Hide unverified option for public users
            if (option.requiresAuth && !isAuthenticated) {
              return null;
            }

            const Icon = option.icon;
            const count = sourceCounts[option.value] || 0;
            const isSelected = noneSelected || selectedSources.includes(option.value);
            
            return (
              <label
                key={option.value}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50/50 hover:bg-blue-50' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                  }
                  ${disabled || isCheckingAuth ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleSource(option.value)}
                  disabled={disabled || isCheckingAuth}
                  className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  {/* Icon and Label Row */}
                  <div className="flex items-center gap-3 mb-1">
                    {/* Icon */}
                    <div 
                      className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
                      style={{ 
                        backgroundColor: `${option.color}20`, 
                        color: isSelected ? option.color : '#9ca3af' 
                      }}
                    >
                      <Icon size={18} strokeWidth={2.5} />
                    </div>
                    
                    {/* Label */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`text-sm font-medium truncate ${
                        isSelected ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {option.label}
                      </span>
                      
                      {/* Count Badge */}
                      <Badge 
                        variant={count > 0 ? 'secondary' : 'outline'}
                        className={`text-xs flex-shrink-0 ${
                          count > 0 ? 'font-semibold' : 'font-normal'
                        }`}
                      >
                        {count}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs text-gray-500 ml-11">
                    {option.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Loading State */}
        {isCheckingAuth && (
          <div className="text-center py-2 px-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              Checking authentication status...
            </p>
          </div>
        )}

        {/* Authentication Info */}
        {!isCheckingAuth && !isAuthenticated && (
          <div className="text-xs text-gray-600 bg-amber-50 rounded-lg p-3 border border-amber-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 mb-1">
                Limited Access
              </p>
              <p className="text-amber-700">
                Sign in to view unverified citizen reports. Public users can only see validated hazards from official sources and verified citizen reports.
              </p>
            </div>
          </div>
        )}

        {/* No Selection Message */}
        {noneSelected && !isCheckingAuth && (
          <div className="text-center py-4 px-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              All source types are visible
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Select specific sources to filter
            </p>
          </div>
        )}

        {/* Info Note */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 border border-gray-200">
          <p className="font-medium text-gray-700 mb-1">Note:</p>
          <p>
            Unverified citizen reports are marked with lower confidence scores and require manual validation by authorities before being confirmed.
          </p>
        </div>
      </div>
    </Card>
  );
}
