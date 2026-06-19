/**
 * ChunkErrorBoundary — PWA-01
 *
 * Catches webpack ChunkLoadErrors that occur when React.lazy() tries to
 * dynamically import a code-split chunk while the browser is offline.
 *
 * In a SPA, React Router handles navigation client-side without going
 * through the Service Worker. When a user navigates to a non-cached page
 * while offline, the lazy chunk fetch fails with a ChunkLoadError.
 *
 * This boundary intercepts that error and shows a friendly offline fallback
 * instead of crashing the entire app.
 *
 * Usage — wraps <React.Suspense> in App.tsx:
 *   <ChunkErrorBoundary>
 *     <React.Suspense fallback={<Skeleton />}>
 *       <Routes>...</Routes>
 *     </React.Suspense>
 *   </ChunkErrorBoundary>
 */

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  isOfflineChunkError: boolean;
}

export class ChunkErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isOfflineChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module');

    return {
      hasError: true,
      isOfflineChunkError: isChunkError && !navigator.onLine,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Only log non-offline chunk errors; offline ones are expected
    if (!this.state.isOfflineChunkError) {
      console.error('[AGAILA] Unexpected chunk error:', error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, isOfflineChunkError: false });
  };

  render() {
    const { hasError, isOfflineChunkError } = this.state;

    if (hasError && isOfflineChunkError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-[440px] w-full text-center shadow-[0_4px_24px_rgba(10,42,77,0.08)]">
            {/* Wifi Off icon */}
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-primary mb-2">
              Page Not Available Offline
            </h2>

            <p className="text-slate-500 text-[0.9rem] leading-relaxed mb-6">
              This page requires an internet connection.
              The following pages are available offline:
            </p>

            {/* Available pages */}
            <div className="flex flex-col gap-2 mb-6">
              {[
                { href: '/', label: '🏠 Home' },
                { href: '/map', label: '🗺️ Hazard Map' },
                { href: '/report', label: '📋 Report a Hazard' },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="block px-4 py-[0.6rem] bg-slate-50 border border-slate-200 rounded-lg text-secondary no-underline text-sm font-medium"
                >
                  {label}
                </a>
              ))}
            </div>

            <button
              onClick={this.handleRetry}
              className="bg-primary text-white border-none rounded-lg px-6 py-[0.6rem] text-sm font-semibold cursor-pointer font-sans"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // Non-offline errors: re-throw so existing error handling takes over
    if (hasError && !isOfflineChunkError) {
      throw new Error('ChunkErrorBoundary: non-offline error — re-throwing');
    }

    return this.props.children;
  }
}
