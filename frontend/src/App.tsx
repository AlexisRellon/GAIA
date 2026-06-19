import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import './App.css';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SkipLink } from './components/SkipLink';
import { queryClient } from './lib/queryClient';
import { storageCache } from './lib/storageCache';
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications';
import { useDocumentTitle } from './hooks/useDocumentTitle';
// PWA-01: Global offline status toast notifications
import { OfflineToast } from './components/OfflineToast';
// PWA-01: Catches ChunkLoadErrors from React.lazy() when offline
import { ChunkErrorBoundary } from './components/ChunkErrorBoundary';
import LandingPage from './pages/LandingPage';
import DashboardShellSkeleton from './components/dashboard/DashboardShellSkeleton';

// Route-based code splitting — all non-landing pages are lazy-loaded to
// reduce the initial bundle and fix the Lighthouse "Unused JavaScript" warning.
const Login            = React.lazy(() => import('./pages/Login'));
const ResetPassword    = React.lazy(() => import('./pages/ResetPassword'));
const UpdatePassword   = React.lazy(() => import('./pages/UpdatePassword'));
const UnifiedDashboard = React.lazy(() => import('./pages/UnifiedDashboard'));
const PublicMap        = React.lazy(() => import('./pages/PublicMap'));
const CitizenReportForm  = React.lazy(() => import('./pages/CitizenReportForm'));
const ReportConfirmation = React.lazy(() => import('./pages/ReportConfirmation'));
const ReportTracking   = React.lazy(() => import('./pages/ReportTracking'));
const StatusPage       = React.lazy(() => import('./pages/StatusPage'));
const HazardInfoPage   = React.lazy(() => import('./pages/HazardInfoPage'));
const PrivacyPolicy    = React.lazy(() => import('./pages/PrivacyPolicy'));

/**
 * Component that applies document title based on route
 */
const DocumentTitleManager = () => {   
  useDocumentTitle();
  return null;
};

/**
 * Main App component with realtime notifications
 * Manages routing, authentication, and real-time subscriptions
 */
const AppContent = () => {
  // Enable realtime notifications for all users
  useRealtimeNotifications();

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <DocumentTitleManager />
      <SkipLink />
      {/* PWA-01: Global offline status toasts — driven via sonner Toaster */}
      <OfflineToast />
      <main id="main-content" className="min-h-screen bg-background">
        {/*
          PWA-01: ChunkErrorBoundary wraps Suspense to catch ChunkLoadErrors.
          React Router navigates client-side without going through the SW,
          so lazy chunk fetches can fail while offline. The boundary intercepts
          these and shows "Page Not Available Offline" instead of crashing.
        */}
        <ChunkErrorBoundary>
          <React.Suspense fallback={<DashboardShellSkeleton />}>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/map" element={<PublicMap />} />
            <Route path="/report" element={<CitizenReportForm />} />
            <Route path="/report/confirmation/:trackingId" element={<ReportConfirmation />} />
            <Route path="/track" element={<ReportTracking />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/hazard-info" element={<HazardInfoPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <UnifiedDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <UnifiedDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={
              <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight">404 - Page Not Found</h1>
                  <p className="text-lg text-muted-foreground">
                    The page you&apos;re looking for doesn&apos;t exist yet.
                  </p>
                  <Link to="/" className="text-primary hover:underline">
                    Return to Home
                  </Link>
                </div>
              </div>
            } />
            </Routes>
          </React.Suspense>
        </ChunkErrorBoundary>
        <Toaster />
        </main>
      </Router>
  );
};

const App = () => {
  useEffect(() => {
    try {
      storageCache.clearExpired();
    } catch(error) {
      console.warn('Failed to clear expired cache entries:', error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
      {/* React Query DevTools - only visible in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;