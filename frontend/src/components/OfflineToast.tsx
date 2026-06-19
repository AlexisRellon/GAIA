/**
 * OfflineToast Component — PWA-01
 *
 * Surfaces connectivity changes as non-intrusive `sonner` toasts instead of a
 * persistent banner. It renders nothing itself — it only drives toasts in
 * response to real connectivity transitions:
 *
 * - Going offline  → persistent warning toast ("You're offline…")
 * - Coming back    → the offline toast is dismissed and a brief "Back online!"
 *                    success toast is shown — but ONLY if we were previously
 *                    offline in this session.
 *
 * The "Back online" toast is NOT shown on first load / normal navigation, since
 * an initial online state is not a reconnection event.
 *
 * Also listens for `agaila:report-synced` events to keep the queued-report
 * count fresh while offline.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getQueueCount } from '../lib/offlineQueue';

const OFFLINE_TOAST_ID = 'agaila-offline-status';

export function OfflineToast(): null {
  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  // Tracks whether the user was offline at any point this session, so we only
  // flash "Back online!" after a genuine offline → online transition.
  const wasOfflineRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      setPendingCount(await getQueueCount());
    } catch {
      // IndexedDB may be unavailable in some contexts
      setPendingCount(0);
    }
  }, []);

  // Keep the queued-report count fresh when the SW syncs a report
  useEffect(() => {
    const handler = () => refreshCount();
    window.addEventListener('agaila:report-synced', handler);
    return () => window.removeEventListener('agaila:report-synced', handler);
  }, [refreshCount]);

  // React to connectivity transitions
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      refreshCount();
      return;
    }

    // Online: only flash the reconnect toast if we were previously offline.
    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      toast.dismiss(OFFLINE_TOAST_ID);
      toast.success('Back online!', {
        description:
          pendingCount > 0
            ? `Syncing ${pendingCount} queued report${pendingCount !== 1 ? 's' : ''}…`
            : 'Connection restored.',
        duration: 4000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Show / update the persistent offline toast while offline
  useEffect(() => {
    if (isOnline) return;

    toast.warning("You're offline", {
      id: OFFLINE_TOAST_ID,
      description:
        pendingCount > 0
          ? `Map, Home & Report available. ${pendingCount} report${
              pendingCount !== 1 ? 's' : ''
            } queued — will sync on reconnect.`
          : 'Map, Home & Report available.',
      duration: Infinity,
    });
  }, [isOnline, pendingCount]);

  return null;
}
