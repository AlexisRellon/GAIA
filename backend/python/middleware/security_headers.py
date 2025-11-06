"""
Security Headers Middleware for GAIA API
Implements security headers following OWASP recommendations.

Security Recommendation: SECURITY_AUDIT.md #5 (Medium Priority)
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable
import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to all HTTP responses.
    
    Headers added:
    - X-Content-Type-Options: Prevent MIME-type confusion
    - X-Frame-Options: Prevent clickjacking
    - X-XSS-Protection: Enable XSS filtering (legacy browsers)
    - Strict-Transport-Security: Enforce HTTPS
    - Content-Security-Policy: Restrict resource loading
    - Referrer-Policy: Control referrer information
    """
    
    def __init__(
        self,
        app,
        hsts_seconds: int = 31536000,  # 1 year
        csp_policy: str = None,
        frame_options: str = "DENY",
        enable_hsts: bool = True,
    ):
        super().__init__(app)
        self.hsts_seconds = hsts_seconds
        self.frame_options = frame_options
        self.enable_hsts = enable_hsts
        
        # Default Content Security Policy (restrictive)
        self.csp_policy = csp_policy or (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://*.supabase.co; "
            "frame-ancestors 'none';"
        )
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """
        Add security headers to response.
        """
        response = await call_next(request)
        
        # X-Content-Type-Options: Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options: Prevent clickjacking
        response.headers["X-Frame-Options"] = self.frame_options
        
        # X-XSS-Protection: Enable XSS filter (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Strict-Transport-Security: Enforce HTTPS (only in production)
        if self.enable_hsts and request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                f"max-age={self.hsts_seconds}; includeSubDomains; preload"
            )
        
        # Content-Security-Policy: Restrict resource loading
        response.headers["Content-Security-Policy"] = self.csp_policy
        
        # Referrer-Policy: Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions-Policy: Restrict browser features
        response.headers["Permissions-Policy"] = (
            "geolocation=(self), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "accelerometer=()"
        )
        
        # Remove server information leakage (use del for MutableHeaders)
        if "Server" in response.headers:
            del response.headers["Server"]
        
        logger.debug(f"Added security headers to {request.url.path}")
        
        return response


# Production-ready configuration
PRODUCTION_CONFIG = {
    "hsts_seconds": 31536000,  # 1 year
    "frame_options": "DENY",
    "enable_hsts": True,
    "csp_policy": (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self'; "
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "connect-src 'self' https://*.supabase.co https://api.stackhawk.com; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    ),
}

# Development configuration (more permissive)
DEVELOPMENT_CONFIG = {
    "hsts_seconds": 0,  # Disable HSTS in dev
    "frame_options": "SAMEORIGIN",
    "enable_hsts": False,
    "csp_policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' http://localhost:* https://*.supabase.co; "
        "frame-ancestors 'self';"
    ),
}
