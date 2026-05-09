import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiRequest, API_BASE_URL } from '../../lib/api';
import { Activity, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';
import { useAdaptiveRefetchInterval, usePageVisibility } from '../../hooks/useAnalytics';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  message: string;
  last_checked: string;
  response_time_ms?: number;
  details?: Record<string, unknown>;
}

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
}

interface ServiceHealthResponse {
  uptime: ServiceHealthPoint[];
  response_time: ServiceHealthPoint[];
}

const fetchServiceHealth = async (days: number) => {
  return apiRequest<ServiceHealthResponse>(`/api/v1/analytics/service-health?days=${days}`);
};

const fetchSystemStatus = async (): Promise<SystemStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/status`);
  if (!response.ok) {
    throw new Error('Failed to fetch system status');
  }
  return response.json();
};

/** Recharts default tooltip uses a white panel while inheriting theme label color — invisible in dark mode. */
const serviceHealthChartTooltip = {
  contentStyle: {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius)',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  labelStyle: {
    color: 'hsl(var(--popover-foreground))',
    fontWeight: 600,
    marginBottom: 4,
  },
};

export default function StatusAnalyticsView() {
  const [days, setDays] = useState<number>(30);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const refreshInterval = 30000;
  const isPageVisible = usePageVisibility();
  const pollingEnabled = autoRefresh && isPageVisible;
  const serviceHealthRefetchInterval = useAdaptiveRefetchInterval({
    enabled: pollingEnabled,
    baseInterval: refreshInterval,
    maxInterval: 5 * 60 * 1000,
    backoffMultiplier: 1.5,
  });
  const systemStatusRefetchInterval = useAdaptiveRefetchInterval({
    enabled: pollingEnabled,
    baseInterval: refreshInterval,
    maxInterval: 5 * 60 * 1000,
    backoffMultiplier: 1.5,
  });

  const {
    data: serviceHealthData,
    isLoading: isServiceHealthLoading,
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
    error: systemStatusError,
    refetch: refetchSystemStatus,
  } = useQuery<SystemStatusResponse, Error>({
    queryKey: ['system-status-dashboard'],
    queryFn: fetchSystemStatus,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: systemStatusRefetchInterval,
  });

  const formatUptime = (seconds?: number): string => {
    if (seconds === undefined || seconds === null) return 'N/A';
    const dayCount = Math.floor(seconds / 86400);
    const hourCount = Math.floor((seconds % 86400) / 3600);
    const minuteCount = Math.floor((seconds % 3600) / 60);

    if (dayCount > 0) return `${dayCount}d ${hourCount}h ${minuteCount}m`;
    if (hourCount > 0) return `${hourCount}h ${minuteCount}m`;
    return `${minuteCount}m`;
  };

  const formatLastChecked = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);

      if (diffSec < 60) {
        return `${diffSec} seconds ago`;
      }
      if (diffSec < 3600) {
        const minuteCount = Math.floor(diffSec / 60);
        return `${minuteCount} minute${minuteCount !== 1 ? 's' : ''} ago`;
      }
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'operational':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700 dark:text-green-300',
          bgColor: 'bg-green-50 dark:bg-green-950/40',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: CheckCircle2,
          label: 'Operational',
        };
      case 'degraded':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/35',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: AlertTriangle,
          label: 'Degraded',
        };
      case 'down':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700 dark:text-red-300',
          bgColor: 'bg-red-50 dark:bg-red-950/40',
          borderColor: 'border-red-200 dark:border-red-900',
          icon: AlertCircle,
          label: 'Down',
        };
      case 'maintenance':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700 dark:text-blue-300',
          bgColor: 'bg-blue-50 dark:bg-blue-950/40',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: Wrench,
          label: 'Under Maintenance',
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-muted-foreground',
          bgColor: 'bg-muted/60 dark:bg-muted/40',
          borderColor: 'border-border',
          icon: AlertCircle,
          label: 'Unknown',
        };
    }
  };

  const overallConfig = systemStatusData ? getStatusConfig(systemStatusData.overall_status) : null;

  const handleRefresh = () => {
    refetchServiceHealth();
    refetchSystemStatus();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 dark:text-white text-primary" />
          <h2 className="text-2xl font-semibold dark:text-white text-primary">Service Health Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4`} />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {overallConfig && (
        <Card className={`${overallConfig.bgColor} ${overallConfig.borderColor} border-2`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <overallConfig.icon className={`h-8 w-8 ${overallConfig.textColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-base sm:text-lg text-foreground">Overall System Status:</span>
                  <Badge variant="outline" className={`${overallConfig.textColor} border-current/40`}>
                    {overallConfig.label}
                  </Badge>
                </div>
                {systemStatusData?.uptime_seconds != null && (
                  <p className="text-sm text-muted-foreground">
                    Uptime: {formatUptime(systemStatusData.uptime_seconds)}
                  </p>
                )}
                {systemStatusData?.timestamp && (
                  <p className="text-xs text-muted-foreground sm:hidden mt-1">
                    Last updated: {formatLastChecked(systemStatusData.timestamp)}
                  </p>
                )}
              </div>
              {systemStatusData?.timestamp && (
                <p className="hidden sm:block text-sm text-muted-foreground">
                  Last updated: {formatLastChecked(systemStatusData.timestamp)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isSystemStatusLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : systemStatusError ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/35">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load system status. Please try again later.</span>
            </div>
          </CardContent>
        </Card>
      ) : systemStatusData ? (
        <div className="grid gap-4 md:grid-cols-2">
          {systemStatusData.services.map((service) => {
            const config = getStatusConfig(service.status);

            return (
              <Card
                key={service.name}
                className={`${config.bgColor} ${config.borderColor} border`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${config.color}`} />
                      <Badge variant="outline" className={config.textColor}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {service.message}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {service.response_time_ms !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Response Time:</span>
                        <span className="font-medium">{service.response_time_ms} ms</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Checked:</span>
                      <span className="font-medium">{formatLastChecked(service.last_checked)}</span>
                    </div>
                    {service.details && Object.keys(service.details).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <details className="cursor-pointer">
                          <summary className="text-muted-foreground hover:text-foreground">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(service.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uptime Trend</CardTitle>
            <CardDescription>Daily availability percentage over the selected period</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {isServiceHealthLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : serviceHealthError ? (
              <div className="text-sm text-destructive">Unable to load uptime trend</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serviceHealthData?.uptime || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip {...serviceHealthChartTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="uptime_percent" name="Uptime %" stroke="#16a34a" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg Response Time</CardTitle>
            <CardDescription>Average API response time (ms)</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {isServiceHealthLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : serviceHealthError ? (
              <div className="text-sm text-destructive">Unable to load response time</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serviceHealthData?.response_time || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip {...serviceHealthChartTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="avg_response_ms" name="Avg ms" stroke="#2563eb" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={days === 7 ? 'default' : 'outline'} size="sm" onClick={() => setDays(7)}>7d</Button>
        <Button variant={days === 30 ? 'default' : 'outline'} size="sm" onClick={() => setDays(30)}>30d</Button>
        <Button variant={days === 90 ? 'default' : 'outline'} size="sm" onClick={() => setDays(90)}>90d</Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Status panel automatically refreshes{autoRefresh ? '' : ' (paused)'}.
      </div>
    </div>
  );
}
