/**
 * AnalyticsSkeleton Component
 * 
 * Loading skeleton for AnalyticsView while data is being fetched.
 * Provides smooth loading experience with placeholder UI.
 * 
 * Features:
 * - Skeleton stat cards (4 cards)
 * - Skeleton tabs and chart area
 * - Matches AnalyticsView layout structure
 * - Professional shimmer effect from ShadCN
 * 
 * Module: GV-02 (Geospatial Visualization) + FP-01 (Filtering Panel)
 * Security: CIA Triad - Availability (maintains UI responsiveness)
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

// Static heights for chart skeleton bars (prevents re-render issues)
const CHART_BAR_HEIGHTS = [120, 180, 150, 200, 170, 140, 190, 160, 130, 175, 155, 185];

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Stat Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Chart Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          {/* Tabs Skeleton */}
          <div className="mb-4">
            <div className="flex space-x-2 border-b">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>

          {/* Time Range Filter Skeleton */}
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>

          {/* Chart Area Skeleton */}
          <div className="space-y-4">
            {/* Legend Skeleton */}
            <div className="flex gap-4 justify-center">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>

            {/* Chart Skeleton - Simulates line/bar chart */}
            <div className="h-[300px] flex items-end gap-2 px-4">
              {CHART_BAR_HEIGHTS.map((height, index) => (
                <Skeleton
                  key={index}
                  className="flex-1"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            {/* X-axis labels skeleton */}
            <div className="flex justify-between px-4">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-3 w-12" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * TableSkeleton Component
 * 
 * Generic loading skeleton for table views (UserManagement, AuditLogs)
 * 
 * Props:
 * - rows: Number of skeleton rows (default: 5)
 * - columns: Number of skeleton columns (default: 4)
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="space-y-4 p-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Search/Filter Bar Skeleton */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="border-b">
            <div className="flex gap-4 p-4">
              {[...Array(columns)].map((_, index) => (
                <Skeleton key={index} className="h-4 flex-1" />
              ))}
            </div>
          </div>

          {/* Table Rows */}
          {[...Array(rows)].map((_, rowIndex) => (
            <div key={rowIndex} className="border-b last:border-b-0">
              <div className="flex gap-4 p-4">
                {[...Array(columns)].map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-4 flex-1" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pagination Skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
};

/**
 * StatCardSkeleton Component
 * 
 * Compact skeleton for individual stat cards
 * Useful for dashboard grid layouts
 */
export const StatCardSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
};
