/**
 * Activity Monitor Component (AC-05)
 * 
 * Features:
 * - Active user sessions widget
 * - Recent admin actions timeline
 * - System statistics cards (total users, active sessions, pending reports, recent logins)
 * - Real-time activity feed
 * 
 * Module: AC-05 (Activity Monitoring)
 * Permissions: Master Admin, Validator (read-only)
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Activity, Users, Shield, AlertCircle, Clock, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { adminApi } from '../../lib/api';

interface StatCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  trend?: string;
}

interface RecentAction {
  id: string;
  user_email: string;
  action: string;
  action_description: string;
  created_at: string;
  success: boolean;
}

const ActivityMonitor: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    pendingReports: 0,
    recentLogins: 0,
  });
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch activity data
  const fetchActivityData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch recent audit logs for activity feed
      const auditLogs = await adminApi.auditLogs.list({
        limit: 10,
        offset: 0,
      });

      setRecentActions(auditLogs);

      // TODO: Fetch actual statistics when backend endpoints are ready
      // For now, using mock data
      setStats({
        totalUsers: 42,
        activeSessions: 8,
        pendingReports: 15,
        recentLogins: 5,
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch activity data');
      console.error('Error fetching activity data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivityData, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statCards: StatCard[] = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <Users className="h-5 w-5 text-blue-600" />,
      description: 'Registered accounts',
      trend: '+3 this week',
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      icon: <Activity className="h-5 w-5 text-green-600" />,
      description: 'Currently logged in',
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports,
      icon: <Shield className="h-5 w-5 text-yellow-600" />,
      description: 'Awaiting triage',
      trend: '-2 from yesterday',
    },
    {
      title: 'Recent Logins',
      value: stats.recentLogins,
      icon: <Clock className="h-5 w-5 text-purple-600" />,
      description: 'Last 24 hours',
    },
  ];

  const getActionBadgeColor = (action: string) => {
    if (action.includes('created') || action.includes('login')) return 'default';
    if (action.includes('updated') || action.includes('changed')) return 'secondary';
    if (action.includes('deleted') || action.includes('deactivated')) return 'destructive';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              {stat.trend && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">{stat.trend}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest administrative actions and system events (auto-refreshes every 30s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && recentActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading activity feed...
            </div>
          ) : recentActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity found
            </div>
          ) : (
            <div className="space-y-4">
              {recentActions.map((action) => (
                <div key={action.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex-shrink-0 mt-1">
                    {action.success ? (
                      <div className="h-2 w-2 rounded-full bg-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{action.user_email || 'System'}</span>
                      <Badge variant={getActionBadgeColor(action.action)} className="text-xs">
                        {action.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(action.created_at), 'MMM dd, HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.action_description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Currently logged-in users and their session details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-500 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Active session monitoring coming soon. This will display real-time user sessions, IP addresses, and session duration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityMonitor;
