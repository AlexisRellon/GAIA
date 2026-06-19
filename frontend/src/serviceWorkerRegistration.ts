/**
 * AGAILA Service Worker Registration — PWA-01
 *
 * Uses `workbox-window` to register the custom Service Worker.
 * Handles lifecycle events: installed, activated, waiting, controlling, redundant.
 *
 * Call `registerSW()` once at app startup (index.tsx).
 */
/* eslint-disable no-console */

import { Workbox } from 'workbox-window';

let wb: Workbox | null = null;

/**
 * Register the AGAILA Service Worker.
 * Only runs in production and in browsers that support Service Workers.
 */
export function registerSW(): void {
  // NOTE: Guard disabled temporarily for local SW testing.
  // Re-enable for production to avoid development noise.
  // if (process.env.NODE_ENV !== 'production') {
  //   console.info('[AGAILA SW] Service Worker skipped in development mode.');
  //   return;
  // }

  if (!('serviceWorker' in navigator)) {
    console.warn('[AGAILA SW] Service Workers are not supported in this browser.');
    return;
  }

  wb = new Workbox('/sw.js');

  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      console.info('[AGAILA SW] New version installed. Reload to apply updates.');
    } else {
      console.info('[AGAILA SW] AGAILA is now available offline!');
    }
  });

  wb.addEventListener('activated', (event) => {
    if (!event.isUpdate) {
      console.info('[AGAILA SW] Service Worker activated — offline caching is active.');
    }
  });

  wb.addEventListener('waiting', () => {
    console.info('[AGAILA SW] A new Service Worker version is waiting to activate.');
  });

  wb.addEventListener('controlling', () => {
    console.info('[AGAILA SW] New Service Worker is now controlling the page.');
  });

  wb.addEventListener('message', (event) => {
    if (event.data?.type === 'REPORT_SYNCED') {
      console.info('[AGAILA SW] Offline report synced:', event.data.reportId);
      // Dispatch a custom DOM event so React components can react (e.g., show a toast)
      window.dispatchEvent(
        new CustomEvent('agaila:report-synced', {
          detail: {
            reportId: event.data.reportId,
            trackingId: event.data.trackingId,
          },
        })
      );
    }
  });

  wb.register().catch((err) => {
    console.error('[AGAILA SW] Registration failed:', err);
  });
}

/**
 * Programmatically trigger a Background Sync tag.
 * Call this after enqueuing a report to IndexedDB when offline.
 */
export async function requestBackgroundSync(tag = 'agaila-report-sync'): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      // Background Sync API is supported
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
      console.info('[AGAILA SW] Background Sync registered:', tag);
    } else {
      // Fallback: attempt immediate submission (browser may be online)
      console.warn('[AGAILA SW] Background Sync API not supported. Will retry on next page load.');
    }
  } catch (err) {
    console.warn('[AGAILA SW] Could not register Background Sync:', err);
  }
}

/**
 * Expose the Workbox instance for advanced use (e.g., cache inspection).
 */
export function getWorkbox(): Workbox | null {
  return wb;
}
