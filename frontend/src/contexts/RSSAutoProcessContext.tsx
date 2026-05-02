/**
 * RSS Auto-Processing Context
 * 
 * Provides system-wide automatic RSS feed processing that continues
 * regardless of which view/tab the user is currently on.
 * 
 * Features:
 * - Automatic processing every 30 minutes
 * - Non-blocking background processing
 * - Overlap prevention (skips if already processing)
 * - Pause/Resume control
 * - Persists across view navigation, page refreshes, and logout/login
 * - Timer restoration from localStorage
 * 
 * Usage:
 * - Wrap app with <RSSAutoProcessProvider>
 * - Use useRSSAutoProcess() hook to access state/controls
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { rssQueryKeys } from '../hooks/useRSS';
import { useRssSchedule } from '../hooks/useRssSchedule';


// Configuration
const AUTO_PROCESS_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const COUNTDOWN_UPDATE_INTERVAL_MS = 1000; // 1 second
const LOCALSTORAGE_KEY = 'gaia_rss_next_run_time';
const LOCALSTORAGE_ENABLED_KEY = 'gaia_rss_auto_process_enabled';

// Build API URL from environment variable. Do NOT fall back to localhost.
const RSS_API_BASE = (() => {
  const apiUrl = process.env.REACT_APP_API_URL;
  // Only treat null/undefined as missing; empty string is valid proxy behavior
  if (apiUrl == null) {
    console.error('[RSS Auto-Process] REACT_APP_API_URL is not set. Please configure the API URL.');
    return '';
  }
  // Remove trailing slash if present
  const base = apiUrl.replace(/\/$/, '');
  return `${base}/api/v1/admin/rss`;
})();

interface RSSAutoProcessContextValue {
  isEnabled: boolean;
  isProcessing: boolean;
  countdown: string;
  nextRunTime: Date | null;
  toggle: () => void;
  processNow: () => Promise<void>;
  isScheduleUpdating?: boolean;
}

const RSSAutoProcessContext = createContext<RSSAutoProcessContextValue | null>(null);

/**
 * Helper: Save next run time to localStorage
 */
function saveNextRunTimeToStorage(nextRun: Date | null): void {
  try {
    if (nextRun) {
      localStorage.setItem(LOCALSTORAGE_KEY, nextRun.toISOString());
    } else {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    }
  } catch (e) {
    console.warn('[RSS Auto-Process] Failed to save to localStorage:', e);
  }
}

/**
 * Helper: Load next run time from localStorage
 */
function loadNextRunTimeFromStorage(): Date | null {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    if (stored) {
      const date = new Date(stored);
      // Validate it's a valid date and hasn't been corrupted
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  } catch (e) {
    console.warn('[RSS Auto-Process] Failed to load from localStorage:', e);
  }
  return null;
}

/**
 * Helper: Save enabled state to localStorage
 */
function saveEnabledStateToStorage(enabled: boolean): void {
  try {
    localStorage.setItem(LOCALSTORAGE_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('[RSS Auto-Process] Failed to save enabled state:', e);
  }
}

/**
 * Helper: Load enabled state from localStorage
 */
function loadEnabledStateFromStorage(): boolean {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_ENABLED_KEY);
    return stored !== 'false'; // Default to true if not set
  } catch (e) {
    console.warn('[RSS Auto-Process] Failed to load enabled state:', e);
    return true;
  }
}

export function RSSAutoProcessProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  // Restore state from localStorage on initial mount
  const [isEnabled, setIsEnabledState] = useState(() => loadEnabledStateFromStorage());
  const [isProcessing, setIsProcessing] = useState(false);
  const [nextRunTime, setNextRunTimeState] = useState<Date | null>(() => loadNextRunTimeFromStorage());
  const [countdown, setCountdown] = useState<string>('');
  const { schedule, setSchedule, isUpdating } = useRssSchedule();
  
  // Refs for intervals
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);
  const nextRunTimeRef = useRef<Date | null>(nextRunTime);
  
  // Wrapper to save enabled state to localStorage when changed
  const setIsEnabled = useCallback((enabled: boolean | ((prev: boolean) => boolean)) => {
    setIsEnabledState((prev) => {
      const newValue = typeof enabled === 'function' ? enabled(prev) : enabled;
      saveEnabledStateToStorage(newValue);
      return newValue;
    });
  }, []);

  // Wrapper to save next run time to localStorage and refs when changed
  const setNextRunTime = useCallback((next: Date | null | ((prev: Date | null) => Date | null)) => {
    setNextRunTimeState((prev) => {
      const newValue = typeof next === 'function' ? next(prev) : next;
      nextRunTimeRef.current = newValue;
      saveNextRunTimeToStorage(newValue);
      return newValue;
    });
  }, []);

  /**
   * Format remaining time as MM:SS or HH:MM:SS
   */
  const formatCountdown = useCallback((ms: number): string => {
    if (ms <= 0) return '00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Process feeds via API (non-blocking, backend handles in background)
   */
  const processFeeds = useCallback(async (): Promise<boolean> => {
    // Skip if already processing
    if (isProcessingRef.current) {
      return false;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session. Please log in again.');
      }

      const response = await fetch(`${RSS_API_BASE}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        // Surface auth/conflict errors to callers for special handling
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        if (response.status === 409) {
          throw new Error('Conflict');
        }

        const errorData = await response.json().catch(() => ({
          detail: `HTTP error! status: ${response.status}`,
        }));
        console.error('[RSS Auto-Process] process request failed', errorData);
        return false;
      }

      const data = await response.json();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: rssQueryKeys.feeds() });
      queryClient.invalidateQueries({ queryKey: rssQueryKeys.logs() });
      queryClient.invalidateQueries({ queryKey: rssQueryKeys.statistics() });
      
      toast.success(`Processing ${data.feeds_count} feeds in background`);
      return true;
    } catch (error) {
      console.error('[RSS Auto-Process] Failed:', error);
      toast.error(`Auto-processing failed: ${(error as Error).message}`);
      return false;
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [queryClient]);

  /**
   * Schedule next auto-process run
   */
  const scheduleNextRun = useCallback(() => {
    const next = new Date(Date.now() + AUTO_PROCESS_INTERVAL_MS);
    setNextRunTime(next);
    // NOTE: Do NOT persist local-scheduled times to the backend here.
    // The server (Celery worker) is authoritative for `rss.next_run_time` and
    // will update it after a successful background run. Persisting local
    // schedules from arbitrary clients causes races where different users
    // overwrite the shared next-run value. Keep the value in localStorage
    // for client-side persistence only.
    return next;
  }, [setNextRunTime]);

  /**
   * Update countdown display
   */
  const updateCountdown = useCallback(() => {
    const currentNextRunTime = nextRunTimeRef.current;

    if (!currentNextRunTime) {
      setCountdown('');
      return;
    }
    
    const remaining = currentNextRunTime.getTime() - Date.now();
    if (remaining <= 0) {
      setCountdown('00:00');
    } else {
      setCountdown(formatCountdown(remaining));
    }
  }, [formatCountdown]);

/**
   * Stop auto-processing interval
   */
  const stopAutoProcessing = useCallback(() => {
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    // Keep nextRunTime in localStorage for persistence even when stopped
    setCountdown('');
  }, []);

  // Align frontend timer with backend schedule whenever the query refetches.
  useEffect(() => {
    if (schedule !== undefined) {
      if (typeof schedule === 'string' && schedule !== '') {
        const next = new Date(schedule);
        if (!isNaN(next.getTime())) {
          setNextRunTime(next);
        }
      } else {
        // If the server has no schedule yet, preserve the current local
        // countdown rather than jumping the timer around on every refetch.
        const localStorageTime = nextRunTimeRef.current;
        if (localStorageTime && localStorageTime.getTime() > Date.now()) {
          setNextRunTime(localStorageTime);
        } else if (!nextRunTimeRef.current) {
          scheduleNextRun();
        }
      }
    }
  }, [schedule, scheduleNextRun, setNextRunTime]);
  /**
   * Toggle auto-processing on/off
   */
  const toggle = useCallback(() => {
    setIsEnabled((prev) => {
      if (prev) {
        toast.info('RSS auto-processing paused');
        // Persist paused state to backend so other clients stay in sync
        try {
          setSchedule(null);
        } catch (e) {
          console.warn('[RSS Auto-Process] Failed to sync pause state to backend:', e);
        }
        return false;
      } else {
        toast.success('RSS auto-processing resumed (every 30 minutes)');
        return true;
      }
    });
  }, [setIsEnabled, setSchedule]);

  /**
   * Manual process now (resets timer)
   */
  const processNow = useCallback(async () => {
    try {
      const ok = await processFeeds();
      // Only reset timer if processing succeeded
      if (ok && isEnabled) {
        queryClient.invalidateQueries({ queryKey: ['rss', 'schedule'] });
        queryClient.invalidateQueries({ queryKey: rssQueryKeys.currentJob() });
      }
    } catch (e) {
      // Errors already logged by processFeeds
      console.warn('[RSS Auto-Process] processNow failed:', e);
    }
  }, [processFeeds, isEnabled, queryClient]);

  // Initialize auto-processing on mount and when enabled state changes
  useEffect(() => {
    if (!isEnabled) {
      stopAutoProcessing();
      return;
    }

    // If we have a valid nextRunTime from localStorage, use it (don't reset)
    // Otherwise schedule a fresh one
    if (!nextRunTimeRef.current || nextRunTimeRef.current.getTime() < Date.now()) {
      scheduleNextRun();
    }

    // Start the countdown timer update
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = setInterval(() => {
      updateCountdown();
    }, COUNTDOWN_UPDATE_INTERVAL_MS);

    // Initial countdown update
    updateCountdown();

    // Cleanup on unmount
    return () => {
      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isEnabled, stopAutoProcessing, scheduleNextRun, updateCountdown, setSchedule, setNextRunTime]);

  // Update countdown when nextRunTime changes
  useEffect(() => {
    updateCountdown();
  }, [nextRunTime, updateCountdown]);

  const value: RSSAutoProcessContextValue = {
    isEnabled,
    isProcessing,
    countdown,
    nextRunTime,
    toggle,
    processNow,
    isScheduleUpdating: isUpdating,
  };

  return (
    <RSSAutoProcessContext.Provider value={value}>
      {children}
    </RSSAutoProcessContext.Provider>
  );
}

/**
 * Hook to access RSS auto-processing state and controls
 */
export function useRSSAutoProcess(): RSSAutoProcessContextValue {
  const context = useContext(RSSAutoProcessContext);
  if (!context) {
    throw new Error('useRSSAutoProcess must be used within RSSAutoProcessProvider');
  }
  return context;
}

