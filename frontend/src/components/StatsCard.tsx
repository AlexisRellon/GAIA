/**
 * Stats Card Component
 * 
 * Displays a key metric with trend indicator and description
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  loading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  trend,
  icon,
  loading = false,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold">{value}</div>
            {(description || trend) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {trend && (
                  <span
                    className={`flex items-center font-medium ${
                      trend.isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {trend.value > 0 ? (
                      <>
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        +{trend.value}%
                      </>
                    ) : trend.value < 0 ? (
                      <>
                        <ArrowDownIcon className="h-3 w-3 mr-1" />
                        {trend.value}%
                      </>
                    ) : (
                      <>
                        <MinusIcon className="h-3 w-3 mr-1" />
                        {trend.value}%
                      </>
                    )}
                  </span>
                )}
                {description && <span>{description}</span>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
