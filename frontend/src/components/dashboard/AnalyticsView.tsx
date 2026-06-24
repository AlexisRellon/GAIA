/**
 * Analytics View Component (React Query Optimized)
 * 
 * Displays real-time analytics, charts, and hazard statistics.
 * Uses React Query for automatic caching and request deduplication.
 * 
 * Includes:
 * - Core KPI cards (Total, Active, Resolved, Confidence)
 * - AI/ML Quality Metrics (Confidence by Type, False Positive Rate, Source Accuracy)
 * - Performance Metrics (Processing Rate, Duplicate Rate, System Health)
 * 
 * Performance Optimizations:
 * - React.memo() on chart components to prevent unnecessary re-renders
 * - useMemo() for expensive data transformations
 * - Custom comparison functions for optimal memoization
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import { CHART_COLORS, CountUp, SectionHeader, SegmentedControl } from './chartTheme';
import {
  OptimizedTrendsChart,
  OptimizedPieChart,
  OptimizedDistributionBarChart,
  OptimizedRegionChart,
  OptimizedSourcePieChart,
  OptimizedSourceBarChart,
} from './OptimizedCharts';
import {
  useHazardStats,
  useHazardTrends,
  useRegionStats,
  useHazardDistribution,
  useSourceBreakdown,
  useRecentAlerts,
  // New AI/ML metrics hooks
  useConfidenceByType,
  useFalsePositiveRate,
  useSourceAccuracy,
  useProcessingRate,
  useDuplicateRate,
  useSystemHealth,
} from '../../hooks/useAnalytics';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  AlertCircle,
  Zap,
  Database,
  Heart,
} from 'lucide-react';
import { format } from 'date-fns';

// Color palette
const COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
};

const HAZARD_COLORS: Record<string, string> = {
  volcanic_eruption: COLORS.danger,
  earthquake: COLORS.warning,
  flood: COLORS.info,
  landslide: COLORS.purple,
  fire: COLORS.danger,
  storm_surge: COLORS.primary,
};

// Trend indicator component
interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable';
  label: string;
  positiveDirection?: 'up' | 'down';  // Which direction is "good"
}

function TrendIndicator({ trend, label, positiveDirection = 'up' }: TrendIndicatorProps) {
  const isPositive = trend === positiveDirection;
  const isNegative = trend !== 'stable' && trend !== positiveDirection;
  const color = isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-muted-foreground';
  const symbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  
  return (
    <div className={`text-xs font-medium ${color}`}>
      <span className="mr-1">{symbol}</span>
      {label}
    </div>
  );
}

// Simple progress bar component (since Progress UI component doesn't exist)
interface ProgressBarProps {
  value: number;
  color?: string;
}

function ProgressBar({ value, color = 'bg-blue-500' }: ProgressBarProps) {
  return (
    <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
      <div className={`${color} h-1`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

// Branded KPI tile — accent-colored left rail by metric type, count-up headline (ops-console language)
interface KpiTileProps {
  title: string;
  value: number;
  decimals?: number;
  suffix?: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  loading?: boolean;
  index?: number;
}

function KpiTile({ title, value, decimals = 0, suffix = '', description, icon, accent, loading = false, index = 0 }: KpiTileProps) {
  return (
    <div
      className="animate-fade-in relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index * 70, 350)}ms` }}
    >
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} aria-hidden="true" />
      <div className="space-y-1.5 p-4 pl-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {loading ? (
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <div className="font-lato text-3xl font-bold tracking-tight text-foreground">
            <CountUp value={value} decimals={decimals} suffix={suffix} />
          </div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/**
 * Render the AnalyticsView component that displays hazard KPIs, interactive charts, and recent alerts.
 *
 * Shows core KPI cards, AI/ML quality metric cards, a tabbed "Hazard Analytics" card with Trends, 
 * Distribution, Regions, and Recent Alerts, and an alert banner when a data-fetch error occurs. 
 * Uses React Query hooks to fetch all analytics data with automatic caching and request deduplication.
 *
 * @returns The AnalyticsView React element containing KPI cards, AI/ML metrics, tabbed analytics charts,
 * and a list of recent alerts (or a placeholder when none exist).
 */
export default function AnalyticsView() {
  const [trendDays, setTrendDays] = useState(30);
  const [activeTab, setActiveTab] = useState('trends');

  // React Query hooks - automatic caching and deduplication
  const { data: stats, isLoading: statsLoading, error: statsError } = useHazardStats();
  const { data: trends, isLoading: trendsLoading, error: trendsError } = useHazardTrends(trendDays);
  const { data: regionStats, isLoading: regionsLoading, error: regionsError } = useRegionStats();
  const { data: distribution, isLoading: distLoading, error: distError } = useHazardDistribution();
  const { data: sourceBreakdown, isLoading: sourceLoading, error: sourceError } = useSourceBreakdown();
  const { data: recentAlerts, isLoading: alertsLoading, error: alertsError } = useRecentAlerts(10);
  
  // New AI/ML metrics hooks
  const { data: confidenceByType, isLoading: confidenceLoading, error: confidenceError } = useConfidenceByType();
  const { data: fprMetric, isLoading: fprLoading, error: fprError } = useFalsePositiveRate();
  const { data: sourceAccuracy, isLoading: accuracyLoading, error: accuracyError } = useSourceAccuracy();
  const { data: processingRate, isLoading: processingLoading, error: processingError } = useProcessingRate();
  const { data: duplicateRate, isLoading: duplicateLoading, error: duplicateError } = useDuplicateRate();
  const { data: systemHealth, isLoading: healthLoading, error: healthError } = useSystemHealth();

  const totalHazards = stats?.total_hazards ?? 0;
  const activeHazards = stats?.active_hazards ?? 0;
  const resolvedHazards = stats?.resolved_hazards ?? 0;
  const avgConfidence = stats?.avg_confidence ?? 0;
  const activeLoadPercentage = totalHazards > 0 ? (activeHazards / totalHazards) * 100 : 0;
  const resolvedPercentage = totalHazards > 0 ? (resolvedHazards / totalHazards) * 100 : 0;
  const latestAlert = recentAlerts && recentAlerts.length > 0 ? recentAlerts[0] : null;

  // Combined loading state
  const coreLoading = statsLoading || trendsLoading || regionsLoading || distLoading || sourceLoading || alertsLoading;
  
  // Combined error state
  const coreError = statsError || trendsError || regionsError || distError || sourceError || alertsError ||
    confidenceError || fprError || accuracyError || processingError || duplicateError || healthError;
  const errorMessage = coreError instanceof Error ? coreError.message : null;
  // Memoize hazard legend for trends chart (prevents recalculation on every render)
  const hazardLegend = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    
    const hazardTypes = new Set<string>();
    trends.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== 'date') hazardTypes.add(key);
      });
    });

    return Array.from(hazardTypes).map((hazard_type) => ({
      hazard_type,
      color: HAZARD_COLORS[hazard_type] || '#6b7280',
    }));
  }, [trends]);

  // Show full skeleton on initial load (when all core data is loading)
  if (coreLoading) {
    return <AnalyticsSkeleton />;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'moderate': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getHealthStatusColor = (score: number) => {
    if (score >= 90) {
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/55 dark:text-green-300 dark:border-green-800';
    }
    if (score >= 70) {
      return 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-200 dark:border-yellow-800';
    }
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/55 dark:text-red-300 dark:border-red-800';
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-card dark:via-card dark:to-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">How things are feeling today</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This board summarizes pressure points, confidence signals, and where people may need help first.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Human-centered insights</Badge>
              <Badge variant="outline">Updated in near real-time</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core KPI Cards */}
      <div className="space-y-4">
        <SectionHeader title="System Overview" description="At-a-glance hazard volume and model confidence." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            title="Total Hazards"
            value={totalHazards}
            description="All time reports"
            icon={<Activity className="h-4 w-4" />}
            accent={CHART_COLORS.navy}
            loading={statsLoading}
            index={0}
          />
          <KpiTile
            title="Active Hazards"
            value={activeHazards}
            description="Requires attention"
            icon={<AlertTriangle className="h-4 w-4" />}
            accent={CHART_COLORS.accent}
            loading={statsLoading}
            index={1}
          />
          <KpiTile
            title="Resolved"
            value={resolvedHazards}
            description="Successfully handled"
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent={CHART_COLORS.emerald}
            loading={statsLoading}
            index={2}
          />
          <KpiTile
            title="Avg Confidence"
            value={avgConfidence * 100}
            decimals={1}
            suffix="%"
            description="AI model accuracy"
            icon={<TrendingUp className="h-4 w-4" />}
            accent={CHART_COLORS.steel}
            loading={statsLoading}
            index={3}
          />
        </div>
      </div>

      {/* AI/ML Quality Metrics */}
      <div className="space-y-4">
        <SectionHeader title="AI/ML Quality Metrics" description="Validation quality, throughput, and source reliability signals." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* False Positive Rate */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                False Positive Rate
              </CardTitle>
              <CardDescription className="text-xs">Report validation quality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {fprLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{(fprMetric?.fpr_percentage ?? 0).toFixed(1)}%</span>
                    {fprMetric && <TrendIndicator trend={fprMetric.trend} label={`${Math.abs((fprMetric.previous_period_fpr || 0) - (fprMetric.fpr_percentage || 0)).toFixed(1)}% from last week`} />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fprMetric?.rejected_count} rejected of {fprMetric?.total_verified} verified
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Processing Rate */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Processing Rate
              </CardTitle>
              <CardDescription className="text-xs">Hazards/hour detected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {processingLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{(processingRate?.hourly_average ?? 0).toFixed(1)}</span>
                    {processingRate && <TrendIndicator trend={processingRate.trend} label={`${processingRate.last_hour_count} this hour`} />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {processingRate?.last_24h_total} detected in last 24h
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Duplicate Detection Rate */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-500" />
                Duplicate Rate
              </CardTitle>
              <CardDescription className="text-xs">Data quality indicator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {duplicateLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{(duplicateRate?.duplicate_percentage ?? 0).toFixed(1)}%</span>
                    {duplicateRate && <TrendIndicator trend={duplicateRate.trend} label={`${duplicateRate.duplicate_count} duplicates`} />}
                  </div>
                  <ProgressBar value={duplicateRate?.duplicate_percentage || 0} color="bg-purple-500" />
                  <p className="text-xs text-muted-foreground">
                    Effective duplicate detection enabled
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Source Accuracy */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Source Accuracy
              </CardTitle>
              <CardDescription className="text-xs">RSS vs Citizen reliability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {accuracyLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>RSS Accuracy</span>
                      <span className="font-bold text-green-600">{(sourceAccuracy?.rss_accuracy_percentage ?? 0).toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={sourceAccuracy?.rss_accuracy_percentage || 0} color="bg-green-500" />
                    <div className="flex justify-between items-center text-sm">
                      <span>Citizen Accuracy</span>
                      <span className="font-bold text-blue-600">{(sourceAccuracy?.citizen_accuracy_percentage ?? 0).toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={sourceAccuracy?.citizen_accuracy_percentage || 0} color="bg-blue-500" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Top Confidence Hazard Type */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Best Confidence
              </CardTitle>
              <CardDescription className="text-xs">Highest model confidence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {confidenceLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ) : confidenceByType && confidenceByType.length > 0 ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{(confidenceByType[0].avg_confidence * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {confidenceByType[0].hazard_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {confidenceByType[0].count} samples
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                System Health
              </CardTitle>
              <CardDescription className="text-xs">Overall system status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ) : (
                <>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getHealthStatusColor(systemHealth?.health_score || 0)}`}>
                    {systemHealth?.health_score}/100
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Status: <span className="capitalize font-medium">{systemHealth?.status}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Error rate: {(systemHealth?.error_rate_percentage ?? 0).toFixed(2)}%
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-muted/40">
        <CardHeader>
          <CardTitle>Operational Pulse</CardTitle>
          <CardDescription>Human labels that quickly tell where support may be needed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-dashed bg-muted/20">
              <CardContent className="pt-4 space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Urgency Load</div>
                <div className="text-2xl font-semibold">{activeLoadPercentage.toFixed(1)}%</div>
                <ProgressBar value={activeLoadPercentage} color="bg-orange-500" />
              </CardContent>
            </Card>
            <Card className="border-dashed bg-muted/20">
              <CardContent className="pt-4 space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Resolution Momentum</div>
                <div className="text-2xl font-semibold">{resolvedPercentage.toFixed(1)}%</div>
                <ProgressBar value={resolvedPercentage} color="bg-emerald-500" />
              </CardContent>
            </Card>
            <Card className="border-dashed bg-muted/20">
              <CardContent className="pt-4 space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Model Trust</div>
                <div className="text-2xl font-semibold">{(avgConfidence * 100).toFixed(1)}%</div>
                <ProgressBar value={avgConfidence * 100} color="bg-blue-500" />
              </CardContent>
            </Card>
            <Card className="border-dashed bg-muted/20">
              <CardContent className="pt-4 space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Latest Field Signal</div>
                <div className="text-sm font-semibold capitalize">{latestAlert?.hazard_type?.replace(/_/g, ' ') || 'No active signal'}</div>
                <div className="text-xs text-muted-foreground">
                  {latestAlert ? `${latestAlert.location_name} • ${(latestAlert.confidence_score * 100).toFixed(1)}% confidence` : 'Waiting for new reports'}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hazard Analytics</CardTitle>
          <CardDescription>Comprehensive view of environmental hazards</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full !h-auto flex gap-1 overflow-x-auto whitespace-nowrap pb-1">
              <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Trends
              </TabsTrigger>
              <TabsTrigger value="distribution" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Distribution
              </TabsTrigger>
              <TabsTrigger value="regions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Regions
              </TabsTrigger>
              <TabsTrigger value="sources" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Sources
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Recent Alerts
              </TabsTrigger>
            </TabsList>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Detection trend</span>
                <SegmentedControl
                  options={[
                    { label: '7d', value: 7 },
                    { label: '30d', value: 30 },
                    { label: '90d', value: 90 },
                  ]}
                  value={trendDays}
                  onChange={setTrendDays}
                  ariaLabel="Select time range for hazard trends"
                />
              </div>

              <OptimizedTrendsChart data={trends || []} hazardTypes={hazardLegend} />
            </TabsContent>

            {/* Distribution Tab */}
            <TabsContent value="distribution" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <OptimizedPieChart data={distribution || []} />
                <OptimizedDistributionBarChart data={distribution || []} />
              </div>
            </TabsContent>

            {/* Regions Tab */}
            <TabsContent value="regions">
              <OptimizedRegionChart data={regionStats || []} />
            </TabsContent>

            {/* Source Breakdown Tab */}
            <TabsContent value="sources" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <OptimizedSourcePieChart data={sourceBreakdown || []} />
                <OptimizedSourceBarChart data={sourceBreakdown || []} />
              </div>
            </TabsContent>

            {/* Recent Alerts Tab */}
            <TabsContent value="recent" className="space-y-3">
              {!recentAlerts || recentAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent alerts</p>
              ) : (
                recentAlerts.map((alert) => (
                  <Card key={alert.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant={getSeverityColor(alert.severity) as "default" | "destructive" | "secondary" | "outline"}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline">{alert.hazard_type}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{alert.location_name}</span>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{format(new Date(alert.detected_at), 'MMM d, yyyy HH:mm')}</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xs text-muted-foreground">Confidence</div>
                          <div className="text-sm font-medium">{(alert.confidence_score * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
