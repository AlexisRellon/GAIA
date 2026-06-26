/**
 * Ops-console chart language — shared primitives (CD-01)
 *
 * Centralizes the "mission-control" chart aesthetic used by StatusAnalyticsView
 * and AnalyticsView: brand-grounded gradient definitions, a tabular-nums count-up
 * hook, a no-axis Sparkline, and a navy/steel SegmentedControl.
 *
 * Brand tokens (navy #0A2A4D / steel #005A9C / accent #FF7A00) drive every color
 * so light and dark themes stay consistent with index.css + tailwind.config.js.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { cn } from '../../lib/utils';

// Brand-grounded chart palette (hex so Recharts SVG fills resolve outside the CSS cascade)
export const CHART_COLORS = {
  navy: '#0A2A4D',
  steel: '#005A9C',
  steelLight: '#2f95d6',
  teal: '#0d9488',
  accent: '#FF7A00',
  amber: '#f59e0b',
  emerald: '#22c55e',
  rose: '#ef4444',
  slate: '#64748b',
} as const;

/** Status -> rail/dot color for service tiles and the status hero. */
export const STATUS_COLOR: Record<string, string> = {
  operational: CHART_COLORS.emerald,
  up: CHART_COLORS.emerald,
  degraded: CHART_COLORS.amber,
  down: CHART_COLORS.rose,
  maintenance: CHART_COLORS.steel,
  no_data: CHART_COLORS.slate,
};

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Animate a number from 0 to `target` on mount and whenever `target` changes.
 * Honors prefers-reduced-motion by snapping straight to the value.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(target);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // easeOutCubic for a settled, instrument-like landing
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (target - from) * eased;
      setDisplay(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target, durationMs]);

  return display;
}

interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

/** Tabular-nums headline number that counts up on first paint. */
export const CountUp = ({ value, decimals = 0, suffix = '', className }: CountUpProps) => {
  const animated = useCountUp(Number.isFinite(value) ? value : 0);

  return (
    <span className={cn('tabular-nums', className)}>
      {animated.toFixed(decimals)}
      {suffix}
    </span>
  );
};

interface SparklinePoint {
  value: number | null;
}

interface SparklineProps {
  data: SparklinePoint[];
  color?: string;
  gradientId: string;
  height?: number;
}

/**
 * Refined no-axis line sparkline inspired by Supabase Status page.
 *
 * Key design differences from the previous area sparkline:
 * - Pure line (no area fill) — cleaner, less visual noise in compact tiles
 * - Thinner 1.2px stroke — feels precise and instrument-grade
 * - Status-aware color: the `color` prop drives the line tint, letting the
 *   parent pass green/amber/red based on service health
 * - Subtle right-aligned min/max labels for at-a-glance scale awareness
 * - connectNulls so transient gaps don't fracture a short sparkline
 */
export const Sparkline = ({ data, color = CHART_COLORS.steelLight, gradientId, height = 36 }: SparklineProps) => {
  const finitePoints = data.filter((d) => typeof d.value === 'number' && Number.isFinite(d.value));
  if (finitePoints.length < 2) return <div style={{ height }} className="flex items-center text-[10px] text-muted-foreground/70">—</div>;

  const values = finitePoints.map((d) => d.value as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.2}
            fill={`url(#${gradientId})`}
            isAnimationActive={!prefersReducedMotion()}
            animationDuration={600}
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
      {/* Subtle min/max scale labels — only when there's meaningful range */}
      {maxVal > minVal && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col justify-between py-0.5 text-[8px] tabular-nums leading-none text-muted-foreground/50">
          <span>{maxVal >= 1000 ? `${(maxVal / 1000).toFixed(1)}s` : `${Math.round(maxVal)}`}</span>
          <span>{minVal >= 1000 ? `${(minVal / 1000).toFixed(1)}s` : `${Math.round(minVal)}`}</span>
        </div>
      )}
    </div>
  );
};


interface SegmentOption<T extends string | number> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Navy/steel segmented range control — a compact pill group used in place of the
 * row of outline buttons. Keyboard- and screen-reader-accessible (radiogroup).
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-primary/15 bg-muted/60 p-0.5 dark:border-white/10 dark:bg-white/5',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'cursor-pointer rounded-md px-3 py-1 text-xs font-semibold tracking-tight tabular-nums transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              selected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Consistent ops-console section header: navy Lato title with a thin accent rule,
 * optional icon, and right-aligned actions (range control, refresh, etc.).
 */
export const SectionHeader = ({ title, description, icon, actions }: SectionHeaderProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-lato text-lg font-bold tracking-tight text-primary dark:text-white">{title}</h3>
      </div>
      <div className="mt-1.5 h-0.5 w-10 rounded-full bg-accent" aria-hidden="true" />
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);
