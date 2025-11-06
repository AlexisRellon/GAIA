/**
 * Heatmap Layer Component
 * 
 * Renders a color-gradient heatmap overlay on the map to visualize hazard density.
 * Uses leaflet.heat plugin for canvas-based rendering.
 * 
 * Features:
 * - Dynamic intensity calculation based on confidence × severity
 * - Auto-disable at high zoom levels (>12) for performance
 * - Configurable gradient, radius, and blur
 * - Persists settings in localStorage
 * 
 * Module: GV-04 (Hazard Density Heatmap)
 * Change: add-advanced-map-features
 */

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

// Extend Leaflet's HeatLayer type
declare module 'leaflet' {
  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: HeatLayerOptions
  ): L.Layer;
}

interface Hazard {
  id: string;
  latitude: number;
  longitude: number;
  confidence_score: number;
  severity: string;
  hazard_type: string;
}

interface HeatmapLayerProps {
  hazards: Hazard[];
  enabled: boolean;
  radius?: number;
  blur?: number;
  maxZoom?: number;
  gradient?: Record<number, string>;
}

// Severity multipliers for intensity calculation
const SEVERITY_MULTIPLIERS: Record<string, number> = {
  critical: 1.5,
  severe: 1.2,
  moderate: 1.0,
  minor: 0.5,
};

// Default gradient (blue → yellow → orange → red)
const DEFAULT_GRADIENT = {
  0.0: '#3b82f6',  // blue-500
  0.5: '#eab308',  // yellow-500
  0.7: '#f97316',  // orange-500
  1.0: '#dc2626',  // red-600
};

/**
 * Calculate heatmap intensity for a hazard
 * Formula: confidence_score × severity_multiplier
 * 
 * @param hazard - Hazard object with confidence and severity
 * @returns Intensity value between 0.0 and 1.5
 */
function calculateIntensity(hazard: Hazard): number {
  const baseConfidence = hazard.confidence_score;
  const severityMultiplier = SEVERITY_MULTIPLIERS[hazard.severity] || 1.0;
  return baseConfidence * severityMultiplier;
}

/**
 * Heatmap Layer Component
 * 
 * Adds a heatmap overlay to the Leaflet map showing hazard density.
 * Automatically manages layer lifecycle and responds to prop changes.
 */
export function HeatmapLayer({
  hazards,
  enabled,
  radius = 25,
  blur = 15,
  maxZoom = 12,
  gradient = DEFAULT_GRADIENT,
}: HeatmapLayerProps) {
  const map = useMap();
  const [heatLayer, setHeatLayer] = useState<L.Layer | null>(null);
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  // Update current zoom on map zoom changes
  useEffect(() => {
    const handleZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  // Create or update heatmap layer
  useEffect(() => {
    // Remove existing layer if present
    if (heatLayer) {
      map.removeLayer(heatLayer);
      setHeatLayer(null);
    }

    // Don't create layer if disabled or no hazards
    if (!enabled || hazards.length === 0) {
      return;
    }

    // Auto-disable at high zoom (individual markers more useful)
    if (currentZoom > maxZoom) {
      return;
    }

    // Convert hazards to heatmap data: [lat, lng, intensity]
    const heatData = hazards.map(hazard => [
      hazard.latitude,
      hazard.longitude,
      calculateIntensity(hazard),
    ] as [number, number, number]);

    // Create new heat layer
    const newHeatLayer = L.heatLayer(heatData, {
      radius,
      blur,
      maxZoom,
      max: 1.5, // Maximum intensity value (critical × 1.5)
      gradient,
      minOpacity: 0.4,
    });

    // Add to map
    newHeatLayer.addTo(map);
    setHeatLayer(newHeatLayer);

    // Cleanup on unmount
    return () => {
      if (newHeatLayer) {
        map.removeLayer(newHeatLayer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hazards, radius, blur, maxZoom, gradient, currentZoom, map]);

  // No DOM rendering - layer is managed directly with Leaflet
  return null;
}

/**
 * Heatmap Settings Hook
 * 
 * Manages heatmap configuration with localStorage persistence.
 * Returns current settings and update function.
 */
export function useHeatmapSettings() {
  const STORAGE_KEY = 'gaia_heatmap_settings';
  
  const [settings, setSettings] = useState({
    enabled: false,
    radius: 25,
    blur: 15,
    maxZoom: 12,
    gradient: DEFAULT_GRADIENT,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error('Failed to load heatmap settings:', err);
    }
  }, []);

  // Update settings and persist to localStorage
  const updateSettings = (newSettings: Partial<typeof settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save heatmap settings:', err);
      }
      
      return updated;
    });
  };

  return { settings, updateSettings };
}
