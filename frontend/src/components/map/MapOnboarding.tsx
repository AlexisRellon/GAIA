import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

declare global {
  interface Window {
    gaiaStartMapTour?: () => void;
  }
}

export type Step = {
  id: string;
  selector: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  padding?: number;
};

interface MapOnboardingProps {
  steps: Step[];
  storageKey?: string;
  autoStart?: boolean;
  onClose?: () => void;
}

function getTargetRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  return el.getBoundingClientRect();
}

function computeTooltipPosition(target: DOMRect, placement: Step['placement'], padding: number): React.CSSProperties {
  const p = placement || 'auto';
  const pad = padding ?? 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const tryPositions: Array<NonNullable<Step['placement']>> =
    p === 'auto' ? ['bottom', 'right', 'top', 'left'] : [p];

  for (const pos of tryPositions) {
    if (pos === 'bottom') {
      if (target.bottom + 200 + pad < vh) {
        return { top: target.bottom + pad, left: Math.min(Math.max(target.left, 16), vw - 360), position: 'fixed' };
      }
    }
    if (pos === 'top') {
      if (target.top - 200 - pad > 0) {
        return { top: Math.max(target.top - 200 - pad, 16), left: Math.min(Math.max(target.left, 16), vw - 360), position: 'fixed' };
      }
    }
    if (pos === 'right') {
      if (target.right + 340 + pad < vw) {
        return { top: Math.max(target.top, 16), left: target.right + pad, position: 'fixed' };
      }
    }
    if (pos === 'left') {
      if (target.left - 340 - pad > 0) {
        return { top: Math.max(target.top, 16), left: Math.max(target.left - 340 - pad, 16), position: 'fixed' };
      }
    }
  }
  // Fallback
  return { top: Math.min(target.bottom + pad, vh - 220), left: Math.min(Math.max(target.left, 16), vw - 360), position: 'fixed' };
}

export const MapOnboarding: React.FC<MapOnboardingProps> = ({
  steps,
  storageKey = 'gaia.mapOnboardingCompleted',
  autoStart = false,
  onClose,
}) => {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  const currentStep = steps[index];

  const refreshRect = useCallback(() => {
    if (!currentStep) return;
    const r = getTargetRect(currentStep.selector);
    setRect(r);
  }, [currentStep]);

  useEffect(() => {
    if (!autoStart) return;
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      setActive(true);
      setIndex(0);
    }
  }, [autoStart, storageKey]);

  useEffect(() => {
    if (!active) return;
    refreshRect();
    const handle = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(refreshRect);
    };
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    const interval = setInterval(refreshRect, 400);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
      clearInterval(interval);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, refreshRect]);

  const advance = useCallback(() => {
    if (index < steps.length - 1) {
      setIndex(index + 1);
    } else {
      localStorage.setItem(storageKey, 'true');
      setActive(false);
      onClose?.();
    }
  }, [index, steps.length, storageKey, onClose]);

  const back = useCallback(() => {
    if (index > 0) setIndex(index - 1);
  }, [index]);

  const start = useCallback(() => {
    setIndex(0);
    setActive(true);
  }, []);

  window.gaiaStartMapTour = start;

  const highlightStyle: React.CSSProperties = useMemo(() => {
    if (!rect) return { display: 'none' };
    const pad = (currentStep?.padding ?? 12);
    return {
      position: 'fixed',
      top: Math.max(rect.top - pad, 8),
      left: Math.max(rect.left - pad, 8),
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: 12,
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.5), 0 0 0 2px rgba(59,130,246,0.8)',
      pointerEvents: 'none',
      transition: 'all 0.2s ease',
      zIndex: 9998,
    };
  }, [rect, currentStep]);

  if (!active || !currentStep || !rect) {
    // Provide a small floating help button to manually trigger tour
    return createPortal(
      <button
        aria-label="Start map tour"
        onClick={start}
        className="fixed bottom-20 right-4 z-[9999] rounded-full bg-blue-600 text-white px-3 py-2 shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        ?
      </button>,
      document.body
    );
  }

  const tooltipStyle = computeTooltipPosition(rect, currentStep.placement, currentStep.padding ?? 12);

  return createPortal(
    <>
      <div style={highlightStyle} />
      <div
        role="dialog"
        aria-live="polite"
        className="z-[9999] w-[320px] max-w-[90vw] rounded-lg bg-white shadow-xl border border-gray-200"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between p-3 border-b">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{currentStep.title}</h3>
          </div>
          <button
            aria-label="Close tour"
            onClick={() => {
              localStorage.setItem(storageKey, 'true');
              setActive(false);
              onClose?.();
            }}
            className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="p-3 text-sm text-gray-700">
          {currentStep.description}
        </div>
        <div className="flex items-center justify-between p-3 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            Step {index + 1} of {steps.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={back}
              disabled={index === 0}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={advance}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
            >
              {index < steps.length - 1 ? <>Next <ChevronRight className="w-4 h-4" /></> : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};


