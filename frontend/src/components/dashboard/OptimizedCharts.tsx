/**
 * Optimized Chart Components
 * 
 * Memoized Recharts components to prevent unnecessary re-renders.
 * Uses React.memo() with custom comparison functions for optimal performance.
 * 
 * Module: P1 - Chart Optimization
 * Security: CIA Triad - Availability (optimized rendering performance)
 * 
 * Performance Benefits:
 * - Prevents chart re-renders when parent component updates
 * - Only re-renders when chart data or configuration changes
 * - Reduces CPU usage and improves dashboard responsiveness
 */

import React, { memo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Color palette
const HAZARD_COLORS: Record<string, string> = {
  volcanic_eruption: '#ef4444',
  earthquake: '#f59e0b',
  flood: '#06b6d4',
  landslide: '#a855f7',
  fire: '#ef4444',
  storm_surge: '#3b82f6',
};

// Type definitions
interface TrendData {
  date: string;
  [key: string]: string | number;
}

interface HazardTrendAPI {
  date: string;
  volcanic_eruption: number;
  earthquake: number;
  flood: number;
  landslide: number;
  fire: number;
  storm_surge: number;
  total: number;
}

interface DistributionData {
  hazard_type: string;
  count: number;
}

/**
 * Pie chart label entry with additional recharts properties
 * This interface extends the data structure with the percent field
 * that recharts adds during label rendering
 */
interface PieChartLabelEntry extends DistributionData {
  percent: number;
}

/**
 * Type guard to validate that an entry has the expected pie chart label properties
 */
function isPieChartLabelEntry(entry: unknown): entry is PieChartLabelEntry {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'hazard_type' in entry &&
    'percent' in entry &&
    typeof (entry as PieChartLabelEntry).hazard_type === 'string' &&
    typeof (entry as PieChartLabelEntry).percent === 'number'
  );
}

interface RegionData {
  region: string;
  count: number;
}

interface RegionStatsAPI {
  region: string;
  total_count: number;
  active_count: number;
  resolved_count: number;
}

interface HazardLegendItem {
  hazard_type: string;
  color: string;
}

// ============================================================================
// OPTIMIZED AREA CHART (Trends)
// ============================================================================

interface OptimizedTrendsChartProps {
  data: HazardTrendAPI[];
  hazardTypes: HazardLegendItem[];
}

export const OptimizedTrendsChart = memo<OptimizedTrendsChartProps>(
  ({ data, hazardTypes }) => {
    // Transform HazardTrendAPI to TrendData with index signature
    const chartData: TrendData[] = data.map((trend) => ({
      ...trend,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          {hazardTypes.map((item) => (
            <Area
              key={item.hazard_type}
              type="monotone"
              dataKey={item.hazard_type}
              stackId="1"
              stroke={item.color}
              fill={item.color}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if data or hazardTypes change
    return (
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      JSON.stringify(prevProps.hazardTypes) === JSON.stringify(nextProps.hazardTypes)
    );
  }
);

OptimizedTrendsChart.displayName = 'OptimizedTrendsChart';

// ============================================================================
// OPTIMIZED PIE CHART (Distribution)
// ============================================================================

interface OptimizedPieChartProps {
  data: DistributionData[];
}

export const OptimizedPieChart = memo<OptimizedPieChartProps>(
  ({ data }) => {
    // Transform data to include index signature
    const chartData = data.map((item) => ({ ...item }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => {
              if (!isPieChartLabelEntry(entry)) {
                return '';
              }
              return `${entry.hazard_type}: ${(entry.percent * 100).toFixed(0)}%`;
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={HAZARD_COLORS[entry.hazard_type] || '#6b7280'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if data changes
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  }
);

OptimizedPieChart.displayName = 'OptimizedPieChart';

// ============================================================================
// OPTIMIZED BAR CHART (Distribution - Alternative View)
// ============================================================================

interface OptimizedDistributionBarChartProps {
  data: DistributionData[];
}

export const OptimizedDistributionBarChart = memo<OptimizedDistributionBarChartProps>(
  ({ data }) => {
    // Transform data to include index signature
    const chartData = data.map((item) => ({ ...item }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="hazard_type"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    );
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  }
);

OptimizedDistributionBarChart.displayName = 'OptimizedDistributionBarChart';

// ============================================================================
// OPTIMIZED REGION BAR CHART (Horizontal)
// ============================================================================

interface OptimizedRegionChartProps {
  data: RegionStatsAPI[];
}

export const OptimizedRegionChart = memo<OptimizedRegionChartProps>(
  ({ data }) => {
    // Transform RegionStatsAPI to RegionData for the chart
    const chartData: RegionData[] = data.map((stat) => ({
      region: stat.region,
      count: stat.total_count,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            dataKey="region"
            type="category"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="count" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    );
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  }
);

OptimizedRegionChart.displayName = 'OptimizedRegionChart';
