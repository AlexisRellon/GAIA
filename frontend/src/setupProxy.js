/**
 * GAIA Frontend - Development Proxy Configuration
 * Adds security headers to development server responses
 * Fixes StackHawk security findings for local development
 */

module.exports = function (app) {
  // Apply security headers middleware
  app.use(function (req, res, next) {
    // Fix: Missing Anti-clickjacking Header (CWE-1021)
    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    // Fix: X-Content-Type-Options Header Missing (CWE-693)
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Fix: Content Security Policy (CSP) Header Not Set (CWE-693)
    // Allow same origin, Google Fonts, Leaflet CDN, and Supabase.
    // PWA-01: connect-src includes OSM tile servers so the Service Worker's
    // fetch() calls can cache tiles (SW fetch uses connect-src, not img-src).
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self' " +
          "https://*.supabase.co wss://*.supabase.co " +
          "https://api.mapbox.com " +
          "ws://localhost:* http://localhost:* " +
          "https://nominatim.openstreetmap.org " +
          "https://a.tile.openstreetmap.org " +
          "https://b.tile.openstreetmap.org " +
          "https://c.tile.openstreetmap.org " +
          "https://fonts.googleapis.com " +
          "https://fonts.gstatic.com " +
          "https://unpkg.com; " +
        "frame-ancestors 'self'; " +
        "base-uri 'self'; " +
        "form-action 'self';"
    );

    // Additional security headers
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");

    // Fix: Server Leaks Information via "X-Powered-By" (CWE-200)
    res.removeHeader("X-Powered-By");

    next();
  });
};
