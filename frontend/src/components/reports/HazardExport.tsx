/**
 * HazardExport Component
 *
 * Admin-only controls for exporting the currently filtered hazards as
 * machine-readable, interoperable files:
 *   - GeoJSON (RFC 7946 + PMP ISO 19115 metadata) — primary, GIS-ready
 *   - CSV — flat, spreadsheet-friendly
 *
 * Satisfies the UNDP "Build the Future of Crisis Mapping" must-have for
 * structured data export, and PhilSA/NAMRIA interoperability (WGS 84).
 * Access is gated to master_admin / validator by the parent (PublicMap) and
 * re-enforced by the backend (RA 10173 data-privacy compliance).
 *
 * Module: RG-01 (Compliance Export Frontend)
 */

import React, { useState } from 'react';
import { Download, MapPin, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../../lib/api';

type ExportFormat = 'geojson' | 'csv';

interface ExportHazard {
  id: string;
  hazard_type: string;
  severity?: string | null;
  location_name?: string | null;
  admin_division?: string | null;
  latitude: number;
  longitude: number;
  confidence_score: number;
  source_type: string;
  source_url?: string | null;
  source_title?: string | null;
  status?: string | null;
  validated?: boolean | null;
  created_at: string;
}

interface HazardExportProps {
  /** Filtered hazards to export (matches on-screen filter state) */
  hazards: ExportHazard[];
  /** Optional callback after a successful export (e.g. close mobile panel) */
  onExported?: (format: ExportFormat) => void;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  geojson: 'GeoJSON',
  csv: 'CSV',
};

/** Map a hazard to the backend export payload (PII fields intentionally omitted). */
const toExportPayload = (h: ExportHazard) => ({
  id: h.id,
  hazard_type: h.hazard_type,
  severity: h.severity ?? null,
  location_name: h.location_name ?? null,
  admin_division: h.admin_division ?? null,
  latitude: h.latitude,
  longitude: h.longitude,
  confidence_score: h.confidence_score,
  source_type: h.source_type,
  source_url: h.source_url ?? null,
  source_title: h.source_title ?? null,
  status: h.status ?? (h.validated ? 'validated' : 'active'),
  validated: h.validated ?? false,
  created_at: h.created_at,
});

const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

export const HazardExport = ({ hazards, onExported }: HazardExportProps) => {
  const [busyFormat, setBusyFormat] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (hazards.length === 0) {
      toast.error('No hazards to export. Adjust your filters and try again.');
      return;
    }

    setBusyFormat(format);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const payload = {
        hazards: hazards.map(toExportPayload),
        metadata: {
          generated_by: session.user?.email ?? 'AGAILA Admin',
          total_hazards: hazards.length,
        },
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/reports/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        const detail = typeof errorData?.detail === 'string' ? errorData.detail : 'Export failed';
        throw new Error(detail);
      }

      const blob = await response.blob();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const extension = format === 'geojson' ? 'geojson' : 'csv';
      triggerBrowserDownload(blob, `agaila_hazard_export_${timestamp}.${extension}`);

      toast.success(`Exported ${hazards.length} hazards as ${FORMAT_LABELS[format]}.`);
      onExported?.(format);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export hazards.';
      toast.error(message);
    } finally {
      setBusyFormat(null);
    }
  };

  const isBusy = busyFormat !== null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Export ({hazards.length})</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleExport('geojson')}
          disabled={isBusy}
          aria-label="Export filtered hazards as GeoJSON"
          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border border-border bg-background text-foreground transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          {busyFormat === 'geojson' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          GeoJSON
        </button>
        <button
          type="button"
          onClick={() => handleExport('csv')}
          disabled={isBusy}
          aria-label="Export filtered hazards as CSV"
          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border border-border bg-background text-foreground transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          {busyFormat === 'csv' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          CSV
        </button>
      </div>
    </div>
  );
};

export default HazardExport;
