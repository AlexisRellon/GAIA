import React, { useEffect, useMemo, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import { PathOptions, LatLngBoundsExpression } from 'leaflet';
import L from 'leaflet';
import { useBoundaryData } from '../../hooks/useBoundaryData';

/**
 * BoundaryLayer Component (GV-01)
 *
 * Renders a Google-Maps-style "spotlight" for a searched location: the area
 * OUTSIDE the boundary is dimmed with a semi-opaque mask while the inside stays
 * clear, and the boundary edge is outlined. Only the searched boundary is
 * fetched from the backend (on-demand).
 *
 * @param enabled - Whether to display the boundary
 * @param locationName - Location to highlight (e.g., "Imus", "Calabarzon")
 * @param highlightColor - Color for the boundary outline (default: blue)
 * @param onBoundsCalculated - Receives the boundary bounds (for map fitBounds)
 */

interface BoundaryLayerProps {
  enabled: boolean;
  locationName: string | null;
  highlightColor?: string;
  onBoundsCalculated?: (bounds: LatLngBoundsExpression, boundaryLevel: string) => void;
}

// A ring covering the whole world; the searched boundary's outer rings are
// punched out as holes so only the area OUTSIDE the boundary is filled (the dim).
const WORLD_RING: number[][] = [
  [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90],
];

/**
 * Build the "spotlight" mask: one polygon = world ring minus the boundary's
 * exterior rings (as holes). Filling it dims everything outside the boundary.
 */
function buildSpotlightMask(fc: GeoJSON.FeatureCollection): GeoJSON.Feature {
  const holes: number[][][] = [];
  for (const feature of fc.features) {
    const geom = feature.geometry;
    if (geom.type === 'Polygon') {
      if (geom.coordinates[0]) holes.push(geom.coordinates[0] as number[][]);
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        if (poly[0]) holes.push(poly[0] as number[][]);
      }
    }
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [WORLD_RING, ...holes] },
  };
}

export const BoundaryLayer: React.FC<BoundaryLayerProps> = ({
  enabled,
  locationName,
  highlightColor = '#3b82f6',
  onBoundsCalculated,
}) => {
  const { data, loading, error, metadata } = useBoundaryData(locationName, enabled);
  const boundsCalculatedRef = useRef<string | null>(null);

  // Notify the parent of the boundary bounds once per location (for fitBounds).
  useEffect(() => {
    if (error) {
      console.error('[BoundaryLayer] Error:', error);
      return;
    }
    if (data && data.features.length > 0 && onBoundsCalculated) {
      const locationKey = `${locationName}-${metadata?.boundary_level}`;
      if (boundsCalculatedRef.current === locationKey) return;
      const bounds = new L.GeoJSON(data).getBounds();
      if (bounds.isValid()) {
        onBoundsCalculated(bounds, metadata?.boundary_level || 'unknown');
        boundsCalculatedRef.current = locationKey;
      }
    }
  }, [data, locationName, metadata, onBoundsCalculated, error]);

  const mask = useMemo(() => (data ? buildSpotlightMask(data) : null), [data]);

  if (loading || !enabled || !data || !mask) {
    return null;
  }

  // Both layers are non-interactive: the mask must not swallow map clicks
  // outside the boundary, and a non-interactive outline has no browser focus
  // outline (this is what removes the stray bounding-box rectangle).
  const maskStyle = (): PathOptions => ({
    fillColor: '#0f172a',  // slate-900 dim over the surrounding area
    fillOpacity: 0.4,
    weight: 0,
    stroke: false,
    interactive: false,
  });

  const outlineStyle = (): PathOptions => ({
    color: highlightColor,
    weight: 3,
    opacity: 0.95,
    fill: false,
    interactive: false,
  });

  // key forces a remount when the searched location changes — react-leaflet sets
  // GeoJSON `data` once on mount, so a changing key swaps the rendered geometry.
  const key = `${locationName}-${metadata?.boundary_level}`;

  return (
    <>
      <GeoJSON key={`mask-${key}`} data={mask} style={maskStyle} pane="overlayPane" />
      <GeoJSON key={`outline-${key}`} data={data} style={outlineStyle} pane="overlayPane" />
    </>
  );
};

export default BoundaryLayer;
