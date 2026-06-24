/**
 * Service Health panels — status hero + service tiles (CD-01)
 *
 * Extracted from StatusAnalyticsView to keep each unit focused. The status hero is
 * a full-width navy->steel gradient strip with a live pulse dot and count-up
 * headline metrics; the service tiles are a compact grid with a left status-rail,
 * a recent-response sparkline, and collapsible JSON details.
 */

import React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Wrench, Activity } from 'lucide-react';
import { CountUp, Sparkline, STATUS_COLOR } from './chartTheme';

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  message: string;
  last_checked: string;
  response_time_ms?: number;
  details?: Record<string, unknown>;
}

interface StatusVisual {
  label: string;
  color: string;
  icon: typeof CheckCircle2;
}

const STATUS_VISUALS: Record<string, StatusVisual> = {
  operational: { label: 'Operational', color: STATUS_COLOR.operational, icon: CheckCircle2 },
  degraded: { label: 'Degraded', color: STATUS_COLOR.degraded, icon: AlertTriangle },
  down: { label: 'Down', color: STATUS_COLOR.down, icon: AlertCircle },
  maintenance: { label: 'Under Maintenance', color: STATUS_COLOR.maintenance, icon: Wrench },
};

export const getStatusVisual = (status: string): StatusVisual =>
  STATUS_VISUALS[status] ?? { label: 'Unknown', color: STATUS_COLOR.no_data, icon: AlertCircle };

interface HeroMetric {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  available: boolean;
}

interface StatusHeroProps {
  overallStatus: string;
  metrics: HeroMetric[];
  lastChecked: string;
}

/** Full-width mission-control status strip: gradient chrome, live pulse, count-up KPIs. */
export const StatusHero = ({ overallStatus, metrics, lastChecked }: StatusHeroProps) => {
  const visual = getStatusVisual(overallStatus);
  const Icon = visual.icon;

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-[#0A2A4D] via-[#0A2A4D] to-[#005A9C] text-white shadow-lg dark:border-white/10">
      {/* atmospheric depth: corner glow + dot grid */}
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-2xl"
        style={{ background: visual.color }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span
                className="status-pulse absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: visual.color }}
              />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full" style={{ background: visual.color }} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Overall System Status</p>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" style={{ color: visual.color }} />
                <span className="font-lato text-2xl font-bold tracking-tight">{visual.label}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Last Checked</p>
            <p className="text-sm font-medium tabular-nums text-white/90">{lastChecked}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-[#0A2A4D]/40 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/55">{metric.label}</p>
              <p className="mt-1 font-lato text-2xl font-bold tracking-tight text-white">
                {metric.available ? (
                  <CountUp value={metric.value} decimals={metric.decimals} suffix={metric.suffix} />
                ) : (
                  <span className="text-white/40">—</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ServiceTileProps {
  service: ServiceStatus;
  sparkData: { value: number | null }[];
  lastCheckedLabel: string;
  index: number;
}

/** Compact service card with a left status-rail, response sparkline, and JSON details. */
export const ServiceTile = ({ service, sparkData, lastCheckedLabel, index }: ServiceTileProps) => {
  const visual = getStatusVisual(service.status);
  const hasResponse = service.response_time_ms !== undefined && service.response_time_ms !== null;
  const hasDetails = service.details && Object.keys(service.details).length > 0;

  return (
    <div
      className="animate-fade-in group relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      {/* left status rail */}
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: visual.color }} aria-hidden="true" />

      <div className="space-y-3 p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-lato text-sm font-bold tracking-tight text-foreground">{service.name}</h4>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{service.message}</p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 gap-1.5 border-current/30 text-[11px] font-semibold"
            style={{ color: visual.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: visual.color }} />
            {visual.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Response</p>
            <p className="font-lato text-lg font-bold tabular-nums text-foreground">
              {hasResponse ? `${service.response_time_ms} ms` : <span className="text-muted-foreground/60">n/a</span>}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Trend</p>
            <Sparkline data={sparkData} gradientId={`spark-${index}`} color={visual.color} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span className="tabular-nums">{lastCheckedLabel}</span>
        </div>

        {hasDetails && (
          <details className="group/details border-t border-border/60 pt-2">
            <summary
              className={cn(
                'cursor-pointer list-none text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
                'marker:hidden',
              )}
            >
              <span className="inline-flex items-center gap-1">
                <span className="transition-transform group-open/details:rotate-90">›</span>
                View details
              </span>
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted/70 p-2 text-[11px] leading-relaxed">
              {JSON.stringify(service.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

interface ServiceTileSkeletonProps {
  count?: number;
}

/** Loading mirror for the service tile grid. */
export const ServiceTilesSkeleton = ({ count = 6 }: ServiceTileSkeletonProps) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="overflow-hidden rounded-lg border border-border bg-card p-4 pl-5">
        <div className="absolute" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-9 w-full animate-pulse rounded bg-muted" />
      </div>
    ))}
  </div>
);
