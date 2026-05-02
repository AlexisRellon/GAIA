import { useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/api';

const RSS_API_BASE = `${API_BASE_URL}/api/v1/admin/rss`;

async function fetchSchedule(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string,string> = {};
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  const resp = await fetch(`${RSS_API_BASE}/schedule`, { headers });
  if (!resp.ok) {
    // 404 means no schedule configured - return null
    if (resp.status === 404) return null;
    // Other errors should surface to React Query
    throw new Error(`Failed to fetch schedule: ${resp.status}`);
  }  const json = await resp.json();
  return json?.next_run_time ?? null;
}

async function postSchedule(nextRunIso: string | null): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  const resp = await fetch(`${RSS_API_BASE}/schedule`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ next_run_time: nextRunIso }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Failed to set schedule: ${resp.status} ${errText}`);
  }

  const json = await resp.json().catch(() => null);
  return json?.next_run_time ?? nextRunIso;
}

/**
 * Hook: useRssSchedule
 * - Provides a cached schedule via React Query
 * - Exposes a debounced setter to avoid duplicate POSTs
 */
export function useRssSchedule() {
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery({
    queryKey: ['rss', 'schedule'],
    queryFn: fetchSchedule,
    staleTime: 30 * 1000, // 30s
    gcTime: 60 * 1000, // 60s
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
  });

  const mutation = useMutation({
    mutationFn: (nextRunIso: string | null) => postSchedule(nextRunIso),
    onSuccess: (newVal) => {
      // Update cached value immediately
      queryClient.setQueryData(['rss', 'schedule'], newVal);
    }
  });

  const mutateRef = useRef(mutation.mutate);

  useEffect(() => {
    mutateRef.current = mutation.mutate;
  }, [mutation.mutate]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const setScheduleDebounced = useCallback((nextRunIso: string | null, delayMs = 500) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      mutateRef.current(nextRunIso);
    }, delayMs);
  }, []);

  return {
    schedule: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    setSchedule: setScheduleDebounced,
    isUpdating: mutation.status === 'pending',
    refetch: query.refetch,
  };
}

export default useRssSchedule;
