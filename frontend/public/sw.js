/**
 * AGAILA Service Worker — PWA-01
 * Vanilla implementation — no external CDN, no importScripts, fully CSP-compliant.
 *
 * Offline-available pages (SPA routes that resolve to index.html):
 *   /        Landing Page
 *   /map      Hazard Map
 *   /report   Citizen Report Form
 *
 * All other routes show /offline.html when the network is unavailable.
 *
 * Caching strategies:
 *   Navigation (HTML)  : NetworkFirst — only cached for the 3 allowed routes
 *   JS / CSS bundles   : CacheFirst   — content-hashed, safe to cache forever
 *   OSM map tiles      : StaleWhileRevalidate (max 2,000 entries)
 *   Leaflet CDN assets : CacheFirst   (max 20 entries)
 *   Hazard API         : NetworkFirst  (4 s timeout, 5 min cache)
 *   Google Fonts       : StaleWhileRevalidate
 *   Static assets      : CacheFirst   (images, icons, manifest)
 *
 * Background Sync:
 *   Tag: 'agaila-report-sync' — flushes queued reports on reconnect
 */

// ---------------------------------------------------------------------------
// Cache names
// ---------------------------------------------------------------------------
const CACHE_PAGES   = 'agaila-pages-v2.1';
const CACHE_BUNDLES = 'agaila-bundles-v2.1';
const CACHE_TILES   = 'agaila-map-tiles-v2.1';
const CACHE_LEAFLET = 'agaila-leaflet-assets-v2.1';
const CACHE_HAZARDS = 'agaila-hazards-v2.1';
const CACHE_FONTS   = 'agaila-fonts-v2.1';
const CACHE_STATIC  = 'agaila-static-assets-v2.1';

// ---------------------------------------------------------------------------
// Offline route allowlist
// ---------------------------------------------------------------------------
const OFFLINE_ALLOWED_PATHS = ['/', '/map', '/report', '/hazard-info'];

// Explicit OSM tile host allowlist (avoid suffix-based host checks)
const OSM_TILE_HOSTS = new Set([
  'tile.openstreetmap.org',
  'a.tile.openstreetmap.org',
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org',
]);

function isOfflineAllowed(pathname) {
  return OFFLINE_ALLOWED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

// ---------------------------------------------------------------------------
// Install — pre-cache offline fallback assets
// These must be available immediately, before any user visit.
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) =>
      cache.addAll(['/offline.html', '/offline-tile.png'])
    )
  );
});

// ---------------------------------------------------------------------------
// Activate — take control of all clients immediately
// ---------------------------------------------------------------------------
const EXPECTED_CACHES = [
  'agaila-pages-v2.1',
  'agaila-bundles-v2.1',
  'agaila-map-tiles-v2.1',
  'agaila-leaflet-assets-v2.1',
  'agaila-hazards-v2.1',
  'agaila-fonts-v2.1',
  'agaila-static-assets-v2.1',
];

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all open tabs immediately
      self.clients.claim(),
      // Delete all caches that are not in the current EXPECTED_CACHES list
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => !EXPECTED_CACHES.includes(key))
            .map((key) => {
              console.log('[AGAILA SW] Deleting stale cache:', key);
              return caches.delete(key);
            })
        )
      ),
    ])
  );
});

// ---------------------------------------------------------------------------
// Fetch handler — route each request to the correct strategy
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // 1. Navigation (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request, url));
    return;
  }

  // 2. OSM map tiles — StaleWhileRevalidate
  if (
    OSM_TILE_HOSTS.has(url.hostname) &&
    url.pathname.match(/\/\d+\/\d+\/\d+\.png$/)
  ) {
    event.respondWith(
      staleWhileRevalidate(request, CACHE_TILES, {
        maxEntries: 2000,
        offlineFallback: () => matchFromCache(CACHE_STATIC, '/offline-tile.png'),
      })
    );
    return;
  }

  // 3. Leaflet CDN assets — CacheFirst
  if (url.hostname === 'unpkg.com' && url.pathname.startsWith('/leaflet')) {
    event.respondWith(cacheFirst(request, CACHE_LEAFLET, { maxEntries: 20 }));
    return;
  }

  // 4. Hazard API — NetworkFirst with 4 s timeout
  if (url.pathname.startsWith('/api/v1/hazards')) {
    event.respondWith(networkFirst(request, CACHE_HAZARDS, { timeoutMs: 4000, maxEntries: 5 }));
    return;
  }

  // 5. Google Fonts — StaleWhileRevalidate
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(staleWhileRevalidate(request, CACHE_FONTS, { maxEntries: 10 }));
    return;
  }

  // 6. JS / CSS bundles (same origin) — CacheFirst
  if (
    url.origin === self.location.origin &&
    (request.destination === 'script' || request.destination === 'style')
  ) {
    event.respondWith(cacheFirst(request, CACHE_BUNDLES, { maxEntries: 60 }));
    return;
  }

  // 7. Static assets (same origin images, icons, manifest) — CacheFirst
  if (
    url.origin === self.location.origin &&
    (request.destination === 'image' ||
      request.destination === 'font' ||
      request.destination === 'manifest')
  ) {
    event.respondWith(cacheFirst(request, CACHE_STATIC, { maxEntries: 100 }));
    return;
  }
});

// ---------------------------------------------------------------------------
// Strategy: NetworkFirst
// Tries the network; on failure serves from cache.
// Only allowed-path navigations are cached.
// ---------------------------------------------------------------------------
async function handleNavigation(request, url) {
  const allowed = isOfflineAllowed(url.pathname);

  try {
    const response = await fetchWithTimeout(request, 5000);
    if (response.ok && allowed) {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(request, response.clone()); // async, don't await
    }
    return response;
  } catch {
    // Network unavailable
    if (allowed) {
      const cache = await caches.open(CACHE_PAGES);
      const origin = self.location.origin;
      // cache.put() stores by full URL � match with full URL, not bare pathname
      return (
        (await cache.match(request)) ||
        (await cache.match(origin + '/map')) ||
        (await cache.match(origin + '/')) ||
        offlineHtmlResponse()
      );
    }
    // Route not available offline → branded offline page
    return offlineHtmlResponse();
  }
}

// ---------------------------------------------------------------------------
// Strategy: NetworkFirst (generic — for API calls)
// ---------------------------------------------------------------------------
async function networkFirst(request, cacheName, { timeoutMs = 4000, maxEntries = 10 } = {}) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetchWithTimeout(request, timeoutMs);
    if (response.ok) {
      cache.put(request, response.clone());
      enforceMaxEntries(cache, maxEntries);
    }
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

// ---------------------------------------------------------------------------
// Strategy: CacheFirst
// Serves from cache; fetches and caches on miss.
// ---------------------------------------------------------------------------
async function cacheFirst(request, cacheName, { maxEntries = 60 } = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone());
      enforceMaxEntries(cache, maxEntries);
    }
    return response;
  } catch {
    return Response.error();
  }
}

// ---------------------------------------------------------------------------
// Strategy: StaleWhileRevalidate
// Returns cached response immediately; updates cache in the background.
// Falls back to `offlineFallback()` when there is no cache entry and no network.
// ---------------------------------------------------------------------------
async function staleWhileRevalidate(request, cacheName, { maxEntries, offlineFallback } = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Kick off background revalidation (fire-and-forget)
  const revalidatePromise = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') {
        cache.put(request, response.clone());
        if (maxEntries) enforceMaxEntries(cache, maxEntries);
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  // No cache entry — wait for the network
  const networkResponse = await revalidatePromise;
  if (networkResponse) return networkResponse;

  // Both cache miss and network failure
  if (offlineFallback) return (await offlineFallback()) || Response.error();
  return Response.error();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fetch with an AbortController timeout */
async function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/** Read a single entry from a specific cache */
async function matchFromCache(cacheName, url) {
  const cache = await caches.open(cacheName);
  return cache.match(url);
}

/** Serve the cached /offline.html or a minimal inline fallback */
async function offlineHtmlResponse() {
  const cache = await caches.open(CACHE_STATIC);
  return (
    (await cache.match('/offline.html')) ||
    new Response(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
       <title>AGAILA — Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:3rem">
       <h1>You&apos;re Offline</h1>
       <p>Available offline:
         <a href="/">Home</a> &bull;
         <a href="/map">Hazard Map</a> &bull;
         <a href="/report">Report a Hazard</a>
       </p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  );
}

/**
 * Trim a cache to at most `max` entries (FIFO — oldest inserted first).
 * Called asynchronously after a cache.put(); does not block the response.
 */
async function enforceMaxEntries(cache, max) {
  try {
    const keys = await cache.keys();
    if (keys.length > max) {
      // Delete the oldest (first in insertion order)
      const toDelete = keys.slice(0, keys.length - max);
      await Promise.all(toDelete.map((k) => cache.delete(k)));
    }
  } catch {
    // Non-critical — ignore quota errors silently
  }
}

// ---------------------------------------------------------------------------
// Background Sync — flush queued citizen reports on reconnect
// ---------------------------------------------------------------------------
const DB_NAME    = 'agaila-offline-queue';
const STORE_NAME = 'pending-reports';

/**
 * Derive the backend API base URL from the SW's own origin at runtime.
 *
 * Security design: the production backend URL (https://agaila.me) is NEVER
 * stored in IndexedDB, JS bundles, or any client-side storage. Instead:
 *
 *   Development  (localhost:3000)  → http://localhost:8000
 *     The React dev server and FastAPI run on different ports; we must
 *     specify the backend port explicitly.
 *
 *   Production   (Vercel)         → '' (empty, i.e. same origin)
 *     The Vercel rewrite rule in vercel.json proxies /api/:path* to
 *     https://agaila.me/api/:path* server-side. The backend URL never
 *     appears in client code, network requests show only Vercel's domain.
 *
 *   Docker prod  (any non-localhost) → '' (same origin)
 *     nginx/traefik handles the /api/ proxy internally.
 */
function getApiBase() {
  const hostname = self.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Development only: React dev server is on :3000, backend on :8000
    return 'http://localhost:8000';
  }
  // Production / Docker: relative URL — proxy handles routing to backend
  return '';
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'agaila-report-sync') {
    event.waitUntil(flushOfflineReports());
  }
});

async function flushOfflineReports() {
  let db;
  try {
    db = await openDB();
  } catch (err) {
    console.error('[AGAILA SW] Failed to open IndexedDB:', err);
    return;
  }

  const all = await getAllFromStore(db);

  for (const report of all) {
    // getApiBase() derives the correct backend URL at runtime from the SW's
    // own origin — no URL is stored in IndexedDB, keeping the production
    // backend address invisible in client-side storage.
    const endpoint = `${getApiBase()}/api/v1/citizen-reports/submit`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: buildFormData(report),
      });

      if (response.ok) {
        await deleteFromStore(db, report.id);
        const json = await response.json().catch(() => ({}));
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({
            type: 'REPORT_SYNCED',
            reportId: report.id,
            trackingId: json.tracking_id,
          });
        }
      } else {
        // Server returned a non-2xx — log the response body for diagnostics.
        const text = await response.text().catch(() => response.status.toString());
        console.warn(
          `[AGAILA SW] Server rejected report ${report.id} (${response.status}):`, text
        );

        if (response.status >= 400 && response.status < 500) {
          // Permanently invalid request (bad data, validation failure, etc.) —
          // retrying will never succeed, so drop it from the queue.
          await deleteFromStore(db, report.id);
        } else if (response.status >= 500 && response.status < 600) {
          // Transient server error — keep it pending and retry on next sync.
          throw new Error(`Server error ${response.status} for report ${report.id}`);
        }
      }
    } catch (err) {
      console.warn('[AGAILA SW] Network error — report still pending:', report.id);
      throw err; // Re-throw so the browser retries the Background Sync later
    }
  }
}

// ---------------------------------------------------------------------------
// Minimal IndexedDB helpers (no external library inside SW)
// ---------------------------------------------------------------------------
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror  = () => reject(req.error);
  });
}

function getAllFromStore(db) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => reject(req.error);
  });
}

function deleteFromStore(db, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = resolve;
    req.onerror   = () => reject(req.error);
  });
}

function buildFormData(report) {
  const fd = new FormData();
  fd.append('hazard_type',    report.hazardType);
  fd.append('description',    report.description);
  fd.append('name',           report.name);
  fd.append('contact_number', report.contactNumber);
  fd.append('latitude',       String(report.latitude));
  fd.append('longitude',      String(report.longitude));

  if (report.infrastructureTypes) {
    fd.append('infrastructure_types', JSON.stringify(report.infrastructureTypes));
  }
  if (report.infrastructureDetails) {
    fd.append('infrastructure_details', report.infrastructureDetails);
  }
  if (
    report.infrastructureTypes &&
    report.infrastructureTypes.includes('other') &&
    report.infrastructureOtherText
  ) {
    fd.append('infrastructure_other_text', report.infrastructureOtherText);
  }
  if (report.crisisCategories) {
    fd.append('crisis_categories', JSON.stringify(report.crisisCategories));
  }
  if (report.communityAssessment) {
    fd.append('community_assessment', JSON.stringify(report.communityAssessment));
  }
  if (report.debrisStatus) {
    fd.append('debris_status', report.debrisStatus);
  }
  if (report.damageSeverity) {
    fd.append('damage_severity', report.damageSeverity);
  }

  // Reconstruct the image from the stored base64 data URL.
  // The page serialises File → dataUrl before writing to IDB so that the SW
  // (which lacks the File prototype context) can safely re-hydrate it.
  if (report.imageDataUrl) {
    const blob = dataUrlToBlob(report.imageDataUrl);
    fd.append('image', blob, report.imageFileName || 'image');
  }

  return fd;
}

/**
 * Convert a base64 data URL ("data:<mime>;base64,<data>") back to a Blob.
 * Works inside both page context and Service Worker context.
 */
function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}


