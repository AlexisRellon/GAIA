/**
 * RSS Feeds View - Admin Dashboard Tab
 * 
 * Tabbed interface for RSS feed management, processing logs, and statistics
 * 
 * Features:
 * - Tab navigation: Feed Manager, Processing Logs, Statistics
 * - Role-based access (master_admin, validator)
 * - Lazy loading of tab content
 * - Professional ShadCN UI design
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RSSFeedManager, RSSProcessingLogs, RSSStatistics } from './rss';

export default function RSSFeedsView() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">RSS Feed Management</h1>
        <p className="text-muted-foreground">
          Manage Philippine news RSS feeds, view processing logs, and monitor system statistics
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feeds" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="feeds">Feed Manager</TabsTrigger>
          <TabsTrigger value="logs">Processing Logs</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="feeds" className="mt-6">
          <RSSFeedManager />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <RSSProcessingLogs />
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <RSSStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
