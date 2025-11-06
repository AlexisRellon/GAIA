/**
 * Custom Cluster Icon Creator for react-leaflet-cluster
 * 
 * Creates cluster markers with:
 * - Background color based on dominant hazard type
 * - Count badge showing number of hazards in cluster
 * - Size scaling based on count (small/medium/large)
 * 
 * Module: GV-03 (Marker Clustering)
 * Change: add-advanced-map-features
 */

import L from 'leaflet';

// Hazard type color mapping (matches PublicMap severity colors)
const hazardColors: Record<string, string> = {
  flood: '#3b82f6',        // blue-500
  typhoon: '#8b5cf6',      // violet-500
  landslide: '#a16207',    // yellow-700
  earthquake: '#dc2626',   // red-600
  volcanic_eruption: '#ea580c', // orange-600
  storm_surge: '#0891b2',  // cyan-600
  tsunami: '#0284c7',      // sky-600
  fire: '#dc2626',         // red-600
  drought: '#ca8a04',      // yellow-600
  heat_wave: '#dc2626',    // red-600
  heavy_rain: '#0369a1',   // sky-700
  other: '#64748b',        // slate-500
};

interface ClusterMarker extends L.Marker {
  getAllChildMarkers?: () => Array<L.Marker & { options?: { hazardType?: string } }>;
}

/**
 * Determines the dominant hazard type in a cluster
 * @param markers - Array of markers in the cluster
 * @returns The most common hazard type
 */
function getDominantHazardType(markers: Array<L.Marker & { options?: { hazardType?: string } }>): string {
  const typeCounts: Record<string, number> = {};
  
  markers.forEach(marker => {
    const type = marker.options?.hazardType || 'other';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  // Find type with highest count
  let maxCount = 0;
  let dominantType = 'other';
  
  Object.entries(typeCounts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantType = type;
    }
  });
  
  return dominantType;
}

/**
 * Determines cluster size class based on count
 * @param count - Number of markers in cluster
 * @returns Size class (small/medium/large)
 */
function getClusterSizeClass(count: number): string {
  if (count < 10) return 'small';
  if (count < 50) return 'medium';
  return 'large';
}

/**
 * Gets cluster icon dimensions based on size class
 * @param sizeClass - Size class (small/medium/large)
 * @returns [width, height] in pixels
 */
function getClusterDimensions(sizeClass: string): [number, number] {
  switch (sizeClass) {
    case 'small':
      return [40, 40];
    case 'medium':
      return [50, 50];
    case 'large':
      return [60, 60];
    default:
      return [40, 40];
  }
}

/**
 * Creates custom cluster icon with hazard type coloring
 * @param cluster - Leaflet MarkerCluster object
 * @returns Custom DivIcon for the cluster
 */
export function createCustomClusterIcon(cluster: ClusterMarker): L.DivIcon {
  const childMarkers = cluster.getAllChildMarkers?.() || [];
  const count = childMarkers.length;
  const dominantType = getDominantHazardType(childMarkers);
  const sizeClass = getClusterSizeClass(count);
  const [width, height] = getClusterDimensions(sizeClass);
  const color = hazardColors[dominantType] || hazardColors.other;
  
  // Create HTML for cluster icon
  const html = `
    <div class="cluster-icon cluster-${sizeClass}" style="
      width: ${width}px;
      height: ${height}px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      font-weight: bold;
      color: white;
      font-size: ${sizeClass === 'small' ? '12px' : sizeClass === 'medium' ? '14px' : '16px'};
    ">
      ${count}
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'custom-cluster-icon',
    iconSize: L.point(width, height),
    iconAnchor: L.point(width / 2, height / 2),
  });
}

/**
 * Creates tooltip content for cluster hover
 * Shows breakdown of hazard types in cluster
 * @param cluster - Leaflet MarkerCluster object
 * @returns HTML string for tooltip
 */
export function createClusterTooltip(cluster: ClusterMarker): string {
  const childMarkers = cluster.getAllChildMarkers?.() || [];
  const typeCounts: Record<string, number> = {};
  
  childMarkers.forEach(marker => {
    const type = marker.options?.hazardType || 'other';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  // Sort by count descending
  const sortedTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => {
      const displayName = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `<div style="padding: 2px 0;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${hazardColors[type] || hazardColors.other}; margin-right: 6px;"></span>
        ${displayName}: ${count}
      </div>`;
    })
    .join('');
  
  return `
    <div style="font-size: 12px; padding: 4px;">
      <strong>${childMarkers.length} Hazards</strong>
      <div style="margin-top: 4px;">
        ${sortedTypes}
      </div>
      <div style="margin-top: 4px; font-style: italic; opacity: 0.8;">
        Click to zoom in
      </div>
    </div>
  `;
}
