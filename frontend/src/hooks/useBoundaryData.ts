import { useState, useEffect, useMemo } from 'react';

/**
 * useBoundaryData Hook
 * 
 * Fetches Philippine administrative boundary GeoJSON data for a specific location.
 * Uses backend API to get only the relevant boundary instead of loading all data.
 * 
 * @param locationName - Name of city/municipality to highlight (e.g., "Imus", "Manila")
 * @param enabled - Whether to fetch the data (lazy loading)
 * @returns GeoJSON data, loading state, and error
 */

interface BoundaryDataResult {
  data: GeoJSON.FeatureCollection | null;
  loading: boolean;
  error: string | null;
  metadata?: {
    location: string;
    province: string;
    region: string;
    region_name: string;
    boundary_level: string;  // 'municipality' | 'province' | 'region'
  };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const useBoundaryData = (locationName: string | null, enabled: boolean = false): BoundaryDataResult => {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<BoundaryDataResult['metadata']>();

  useEffect(() => {
    if (!enabled || !locationName) {
      setData(null);
      setMetadata(undefined);
      return;
    }

    const fetchBoundaryData = async () => {
      setLoading(true);
      setError(null);

      try {
        const endpoint = `${API_BASE_URL}/api/boundaries/${encodeURIComponent(locationName)}`;
        console.log(`[useBoundaryData] Fetching boundary for: ${locationName}`);
        
        const response = await fetch(endpoint);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Location "${locationName}" not found in Philippine administrative mapping`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Validate GeoJSON structure
        if (result.type !== 'FeatureCollection' || !Array.isArray(result.features)) {
          throw new Error('Invalid GeoJSON format from API');
        }

        setData(result);
        setMetadata(result.metadata);
        console.log(`[useBoundaryData] Loaded boundary for ${locationName}:`, result.metadata);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[useBoundaryData] Error loading boundary for ${locationName}:`, errorMessage);
        setError(errorMessage);
        setData(null);
        setMetadata(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchBoundaryData();
  }, [locationName, enabled]);

  // Memoize the data to prevent re-parsing on re-renders
  const memoizedData = useMemo(() => data, [data]);

  return {
    data: memoizedData,
    loading,
    error,
    metadata,
  };
};


