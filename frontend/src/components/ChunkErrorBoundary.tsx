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
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: '#F0F4F8',
            fontFamily: 'inherit',
          }}
        >
          <div
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '1rem',
              padding: '2.5rem',
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 4px 24px rgba(10,42,77,0.08)',
            }}
          >
            {/* Wifi Off icon */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
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

            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0A2A4D',
                marginBottom: '0.5rem',
              }}
            >
              Page Not Available Offline
            </h2>

            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              This page requires an internet connection.
              The following pages are available offline:
            </p>

            {/* Available pages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[
                { href: '/', label: '🏠 Home' },
                { href: '/map', label: '🗺️ Hazard Map' },
                { href: '/report', label: '📋 Report a Hazard' },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  style={{
                    display: 'block',
                    padding: '0.6rem 1rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    color: '#005A9C',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {label}
                </a>
              ))}
            </div>

            <button
              onClick={this.handleRetry}
              style={{
                background: '#0A2A4D',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.6rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
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
