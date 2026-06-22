/**
 * AGAILA Offline Report Queue — PWA-01
 *
 * Stores citizen report drafts in IndexedDB when the user is offline.
 * Uses the `idb` library for a Promise-based API over IndexedDB.
 *
 * Database : 'agaila-offline-queue'
 * Store    : 'pending-reports'
 * Key      : auto-generated UUID (id)
 *
 * The Service Worker reads the same DB/store when Background Sync fires
 * (see public/sw.js `flushOfflineReports`).
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { CrisisSelections } from '../types/undpTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OfflineReport {
  /** Auto-generated UUID — used as the IndexedDB record key */
  id: string;
  hazardType: string;
  description: string;
  name: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  infrastructureTypes: string[];
  infrastructureOtherText: string;
  infrastructureDetails: string;
  crisisCategories: CrisisSelections;
  debrisStatus: string;
  damageSeverity: string;
  communityAssessment?: {
    electricity_infrastructure: string;
    health_services_rating: string;
    pressing_needs: string[];
    pressing_needs_other?: string;
  };
  /**
   * Image serialized as a base64 data URL (e.g. "data:image/jpeg;base64,...").
   * Stored as a string so the Service Worker can safely read it from IndexedDB
   * without needing the File prototype (which is lost in the SW context).
   */
  imageDataUrl?: string;
  /** Original filename preserved for the Content-Disposition multipart header */
  imageFileName?: string;
  /** ISO 8601 timestamp when the report was queued */
  queuedAt: string;
}

// ---------------------------------------------------------------------------
// Constants (must match sw.js)
// ---------------------------------------------------------------------------

const DB_NAME = 'agaila-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending-reports';

// ---------------------------------------------------------------------------
// DB singleton
// ---------------------------------------------------------------------------

let _db: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
  return _db;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Add a report to the offline queue.
 * Returns the generated queue ID.
 */
/**
 * Convert a File or Blob to a base64 data URL.
 * Safe to use inside the browser page context (not SW).
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * crypto.randomUUID() requires a secure context (HTTPS or localhost) and is
 * undefined otherwise — fall back to a non-cryptographic id in that case.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function enqueueReport(
  report: Omit<OfflineReport, 'id' | 'queuedAt'>
): Promise<string> {
  const db = await getDB();
  const id = generateId();
  const entry: OfflineReport = {
    ...report,
    id,
    queuedAt: new Date().toISOString(),
  };
  await db.put(STORE_NAME, entry);
  return id;
}

/**
 * Retrieve all queued reports (ordered by insertion).
 */
export async function getAllQueuedReports(): Promise<OfflineReport[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

/**
 * Remove a specific report by its queue ID.
 */
export async function removeQueuedReport(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Remove all queued reports (e.g., after a successful bulk sync).
 */
export async function clearQueue(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

/**
 * Returns the number of reports currently queued.
 */
export async function getQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}
