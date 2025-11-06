/**
 * Admin Dashboard - Main Entry Point
 * 
 * Multi-tab admin interface for ICTD/IT Department and authorized personnel.
 * Provides user management, audit logs, system configuration, and report triage.
 * 
 * Security: Only accessible to users with admin roles (master_admin, validator, lgu_responder)
 * 
 * Modules: AC-01 to AC-06, UM-01 to UM-03
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Users, 
  FileText, 
  Settings, 
  Shield, 
  Activity,
  AlertCircle,
  LogOut
} from 'lucide-react';

// Import tab components (to be created in Phase 6-10)
import UserManagement from '../components/admin/UserManagement';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import SystemConfig from '../components/admin/SystemConfig';
import ReportTriage from '../components/admin/ReportTriage';
import ActivityMonitor from '../components/admin/ActivityMonitor';

const AdminDashboard: React.FC = () => {
  const { user, userProfile, loading, signOut, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin())) {
      navigate('/login');
    }
  }, [user, userProfile, loading, isAdmin, navigate]);

  // Show skeleton loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Tabs Skeleton */}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
            
            {/* Content Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Check if user is authenticated and has admin role
  if (!user || !userProfile || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have permission to access the Admin Dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                This area is restricted to authorized personnel only (ICTD, CDRRMO, LGU Staff).
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine available tabs based on role
  const isMasterAdmin = hasRole('master_admin');
  const isValidator = hasRole('validator', 'master_admin');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">GAIA Admin Dashboard</h1>
                <p className="text-sm text-gray-600">
                  {userProfile.full_name || userProfile.email} • 
                  <span className="ml-1 font-medium text-blue-600">
                    {userProfile.role.replace('_', ' ').toUpperCase()}
                  </span>
                  {userProfile.organization && ` • ${userProfile.organization}`}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning for pending_activation status */}
        {userProfile.status === 'pending_activation' && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your account is pending activation. Some features may be restricted until your account is fully activated by an ICTD administrator.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            {/* User Management - Master Admin only */}
            {isMasterAdmin && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
            )}

            {/* Audit Logs - Validator and Master Admin */}
            {isValidator && (
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Audit Logs</span>
              </TabsTrigger>
            )}

            {/* System Config - Master Admin only */}
            {isMasterAdmin && (
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            )}

            {/* Report Triage - All admin roles */}
            <TabsTrigger value="triage" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Triage</span>
            </TabsTrigger>

            {/* Activity Monitor - Validator and Master Admin */}
            {isValidator && (
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Contents */}
          {isMasterAdmin && (
            <TabsContent value="users" className="space-y-4">
              <UserManagement />
            </TabsContent>
          )}

          {isValidator && (
            <TabsContent value="audit" className="space-y-4">
              <AuditLogViewer />
            </TabsContent>
          )}

          {isMasterAdmin && (
            <TabsContent value="config" className="space-y-4">
              <SystemConfig />
            </TabsContent>
          )}

          <TabsContent value="triage" className="space-y-4">
            <ReportTriage />
          </TabsContent>

          {isValidator && (
            <TabsContent value="activity" className="space-y-4">
              <ActivityMonitor />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-600 text-center">
            GAIA Admin Dashboard • Confidential - Authorized Personnel Only
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
