/**
 * Realtime Notifications Hook
 * 
 * Manages Supabase Realtime subscriptions using POSTGRES_CHANGES pattern
 * 
 * Modules: RSS-09, GV-02, FP-04
 * Pattern: Uses postgres_changes for database table subscriptions
 * Reference: Supabase Realtime Postgres Changes (https://supabase.com/docs/guides/realtime/postgres-changes)
 * 
 * IMPORTANT: postgres_changes does NOT use broadcast config or private channels.
 * For broadcast pattern, see Supabase Realtime Broadcast documentation.
 */

/* eslint-disable no-console */
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationStore } from '../stores/notificationStore';

interface HazardRecord {
  id: string;
  hazard_type: string;
  location_name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  source_type: 'rss' | 'citizen_report';
  validated: boolean;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface RSSFeedBroadcast {
  id: string;
  name: string;
  url: string;
  category: string;
  active: boolean;
  created_at: string;
}

/**
 * Subscribe to real-time hazard notifications
 * Uses postgres_changes pattern to listen to database table changes
 * 
 * Channel: 'hazards:validated'
 * Events: INSERT (new hazard), UPDATE (hazard validated)
 * Authorization: RLS policies on gaia.hazards table control access
 */
export function useRealtimeHazards() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const lastSeenRef = useRef<string | null>(null);

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (channelRef.current?.state === 'joined') {
      // eslint-disable-next-line no-console
      console.log('[Realtime] Already subscribed to hazards:validated');
      return;
    }

    const startPollingFallback = () => {
      // Avoid duplicate pollers
      if (pollIntervalRef.current) return;

      console.warn('[Realtime] Starting poll fallback for hazards (every 30s)');

      // Initialize lastSeenRef to current time to avoid spamming on start
      lastSeenRef.current = new Date().toISOString();

      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('hazards')
            .select('*')
            .eq('validated', true)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) {
            console.error('[Realtime Poll] Supabase query error:', error);
            return;
          }

          if (!data || data.length === 0) return;

          const newest = data[0];
          if (!newest || !newest.created_at) return;

          if (!lastSeenRef.current || newest.created_at > lastSeenRef.current) {
            for (let i = data.length - 1; i >= 0; i--) {
              const h = data[i];
              if (!h.created_at) continue;
              if (h.created_at > (lastSeenRef.current || '')) {
                addNotification({
                  type: 'hazard',
                  severity: h.severity === 'critical' || h.severity === 'high' ? 'error' : 'warning',
                  title: `New ${h.hazard_type} detected`,
                  message: `${h.location_name} - Severity: ${h.severity?.toUpperCase()}`,
                  link: `/map?hazard=${h.id}`,
                  metadata: { hazardId: h.id, hazardType: h.hazard_type }
                });
              }
            }

            lastSeenRef.current = newest.created_at;
            queryClient.invalidateQueries({ queryKey: ['hazards'] });
          }
        } catch (err) {
          console.error('[Realtime Poll] Error while polling hazards:', err);
        }
      }, 30000);
    };

    const setupChannel = async () => {
      try {
        // Set auth token for private channel (required for RLS)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.realtime.setAuth(session.access_token);
        }

        const channel = supabase
          .channel('hazards:validated')
          .on<HazardRecord>(
            'postgres_changes',
            { event: 'INSERT', schema: 'gaia', table: 'hazards' },
            (payload) => {
              const hazard = payload.new;

              if (!hazard) {
                console.warn('[Realtime] Received INSERT with no record data');
                return;
              }

              // Filter for validated hazards on client side
              if (!hazard.validated) {
                return;
              }

              console.log('[Realtime] New hazard:', hazard);

            // Add to notification store
            addNotification({
              type: 'hazard',
              severity: hazard.severity === 'critical' || hazard.severity === 'high' ? 'error' : 'warning',
              title: `New ${hazard.hazard_type} detected`,
              message: `${hazard.location_name} - Severity: ${hazard.severity.toUpperCase()}`,
              link: `/map?hazard=${hazard.id}`,
              metadata: { hazardId: hazard.id, hazardType: hazard.hazard_type }
            });

            // Show toast notification
            toast.success(
              `New ${hazard.hazard_type} detected in ${hazard.location_name}`,
              {
                description: `Severity: ${hazard.severity.toUpperCase()} | Source: ${hazard.source_type === 'rss' ? 'News Feed' : 'Citizen Report'}`,
                duration: 8000,
                action: {
                  label: 'View on Map',
                  onClick: () => {
                    window.location.href = `/map?hazard=${hazard.id}`;
                  }
                }
              }
            );

            // Invalidate queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ['hazards'] });
            queryClient.invalidateQueries({ queryKey: ['rss', 'statistics'] });
            queryClient.invalidateQueries({ queryKey: ['map', 'markers'] });
          })
          .on<HazardRecord>(
            'postgres_changes',
            { event: 'UPDATE', schema: 'gaia', table: 'hazards' },
            (payload) => {
              // Custom event for when a hazard becomes validated
              const hazard = payload.new;
              const oldHazard = payload.old;
            
            if (!hazard) return;

            // eslint-disable-next-line no-console
            console.log('[Realtime] Hazard updated:', hazard);

            // Only notify if it actually became validated
            if (oldHazard && !oldHazard.validated && hazard.validated) {
              toast.info(
                `Hazard report validated: ${hazard.hazard_type} in ${hazard.location_name}`,
                {
                  description: 'A citizen report has been verified by validators',
                  duration: 6000,
                  action: {
                    label: 'View Details',
                    onClick: () => {
                      window.location.href = `/map?hazard=${hazard.id}`;
                    }
                  }
                }
              );

              // Refresh UI
              queryClient.invalidateQueries({ queryKey: ['hazards'] });
              queryClient.invalidateQueries({ queryKey: ['reports'] });
            }
          })
          .subscribe((status, err) => {
            switch (status) {
              case 'SUBSCRIBED':
                // eslint-disable-next-line no-console
                console.log('[Realtime] ✅ Connected to hazards:validated channel');
                // Stop any polling fallback when channel is connected
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current as unknown as number);
                  pollIntervalRef.current = null;
                }
                break;
              case 'CHANNEL_ERROR':
                // eslint-disable-next-line no-console
                console.error('[Realtime] ❌ Channel error:', err);
                toast.error('Real-time notifications unavailable', {
                  description: 'You may need to refresh to see new hazards'
                });
                // Start polling fallback when channel has errors
                startPollingFallback();
                break;
              case 'TIMED_OUT':
                // eslint-disable-next-line no-console
                console.warn('[Realtime] ⏱️ Connection timed out, auto-retrying...');
                break;
              case 'CLOSED':
                // eslint-disable-next-line no-console
                console.log('[Realtime] 🔌 Channel closed');
                // Start polling fallback when closed
                startPollingFallback();
                break;
            }
          });

        channelRef.current = channel;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[Realtime] Failed to setup hazard channel:', error);
        toast.error('Failed to connect to real-time notifications');
      }
    };

    setupChannel();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        // eslint-disable-next-line no-console
        console.log('[Realtime] Unsubscribing from hazards:validated');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient, addNotification]);
}

/**
 * Subscribe to real-time RSS feed change notifications (Admin only)
 * Uses postgres_changes pattern to listen to database table changes
 * 
 * Channel: 'rss:feeds'
 * Events: INSERT, UPDATE, DELETE
 * Authorization: RLS policies on gaia.rss_feeds table control access
 */
export function useRealtimeRSSFeeds() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Only subscribe if user is admin (using userProfile role from database, not Auth user role)
  const isAdmin = userProfile?.role === 'master_admin' || userProfile?.role === 'validator';  useEffect(() => {
    if (!isAdmin) {
      // eslint-disable-next-line no-console
      console.log('[Realtime] Skipping RSS feed subscription (not admin)');
      return;
    }

    // Prevent duplicate subscriptions
    if (channelRef.current?.state === 'joined') {
      // eslint-disable-next-line no-console
      console.log('[Realtime] Already subscribed to rss:feeds');
      return;
    }

    const setupChannel = async () => {
      try {
        // Set auth token for private channel
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.realtime.setAuth(session.access_token);
        }

        const channel = supabase
          .channel('rss:feeds')
          .on<RSSFeedBroadcast>(
            'postgres_changes',
            { event: 'INSERT', schema: 'gaia', table: 'rss_feeds' },
            (payload) => {
              const feed = payload.new;

              if (!feed) return;

              console.log('[Realtime] RSS feed added:', feed);

            toast.success(`New RSS feed added: ${feed.name}`, {
              description: `Category: ${feed.category}`,
              duration: 5000
            });

            queryClient.invalidateQueries({ queryKey: ['rss', 'feeds'] });
            queryClient.invalidateQueries({ queryKey: ['rss', 'statistics'] });
          })
          .on<RSSFeedBroadcast>(
            'postgres_changes',
            { event: 'UPDATE', schema: 'gaia', table: 'rss_feeds' },
            (payload) => {
              const feed = payload.new;

              if (!feed) return;

              console.log('[Realtime] RSS feed updated:', feed);

            toast.info(`RSS feed updated: ${feed.name}`, {
              duration: 4000
            });

            queryClient.invalidateQueries({ queryKey: ['rss', 'feeds'] });
          })
          .on<RSSFeedBroadcast>(
            'postgres_changes',
            { event: 'DELETE', schema: 'gaia', table: 'rss_feeds' },
            (payload) => {
              const feed = payload.old;

              if (!feed) return;

              console.log('[Realtime] RSS feed deleted:', feed);

            toast.warning(`RSS feed removed: ${feed.name}`, {
              duration: 4000
            });

            queryClient.invalidateQueries({ queryKey: ['rss', 'feeds'] });
            queryClient.invalidateQueries({ queryKey: ['rss', 'statistics'] });
          })
          .subscribe((status, err) => {
            switch (status) {
              case 'SUBSCRIBED':
                // eslint-disable-next-line no-console
                console.log('[Realtime] ✅ Connected to rss:feeds channel (admin)');
                break;
              case 'CHANNEL_ERROR':
                // eslint-disable-next-line no-console
                console.error('[Realtime] ❌ RSS channel error:', err);
                toast.error('RSS feed notifications unavailable');
                break;
              case 'TIMED_OUT':
                // eslint-disable-next-line no-console
                console.warn('[Realtime] ⏱️ RSS connection timed out, retrying...');
                break;
              case 'CLOSED':
                // eslint-disable-next-line no-console
                console.log('[Realtime] 🔌 RSS channel closed');
                break;
            }
          });

        channelRef.current = channel;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[Realtime] Failed to setup RSS channel:', error);
      }
    };

    setupChannel();

    return () => {
      if (channelRef.current) {
        // eslint-disable-next-line no-console
        console.log('[Realtime] Unsubscribing from rss:feeds');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAdmin, queryClient, userProfile?.role]);
}

/**
 * Combined hook to manage all realtime subscriptions
 * 
 * Use this hook in the main App component to enable all realtime features.
 * Automatically subscribes to appropriate channels based on user role.
 * 
 * @example
 * ```tsx
 * function App() {
 *   useRealtimeNotifications();
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export function useRealtimeNotifications() {
  useRealtimeHazards();
  useRealtimeRSSFeeds();
}

/**
 * Manual trigger for testing realtime notifications (dev only)
 */
export function useTestRealtimeNotification() {
  const queryClient = useQueryClient();

  const triggerTestNotification = useCallback(() => {
    toast.info('Test: New hazard detected in Metro Manila', {
      description: 'Severity: HIGH | Source: News Feed',
      duration: 5000,
      action: {
        label: 'View on Map',
        onClick: () => {
          // eslint-disable-next-line no-console
          console.log('Navigate to map');
        }
      }
    });

    queryClient.invalidateQueries({ queryKey: ['hazards'] });
  }, [queryClient]);

  return { triggerTestNotification };
}
