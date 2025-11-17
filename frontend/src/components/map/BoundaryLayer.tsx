import React, { useEffect, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import { PathOptions, LatLngBoundsExpression } from 'leaflet';
import L from 'leaflet';
import { useBoundaryData } from '../../hooks/useBoundaryData';

/**
 * BoundaryLayer Component
 * 
 * Renders highlighted boundary for a searched location.
 * Uses backend API to fetch only the specific boundary instead of loading all data.
 * 
 * Features:
 * - On-demand loading (only fetches boundary for searched location)
 * - Highlight styling for visual emphasis
 * - Hover effects with location metadata
 * 
 * @param enabled - Whether to display the boundary
 * @param locationName - Name of location to highlight (e.g., "Imus", "Manila")
 * @param highlightColor - Color for the boundary highlight (default: blue)
 */

interface BoundaryLayerProps {
  enabled: boolean;
  locationName: string | null;
  highlightColor?: string;
  onBoundsCalculated?: (bounds: LatLngBoundsExpression, boundaryLevel: string) => void;
}

export const BoundaryLayer: React.FC<BoundaryLayerProps> = ({
  enabled,
  locationName,
  highlightColor = '#3b82f6', // Default: Tailwind blue-500
  onBoundsCalculated,
}) => {
  // Fetch boundary data for specific location
  const { data, loading, error, metadata } = useBoundaryData(locationName, enabled);
  
  // Track if bounds already calculated for this data to prevent re-calculation
  const boundsCalculatedRef = useRef<string | null>(null);

  // Calculate and notify bounds when data changes (ONCE per location)
  useEffect(() => {
    if (error) {
      console.error(`[BoundaryLayer] Error:`, error);
      return;
    }
    
    // Calculate bounds from GeoJSON data (only once per location)
    if (data && data.features.length > 0 && onBoundsCalculated) {
      const locationKey = `${locationName}-${metadata?.boundary_level}`;
      
      // Skip if already calculated for this exact location
      if (boundsCalculatedRef.current === locationKey) {
        return;
      }
      
      const geoJsonLayer = new L.GeoJSON(data);
      const bounds = geoJsonLayer.getBounds();
      const boundaryLevel = metadata?.boundary_level || 'unknown';
      
      if (bounds.isValid()) {
        onBoundsCalculated(bounds, boundaryLevel);
        boundsCalculatedRef.current = locationKey; // Mark as calculated
      }
    }
  }, [data, locationName, metadata, onBoundsCalculated, error]);

  // Don't render if no data or loading
  if (!enabled || !data || loading) {
    return null;
  }

  // Highlight styling for searched location boundary
  const boundaryStyle = (): PathOptions => {
    return {
      fillColor: highlightColor,
      fillOpacity: 0.15, // Subtle fill to highlight area
      color: highlightColor,
      weight: 3,
      opacity: 0.8,
      className: 'boundary-highlight',
    };
  };

  // Enhanced hover effect for highlighted boundary
  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    if (!feature.properties) return;

    const searchedLocation = feature.properties.searched_location || feature.properties.city;
    const province = feature.properties.province;
    const regionName = feature.properties.region_name;
    
    // Tooltip with full location information
    const tooltipText = searchedLocation
      ? `${searchedLocation}${province ? `, ${province}` : ''}${regionName ? ` (${regionName})` : ''}`
      : 'Location boundary';
      
    layer.bindTooltip(tooltipText, {
      permanent: false,
      direction: 'center',
      className: 'boundary-tooltip-highlight',
      opacity: 0.95,
    });

    // Enhanced hover effects
    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          fillOpacity: 0.25, // More prominent on hover
          weight: 4,
          opacity: 1,
        });
        target.bringToFront();
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(boundaryStyle());
      },
    });
  };

  return (
    <>
      {loading && (
        <div className="leaflet-control leaflet-top leaflet-right">
          <div className="bg-white rounded px-3 py-2 shadow-md text-sm text-gray-600">
            Loading boundary for {locationName}...
          </div>
        </div>
      )}

      <GeoJSON
        data={data}
        style={boundaryStyle}
        onEachFeature={onEachFeature}
        pane="overlayPane" // z-index 400 (above tiles, below markers)
      />
    </>
  );
};

export default BoundaryLayer;
