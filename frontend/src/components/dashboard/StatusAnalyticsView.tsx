/**
 * Service Health Analytics (CD-01) — ops command console
 *
 * Mission-control redesign on the GAIA brand: navy/steel status hero with a live
 * pulse + count-up KPIs, compact service tiles with response sparklines, and
 * gradient-filled area charts that render gaps honestly (null days break the line
 * instead of being drawn to 0/100). Range control lives in the view header.
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Activity, RefreshCw, AlertCircle, Pause, Play } from 'lucide-react';
import { apiRequest, API_BASE_URL } from '../../lib/api';
import { useAdaptiveRefetchInterval, usePageVisibility } from '../../hooks/useAnalytics';
import { CHART_COLORS, SectionHeader, SegmentedControl } from './chartTheme';
import {
  StatusHero,
  ServiceTile,
  ServiceTilesSkeleton,
  getStatusVisual,
  type ServiceStatus,
} from './StatusHealthPanels';

interface SystemStatusResponse {
  overall_status: 'operational' | 'degraded' | 'down' | 'maintenance';
  timestamp: string;
  services: ServiceStatus[];
  uptime_seconds?: number;
}

interface ServiceHealthPoint {
  date: string;
  uptime_percent: number | null;
  avg_response_ms: number | null;
  // Stream A adds this opportunistically; never assume non-null.
  status?: 'up' | 'degraded' | 'down' | 'no_data';
}

interface ServiceHealthResponse {
  uptime: ServiceHealthPoint[];
  response_time: ServiceHealthPoint[];
  // Per-service recent response-time points (intraday) keyed by service name.
  sparklines?: Record<string, (number | null)[]>;
}

const RANGE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

const fetchServiceHealth = (days: number) =>
  apiRequest<ServiceHealthResponse>(`/api/v1/analytics/service-health?days=${days}`);

const fetchSystemStatus = async (): Promise<SystemStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/status`);
  if (!response.ok) throw new Error('Failed to fetch system status');
  return response.json();
};

/** Themed Recharts tooltip; surfaces "No data" for honest gaps (status === 'no_data'). */
const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius)',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  labelStyle: { color: 'hsl(var(--popover-foreground))', fontWeight: 600, marginBottom: 4 },
};

const formatRelative = (timestamp: string): string => {
  try {
    const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) {
      const m = Math.floor(diffSec / 60);
      return `${m}m ago`;
    }
    if (diffSec < 86400) {
      const h = Math.floor(diffSec / 3600);
      return `${h}h ago`;
    }
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
};

// Use recharts' own formatter type so params are contextually typed (recharts v3).
// We read the metric off the typed datum (item.payload) rather than the loosely
// typed `value`, so null/no-data days render as "No data" instead of 0.
type TooltipFormatter = NonNullable<React.ComponentProps<typeof Tooltip>['formatter']>;

const uptimeTooltipFormatter: TooltipFormatter = (_value, _name, item) => {
  const point = item?.payload as ServiceHealthPoint | undefined;
  if (!point || point.status === 'no_data' || point.uptime_percent == null) return ['No data', 'Uptime'];
  return [`${point.uptime_percent.toFixed(2)}%`, 'Uptime'];
};

const responseTooltipFormatter: TooltipFormatter = (_value, _name, item) => {
  const point = item?.payload as ServiceHealthPoint | undefined;
  if (!point || point.status === 'no_data' || point.avg_response_ms == null) return ['No data', 'Avg response'];
  return [`${Math.round(point.avg_response_ms)} ms`, 'Avg response'];
};

export default function StatusAnalyticsView() {
  const [days, setDays] = useState<number>(30);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // D3-lite: lengthen the blind fallback poll (was 30s) now that backend invalidation
  // drives freshness. Realtime-channel wiring deferred (would require hook changes).
  const baseInterval = 120000;
  const isPageVisible = usePageVisibility();
  const pollingEnabled = autoRefresh && isPageVisible;
  const serviceHealthRefetchInterval = useAdaptiveRefetchInterval({
    enabled: pollingEnabled,
    baseInterval,
    maxInterval: 5 * 60 * 1000,
    backoffMultiplier: 1.5,
  });
  const systemStatusRefetchInterval = useAdaptiveRefetchInterval({
    enabled: pollingEnabled,
    baseInterval,
    maxInterval: 5 * 60 * 1000,
    backoffMultiplier: 1.5,
  });

  const {
    data: serviceHealthData,
    isLoading: isServiceHealthLoading,
    isFetching: isServiceHealthFetching,
    error: serviceHealthError,
    refetch: refetchServiceHealth,
  } = useQuery<ServiceHealthResponse, Error>({
    queryKey: ['service-health', days],
    queryFn: () => fetchServiceHealth(days),
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: serviceHealthRefetchInterval,
  });

  const {
    data: systemStatusData,
    isLoading: isSystemStatusLoading,
    isFetching: isSystemStatusFetching,
    error: systemStatusError,
    refetch: refetchSystemStatus,
  } = useQuery<SystemStatusResponse, Error>({
    queryKey: ['system-status-dashboard'],
    queryFn: fetchSystemStatus,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: systemStatusRefetchInterval,
  });

  const isFetching = isServiceHealthFetching || isSystemStatusFetching;

  // Latest non-null uptime / response readings drive the hero count-up.
  const heroMetrics = useMemo(() => {
    const uptimeSeries = serviceHealthData?.uptime ?? [];
    const responseSeries = serviceHealthData?.response_time ?? [];
    const lastDefined = <T extends ServiceHealthPoint>(arr: T[], key: 'uptime_percent' | 'avg_response_ms') =>
      [...arr].reverse().find((p) => p[key] !== null && p[key] !== undefined)?.[key] ?? null;

    const latestUptime = lastDefined(uptimeSeries, 'uptime_percent');
    const latestResponse = lastDefined(responseSeries, 'avg_response_ms');
    const services = systemStatusData?.services ?? [];
    const servicesUp = services.filter((s) => s.status === 'operational').length;

    return [
      { label: 'Latest Uptime', value: latestUptime ?? 0, decimals: 1, suffix: '%', available: latestUptime !== null },
      { label: 'Avg Response', value: latestResponse ?? 0, decimals: 0, suffix: ' ms', available: latestResponse !== null },
      { label: 'Services Up', value: servicesUp, decimals: 0, available: services.length > 0 },
      { label: 'Total Services', value: services.length, decimals: 0, available: services.length > 0 },
    ];
  }, [serviceHealthData, systemStatusData]);

  // Per-service response sparklines (intraday raw points from the backend),
  // keyed by service name. Falls back to the system-wide trend for unknown names.
  const sparklineFor = useMemo(() => {
    const map = serviceHealthData?.sparklines ?? {};
    return (name: string) => (map[name] ?? map['System'] ?? []).map((value) => ({ value }));
  }, [serviceHealthData]);

  const handleRefresh = () => {
    refetchServiceHealth();
    refetchSystemStatus();
  };

  const rangeControls = (
    <>
      <SegmentedControl
        options={RANGE_OPTIONS}
        value={days}
        onChange={setDays}
        ariaLabel="Select time range for service health charts"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAutoRefresh((prev) => !prev)}
        className="gap-1.5"
        aria-pressed={autoRefresh}
      >
        {autoRefresh ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{autoRefresh ? 'Live' : 'Paused'}</span>
      </Button>
      <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5" disabled={isFetching}>
        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Service Health Analytics"
        description="Live availability, response latency, and per-service status across the GAIA pipeline."
        icon={<Activity className="h-5 w-5 text-accent" />}
        actions={rangeControls}
      />

      {/* Status hero */}
      {isSystemStatusLoading ? (
        <Skeleton className="h-44 w-full rounded-xl" />
      ) : systemStatusError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-2 pt-6 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load system status. Please try again later.</span>
          </CardContent>
        </Card>
      ) : systemStatusData ? (
        <StatusHero
          overallStatus={systemStatusData.overall_status}
          metrics={heroMetrics}
          lastChecked={systemStatusData.timestamp ? formatRelative(systemStatusData.timestamp) : '—'}
        />
      ) : null}

      {/* Service tiles */}
      {isSystemStatusLoading ? (
        <ServiceTilesSkeleton />
      ) : systemStatusData ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {systemStatusData.services.map((service, index) => (
            <ServiceTile
              key={service.name}
              service={service}
              sparkData={sparklineFor(service.name)}
              lastCheckedLabel={formatRelative(service.last_checked)}
              index={index}
            />
          ))}
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-fade-in" style={{ animationDelay: '120ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="font-lato text-base font-bold tracking-tight text-primary dark:text-white">
              Uptime Trend
            </CardTitle>
            <CardDescription>Daily availability with a 99.9% SLA reference</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {isServiceHealthLoading ? (
              <Skeleton className="h-full w-full" />
            ) : serviceHealthError ? (
              <div className="flex h-full items-center text-sm text-destructive">Unable to load uptime trend</div>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <AreaChart data={serviceHealthData?.uptime ?? []} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <defs>
                    <linearGradient id="uptimeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.steel} stopOpacity={0.12} />
                      <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" strokeOpacity={0.4} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip {...chartTooltipStyle} formatter={uptimeTooltipFormatter} />
                  <ReferenceLine
                    y={99.9}
                    stroke={CHART_COLORS.accent}
                    strokeDasharray="5 4"
                    strokeWidth={1}
                    label={{ value: 'SLA 99.9%', position: 'insideTopRight', fill: CHART_COLORS.accent, fontSize: 9, fontWeight: 600 }}
                  />
                  {/* No connectNulls -> null days render as honest gaps */}
                  <Area
                    type="monotone"
                    dataKey="uptime_percent"
                    stroke={CHART_COLORS.steelLight}
                    strokeWidth={1.5}
                    fill="url(#uptimeFill)"
                    dot={false}
                    activeDot={{ r: 3, fill: CHART_COLORS.steelLight, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '180ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="font-lato text-base font-bold tracking-tight text-primary dark:text-white">
              Avg Response Time
            </CardTitle>
            <CardDescription>Average API response latency (ms)</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {isServiceHealthLoading ? (
              <Skeleton className="h-full w-full" />
            ) : serviceHealthError ? (
              <div className="flex h-full items-center text-sm text-destructive">Unable to load response time</div>
            ) : (() => {
              // Only render points that actually have timing data; historical rows
              // backfilled from audit_logs have null avg_response_ms (no source timing).
              const responsePoints = (serviceHealthData?.response_time ?? []).filter(
                (p) => p.avg_response_ms !== null && p.avg_response_ms !== undefined
              );
              if (responsePoints.length < 2) {
                const firstDate = responsePoints[0]?.date;
                return (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                    <p className="text-sm text-muted-foreground">
                      {firstDate
                        ? `Response time tracking started ${firstDate}. More data will appear over the coming days.`
                        : 'Response time data is being collected. Check back shortly.'}
                    </p>
                  </div>
                );
              }
              return (
                <ResponsiveContainer width="100%" height={224}>
                  <AreaChart data={responsePoints} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id="responseFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={0.12} />
                        <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" strokeOpacity={0.4} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                    <Tooltip {...chartTooltipStyle} formatter={responseTooltipFormatter} />
                    <Area
                      type="monotone"
                      dataKey="avg_response_ms"
                      stroke={CHART_COLORS.accent}
                      strokeWidth={1.5}
                      fill="url(#responseFill)"
                      dot={false}
                      connectNulls
                      activeDot={{ r: 3, fill: CHART_COLORS.accent, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {autoRefresh ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="status-pulse h-1.5 w-1.5 rounded-full" style={{ background: getStatusVisual('operational').color }} />
            Live — refreshes automatically
          </span>
        ) : (
          'Auto-refresh paused'
        )}
      </p>
    </div>
  );
}
