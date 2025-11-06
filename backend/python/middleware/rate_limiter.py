"""
Rate Limiting Middleware for GAIA API
Implements slowapi rate limiter for research endpoints.

Security Recommendation: SECURITY_AUDIT.md #1 (High Priority)
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/hour"],  # Default: 100 requests per hour per IP
    storage_uri="memory://",  # In-memory storage (use Redis in production)
    headers_enabled=True,  # Add X-RateLimit-* headers to responses
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    Custom handler for rate limit exceeded errors.
    
    Returns:
        JSONResponse with 429 status code and retry information
    """
    logger.warning(
        f"Rate limit exceeded for IP {get_remote_address(request)} "
        f"on endpoint {request.url.path}"
    )
    
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "detail": f"Too many requests. Please try again later.",
            "retry_after": exc.detail,  # Seconds until rate limit resets
        },
        headers={
            "Retry-After": str(exc.detail),
            "X-RateLimit-Limit": request.headers.get("X-RateLimit-Limit", "Unknown"),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": request.headers.get("X-RateLimit-Reset", "Unknown"),
        },
    )


# Rate limit configurations for different endpoint types
RATE_LIMITS = {
    # Research validation endpoints (prevent abuse)
    "research_validation": "10/minute",  # Max 10 validations per minute per IP
    "research_export": "5/minute",  # Max 5 exports per minute (large datasets)
    "research_metrics": "30/minute",  # Max 30 metric queries per minute
    
    # AI/ML endpoints (computationally expensive)
    "classify": "20/minute",  # ClimateNLI classification
    "extract_locations": "20/minute",  # Geo-NER extraction
    
    # RSS processing (prevent feed scraping abuse)
    "rss_process": "10/minute",  # Max 10 feed processing requests per minute
    
    # Default for other endpoints
    "default": "100/hour",
}


def get_rate_limit(endpoint_type: str = "default") -> str:
    """
    Get rate limit configuration for endpoint type.
    
    Args:
        endpoint_type: Type of endpoint (research_validation, classify, etc.)
    
    Returns:
        Rate limit string (e.g., "10/minute")
    """
    return RATE_LIMITS.get(endpoint_type, RATE_LIMITS["default"])


# Usage example in endpoint:
# @router.post("/validate/{hazard_id}")
# @limiter.limit(get_rate_limit("research_validation"))
# async def validate_hazard(request: Request, hazard_id: str, ...):
#     ...
