/**
 * Damage Report Sidebar Component
 *
 * Right-hand slide-in panel for displaying UNDP-structured citizen
 * damage reports on the live map. Designed for emergency responders
 * to rapidly triage incoming field reports.
 *
 * Sections:
 * 1. Severity header badge + timestamp
 * 2. Full-width assessment photo
 * 3. Infrastructure details card (UNDP category + name + user text)
 * 4. Crisis metadata badge/tag system
 * 5. Debris status warning banner
 * 6. Anonymous reporter attribution
 * 7. Actions footer (zoom, view source)
 *
 * Accessibility: Focus trap, Esc to close, ARIA labels, keyboard nav.
 * Mirrors patterns from HazardInfoPanel.tsx.
 *
 * Module: GV-02 (Dynamic Markers), CR-01 (Citizen Report)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, MapPin, Clock, User, AlertTriangle, CheckCircle2, HelpCircle,
  XOctagon, AlertOctagon, MinusCircle, Maximize2,
  // Infrastructure icons
  Home, Building2, Landmark, Zap, Route, School, Trees, ClipboardList,
  // Supplementary crisis icons (tech/human-made only)
  Factory, Bomb, FlaskConical, ShieldAlert, Swords, Megaphone,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import {
  INFRASTRUCTURE_TYPE_CONFIG,
  CRISIS_CATEGORIES,
  DEBRIS_DISPLAY,
  DAMAGE_SEVERITY_CONFIG,
  ELECTRICITY_INFRASTRUCTURE_OPTIONS,
  HEALTH_SERVICES_OPTIONS,
  PRESSING_NEEDS_OPTIONS,
  type InfrastructureType,
  type CrisisSelections,
  type DebrisStatus,
  type DamageSeverity,
  type CrisisCategoryKey,
  type CommunityAssessment,
} from '../../types/undpTypes';

// ============================================================================
// ICON MAP — reused from form, kept local for sidebar independence
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  'home': Home, 'building-2': Building2, 'landmark': Landmark, 'zap': Zap,
  'route': Route, 'school': School, 'trees': Trees, 'clipboard-list': ClipboardList,
  'factory': Factory, 'bomb': Bomb, 'flask-conical': FlaskConical,
  'shield-alert': ShieldAlert, 'swords': Swords, 'megaphone': Megaphone,
  'alert-triangle': AlertTriangle, 'check-circle-2': CheckCircle2, 'help-circle': HelpCircle,
  'x-octagon': XOctagon, 'alert-octagon': AlertOctagon, 'minus-circle': MinusCircle,
};

const Icon: React.FC<{ name: string; size?: number; className?: string; style?: React.CSSProperties }> = ({
  name, size = 16, className, style,
}) => {
  const Comp = ICON_MAP[name] || AlertTriangle;
  return <Comp size={size} className={className} style={style} aria-hidden="true" />;
};

// ============================================================================
// TYPES
// ============================================================================

export interface DamageReportSidebarProps {
  report: {
    id: string;
    hazard_type: string;
    severity: string;
    location_name: string;
    latitude: number;
    longitude: number;
    confidence_score: number;
    source_type: string;
    validated: boolean;
    created_at: string;
    source_content?: string;
    source_url?: string;
    image_urls?: string[];
    // UNDP fields
    infrastructure_types?: InfrastructureType[];
    infrastructure_other_text?: string;
    infrastructure_details?: string;
    crisis_categories?: CrisisSelections;
    debris_status?: DebrisStatus;
    damage_severity?: DamageSeverity;
    community_assessment?: CommunityAssessment;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onZoomTo?: (lat: number, lon: number) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DamageReportSidebar({
  report,
  isOpen,
  onClose,
  onZoomTo,
}: DamageReportSidebarProps) {
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);

  // ------ close with animation ------
  const handleClose = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => () => {
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; }
  }, []);

  // ------ Escape key ------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen && !isClosing) handleClose(); };
    if (isOpen) { document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler); }
  }, [isOpen, isClosing, handleClose]);

  // ------ focus management ------
  useEffect(() => {
    if (isOpen && document.activeElement instanceof HTMLElement) previousFocusRef.current = document.activeElement;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const els = panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = els[0]; const last = els[els.length - 1];
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    const el = panelRef.current;
    el?.addEventListener('keydown', trap);
    return () => { el?.removeEventListener('keydown', trap); previousFocusRef.current?.focus(); };
  }, [isOpen]);

  // ------ derived data ------
  const severityCfg = report?.damage_severity
    ? DAMAGE_SEVERITY_CONFIG[report.damage_severity]
    : report?.severity
      ? DAMAGE_SEVERITY_CONFIG[report.severity as DamageSeverity] ?? null
      : null;

  const formattedTime = report
    ? new Date(report.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const imageUrl = report?.image_urls?.[0];

  const debrisCfg = report?.debris_status ? DEBRIS_DISPLAY[report.debris_status] : null;

  // flatten selected crisis options for badge rendering
  const crisisBadges: { label: string; iconName: string; color: string }[] = [];
  if (report?.crisis_categories) {
    for (const [catKey, catCfg] of Object.entries(CRISIS_CATEGORIES) as [CrisisCategoryKey, typeof CRISIS_CATEGORIES[CrisisCategoryKey]][]) {
      const selected = report.crisis_categories[catKey] || [];
      for (const opt of catCfg.options) {
        if (selected.includes(opt.value)) {
          crisisBadges.push({ label: opt.label, iconName: opt.iconName, color: catCfg.color });
        }
      }
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <style>{`
        .dmg-panel { transition: opacity 0.3s ease; will-change: opacity; }
        .dmg-panel-visible { opacity: 1; pointer-events: auto; }
        .dmg-panel-hidden { opacity: 0; pointer-events: none; }
        .dmg-backdrop { transition: opacity 0.3s ease; will-change: opacity; }
        .dmg-backdrop-visible { opacity: 1; visibility: visible; pointer-events: auto; }
        .dmg-backdrop-hidden { opacity: 0; visibility: hidden; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .dmg-panel, .dmg-backdrop { transition: none; } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={isOpen && !isClosing ? handleClose : undefined}
        className={cn(
          'absolute inset-0 z-[1999] cursor-pointer dmg-backdrop',
          isOpen && !isClosing ? 'dmg-backdrop-visible bg-black/30' : 'dmg-backdrop-hidden bg-transparent',
        )}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className={cn(
          'absolute inset-y-0 right-0 z-[2000] flex w-full flex-col shadow-2xl dmg-panel sm:w-[420px]',
          'border-l border-border bg-card text-card-foreground',
          isOpen && !isClosing ? 'dmg-panel-visible' : 'dmg-panel-hidden',
        )}
        role="complementary"
        aria-label="Damage report details"
        aria-hidden={!isOpen || isClosing}
      >
        {/* ---- Header ---- */}
        <div className="flex-shrink-0 border-b border-border p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Severity badge */}
            <div className="flex-1 min-w-0">
              {severityCfg ? (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: severityCfg.bgColor, color: severityCfg.color }}
                >
                  <Icon name={severityCfg.iconName} size={14} style={{ color: severityCfg.color }} />
                  {severityCfg.label}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                  Damage Report
                </span>
              )}
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Clock size={12} aria-hidden />
                <time>{formattedTime}</time>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ---- Scrollable Content ---- */}
        <div className="flex-1 overflow-y-auto">
          {report ? (
            <>
              {/* Primary Media Placeholder / Image */}
              <div className="relative w-full bg-muted/30">
                {imageUrl ? (
                  <div className="relative group">
                    <img
                      src={imageUrl}
                      alt="Damage assessment photograph"
                      className="w-full h-56 object-cover cursor-pointer"
                      onClick={() => setImageExpanded(true)}
                    />
                    <button
                      onClick={() => setImageExpanded(true)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      aria-label="View full image"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-32 flex flex-col items-center justify-center border-b border-border bg-muted/20 text-muted-foreground">
                    <AlertTriangle className="mb-2 opacity-50" size={24} aria-hidden="true" />
                    <p className="text-sm font-medium">No Image Provided</p>
                    <p className="text-xs opacity-70">Submitted without a photo</p>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-5">
                {/* Location name */}
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 text-muted-foreground shrink-0" aria-hidden />
                  <p className="text-sm font-medium text-foreground leading-snug">{report.location_name}</p>
                </div>

                {/* ---- Coordinates ---- */}
                <Card className="border-border bg-muted/30 dark:bg-muted/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Coordinates</p>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-muted-foreground shrink-0" aria-hidden />
                    <div className="font-mono text-sm text-foreground leading-relaxed">
                      <p>{report.latitude.toFixed(6)}° N</p>
                      <p>{report.longitude.toFixed(6)}° E</p>
                    </div>
                  </div>
                </Card>

                {/* ---- Debris Assessment ---- */}
                {debrisCfg && (
                  <Card className="border-border bg-muted/30 dark:bg-muted/15 p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Debris Assessment</p>
                    {report.debris_status === 'yes' ? (
                      <div
                        className="flex items-center gap-2.5 p-3 rounded-lg border"
                        style={{ backgroundColor: debrisCfg.badgeBg, borderColor: `${debrisCfg.badgeColor}33` }}
                      >
                        <Icon name={debrisCfg.iconName} size={20} style={{ color: debrisCfg.badgeColor }} />
                        <div>
                          <p className="text-sm font-bold" style={{ color: debrisCfg.badgeColor }}>{debrisCfg.label}</p>
                          <p className="text-xs text-muted-foreground">Clearing operations may be needed before entry.</p>
                        </div>
                      </div>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: debrisCfg.badgeBg, color: debrisCfg.badgeColor }}
                      >
                        <Icon name={debrisCfg.iconName} size={12} style={{ color: debrisCfg.badgeColor }} />
                        {debrisCfg.label}
                      </span>
                    )}
                  </Card>
                )}

                {/* ---- Infrastructure Details ---- */}
                {(report.infrastructure_types?.length || report.infrastructure_details) && (
                  <Card className="border-border bg-muted/30 dark:bg-muted/15 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Infrastructure Affected</p>

                    {/* Category badges — infrastructure type */}
                    {report.infrastructure_types && report.infrastructure_types.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Type</p>
                        <div className="flex flex-wrap gap-1.5">
                        {report.infrastructure_types.map((type) => {
                          const cfg = INFRASTRUCTURE_TYPE_CONFIG[type];
                          if (!cfg) return null;
                          return (
                            <span
                              key={type}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                              style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                            >
                              <Icon name={cfg.iconName} size={12} style={{ color: cfg.color }} />
                              {cfg.label}
                            </span>
                          );
                        })}
                        </div>
                      </div>
                    )}

                    {/* Other text */}
                    {report.infrastructure_other_text && (
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Other:</span> {report.infrastructure_other_text}
                      </p>
                    )}

                    {/* Details text */}
                    {report.infrastructure_details && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Details</p>
                        <p className="text-sm text-foreground/90 leading-relaxed">{report.infrastructure_details}</p>
                      </div>
                    )}
                  </Card>
                )}

                {/* ---- Additional Crisis Factors Tags ---- */}
                {crisisBadges.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Additional Crisis Factors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {crisisBadges.map((badge) => (
                        <span
                          key={badge.label}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{ borderColor: `${badge.color}33`, color: badge.color, backgroundColor: `${badge.color}14` }}
                        >
                          <Icon name={badge.iconName} size={12} style={{ color: badge.color }} />
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Description ---- */}
                {report.source_content && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                    <p className="text-sm leading-relaxed text-foreground/90">{report.source_content}</p>
                  </div>
                )}

                {/* ---- Community Assessment ---- */}
                {report.community_assessment && (
                  <Card className="border-border bg-muted/30 dark:bg-muted/15 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Community Assessment</p>
                    
                    {report.community_assessment.electricityInfrastructure && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Electricity</p>
                        <p className="text-sm text-foreground">
                          {ELECTRICITY_INFRASTRUCTURE_OPTIONS.find(o => o.value === report.community_assessment?.electricityInfrastructure)?.label || report.community_assessment.electricityInfrastructure}
                        </p>
                      </div>
                    )}
                    
                    {report.community_assessment.healthServicesRating && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Health Services</p>
                        <p className="text-sm text-foreground">
                          {HEALTH_SERVICES_OPTIONS.find(o => o.value === report.community_assessment?.healthServicesRating)?.label || report.community_assessment.healthServicesRating}
                        </p>
                      </div>
                    )}
                    
                    {report.community_assessment.pressingNeeds && report.community_assessment.pressingNeeds.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pressing Needs</p>
                        <ul className="list-disc pl-4 mt-1 text-sm text-foreground space-y-1">
                          {report.community_assessment.pressingNeeds.map(need => (
                            <li key={need}>
                              {need === 'other' 
                                ? `Other: ${report.community_assessment?.pressingNeedsOther}` 
                                : (PRESSING_NEEDS_OPTIONS.find(o => o.value === need)?.label || need)
                              }
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                )}

                {/* ---- Quick Stats Row ---- */}
                <div className="grid grid-cols-2 gap-2">
                  <Card className="border-border bg-muted/40 dark:bg-muted/25 p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{Math.round(report.confidence_score * 100)}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Confidence</p>
                  </Card>
                  <Card className="border-border bg-muted/40 dark:bg-muted/25 p-3 text-center">
                    <p className="text-xs font-bold uppercase text-foreground">{report.validated ? 'Verified' : 'Pending'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Status</p>
                  </Card>
                </div>

                {/* ---- Reporter Attribution ---- */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <User size={14} aria-hidden />
                  <span>Reported by: <span className="font-medium text-foreground">Anonymous Citizen Reporter</span></span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground p-6">
              <p>No report selected</p>
            </div>
          )}
        </div>

        {/* ---- Actions Footer ---- */}
        <div className="flex-shrink-0 space-y-2 border-t border-border bg-muted/50 dark:bg-muted/30 p-4">
          <Button
            onClick={() => report && onZoomTo?.(report.latitude, report.longitude)}
            disabled={!report}
            className="w-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm hover:from-primary/90 hover:to-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
            size="sm"
            title="Zoom to the pin location"
          >
            <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
            Zoom to Location
          </Button>
        </div>
      </aside>

      {/* ---- Image Lightbox ---- */}
      {imageExpanded && imageUrl && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={() => setImageExpanded(false)}
          role="dialog"
          aria-label="Full-size damage assessment photo"
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            onClick={() => setImageExpanded(false)}
            aria-label="Close full-size image"
          >
            <X size={20} />
          </button>
          <img
            src={imageUrl}
            alt="Full-size damage assessment photograph"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
