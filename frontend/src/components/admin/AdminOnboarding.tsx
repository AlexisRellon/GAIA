import React, { useEffect, useMemo, useState } from 'react';
import { MapOnboarding } from '../map/MapOnboarding';
import type { Step } from '../map/MapOnboarding';

declare global {
  interface Window {
    gaiaStartAdminTour?: () => void;
    gaiaStartMapTour?: () => void;
  }
}

// Define a global starter early so console calls don't fail before mount
if (typeof window !== 'undefined' && typeof window.gaiaStartAdminTour !== 'function') {
  window.gaiaStartAdminTour = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('gaia.adminOnboardingCompleted');
    }
    const tryStart = () => window.gaiaStartMapTour?.();
    // Multiple retries to cover initial mount timing
    setTimeout(tryStart, 0);
    setTimeout(tryStart, 100);
    setTimeout(tryStart, 300);
  };
}

const AdminOnboarding: React.FC = () => {
  const steps: Step[] = useMemo(() => [
    {
      id: 'overview',
      selector: '[data-tour="admin-header"]',
      title: 'Dashboard Overview',
      description:
        'Welcome to the GAIA Admin Dashboard. Here you can monitor live status, view your role and organization, and access all administrative tools.',
      placement: 'bottom',
      padding: 12,
    },
    {
      id: 'analytics',
      selector: '[data-tour="tab-activity"], [data-tour="nav-analytics"]',
      title: 'Analytics & Insights',
      description:
        'Track system activity and performance trends. Use this area to interpret graphs and key metrics over time.',
      placement: 'bottom',
      padding: 8,
    },
    {
      id: 'live-map',
      selector: '[data-tour="nav-map"]',
      title: 'Live Map',
      description:
        'Open the live situational map to visualize real-time incidents, sensor feeds, and geographic overlays for rapid assessment.',
      placement: 'bottom',
      padding: 8,
    },
    {
      id: 'users',
      selector: '[data-tour="tab-users"], [data-tour="nav-users"]',
      title: 'User Management',
      description:
        'Manage users: add accounts, edit details, and assign roles (e.g., master_admin, validator, lgu_responder).',
      placement: 'bottom',
      padding: 8,
    },
    {
        id: 'triage',
        selector: '[data-tour="tab-triage"], [data-tour="nav-triage"]',
        title: 'Incident Management',
        description:
          'Review submitted reports, validate authenticity, and coordinate response. Use filters to narrow by hazard, time, and status.',
        placement: 'bottom',
        padding: 8,
    },
    {
      id: 'rss',
      selector: '[data-tour="nav-rss"]',
      title: 'RSS Feeds',
      description:
        'Monitor authoritative RSS sources and ingest verified advisories directly into GAIA for situational awareness.',
      placement: 'bottom',
      padding: 8,
    },
    {
      id: 'audit',
      selector: '[data-tour="tab-audit"], [data-tour="nav-audit"]',
      title: 'Logs & Audit Trail',
      description:
        'View user activity, data changes, and system events. Useful for compliance and investigations.',
      placement: 'bottom',
      padding: 8,
    },
    {
      id: 'settings',
      selector: '[data-tour="tab-config"], [data-tour="nav-config"]',
      title: 'System Settings',
      description:
        'Manage configurations such as data sources, API keys, RLS/permissions, and alert thresholds.',
      placement: 'bottom',
      padding: 8,
    },
    {
      id: 'activity-monitor',
      selector: '[data-tour="tab-activity"], [data-tour="nav-activity"]',
      title: 'Activity Monitoring',
      description:
        'Monitor live system activity, processing queues, and recent events to quickly detect anomalies and performance issues.',
      placement: 'bottom',
      padding: 8,
    },
  ], []);

  const [effectiveSteps, setEffectiveSteps] = useState<Step[]>([]);

  // Filter steps to those present in the DOM to avoid null targets on auto start
  const filterSteps = useMemo(() => {
    return () => steps.filter(s => !!document.querySelector(s.selector));
  }, [steps]);

  useEffect(() => {
    // Run after paint to ensure layout is ready
    const t = setTimeout(() => setEffectiveSteps(filterSteps()), 0);
    // Re-evaluate on resize as responsive layouts may hide/show elements
    const onResize = () => setEffectiveSteps(filterSteps());
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [filterSteps]);

  useEffect(() => {
    // Provide a semantic alias for admin; clear completion before starting
    window.gaiaStartAdminTour = () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('gaia.adminOnboardingCompleted');
      }
      const starter = window.gaiaStartMapTour;
      if (typeof starter === 'function') {
        starter();
      } else {
        // Retry shortly in case MapOnboarding hasn't attached yet
        setTimeout(() => window.gaiaStartMapTour?.(), 50);
      }
    };
  }, []);

  const finalSteps = effectiveSteps.length > 0
    ? effectiveSteps
    : [{
        id: 'overview-fallback',
        selector: '[data-tour="admin-header"]',
        title: 'Dashboard Overview',
        description:
          'Welcome to the GAIA Admin Dashboard. Use the tabs below to manage users, triage incidents, review audits, and adjust system settings.',
        placement: 'bottom',
        padding: 12,
      } as Step];

  return <MapOnboarding steps={finalSteps} storageKey="gaia.adminOnboardingCompleted" autoStart />;
};

export default AdminOnboarding;


