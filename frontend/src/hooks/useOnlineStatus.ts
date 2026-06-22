/**
 * useOnlineStatus Hook — PWA-01
 *
 * Reactively tracks browser connectivity using the native
 * `online` / `offline` window events.
 *
 * Returns:
 *  - `isOnline` (boolean): true when navigator.onLine is true
 *
 * Usage:
 *   const { isOnline } = useOnlineStatus();
 */

import { useState, useEffect } from 'react';

interface OnlineStatus {
  isOnline: boolean;
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync initial state in case it changed between render and effect
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
