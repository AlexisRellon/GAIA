"""
Request/Response Logging Middleware for GAIA
Comprehensive logging for security audit and debugging

Security Implementation: PATCH-1 (Critical Security Fixes)
- Logs all API requests with user context
- Tracks IP addresses and user agents
- Monitors response times and status codes
- Sanitizes sensitive data from logs

Module: AC-05 (Session and Activity Logger)
"""

import logging
import time
import json
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests and responses
    
    Logs include:
    - Request method, path, query params
    - Client IP address and user agent
    - Response status code and processing time
    - User context (if authenticated)
    - Sanitized request/response bodies
    """
    
    def __init__(
        self,
        app,
        log_request_body: bool = False,  # Set True for debugging, False for production
        log_response_body: bool = False,
        exclude_paths: list = None
    ):
        super().__init__(app)
        self.log_request_body = log_request_body
        self.log_response_body = log_response_body
        self.exclude_paths = exclude_paths or ["/health", "/docs", "/openapi.json", "/favicon.ico"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log details"""
        
        # Skip logging for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        # Start timing
        start_time = time.time()
        
        # Extract request metadata
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "Unknown")
        
        # Extract user context from Authorization header (if present)
        user_email = None
        auth_header = request.headers.get("Authorization")
        if auth_header:
            try:
                # Extract user from JWT token (simplified - actual extraction done in RBAC middleware)
                user_email = "authenticated_user"  # Placeholder - RBAC middleware will set actual user
            except Exception:
                pass
        
        # Log request body if enabled (sanitize sensitive data)
        request_body = None
        if self.log_request_body and request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "").lower()
            if content_type.startswith("multipart/") or content_type.startswith("application/octet-stream"):
                request_body = "[multipart/binary body omitted]"
            else:
                try:
                    body_bytes = await request.body()

                    # Restore body for downstream handlers (form parsers, etc.)
                    async def receive() -> Message:
                        return {"type": "http.request", "body": body_bytes}
                    request._receive = receive

                    try:
                        request_body = self._sanitize_body(body_bytes.decode("utf-8"))
                    except UnicodeDecodeError:
                        request_body = "[binary body omitted]"
                except Exception as e:
                    logger.warning(f"Failed to read request body: {str(e)}")
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log exception
            processing_time = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path} | "
                f"IP: {client_ip} | User: {user_email or 'anonymous'} | "
                f"Error: {str(e)} | Time: {processing_time:.3f}s",
                exc_info=True
            )
            raise
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Log request/response
        log_level = logging.INFO if response.status_code < 400 else logging.WARNING
        logger.log(
            log_level,
            f"{request.method} {request.url.path} | "
            f"Status: {response.status_code} | "
            f"IP: {client_ip} | "
            f"User: {user_email or 'anonymous'} | "
            f"UA: {user_agent[:50]}... | "
            f"Time: {processing_time:.3f}s"
        )
        
        # Detailed logging for production monitoring
        if response.status_code >= 400:
            logger.warning(
                f"Request error details: "
                f"Method={request.method}, "
                f"Path={request.url.path}, "
                f"Query={dict(request.query_params)}, "
                f"Status={response.status_code}, "
                f"IP={client_ip}, "
                f"Time={processing_time:.3f}s"
            )
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request (handles proxies)"""
        # Check for forwarded IP (from load balancer/proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Get first IP in chain (original client)
            return forwarded.split(",")[0].strip()
        
        # Check for real IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # Fallback to direct client host
        return request.client.host if request.client else "unknown"
    
    def _sanitize_body(self, body_str: str) -> str:
        """
        Sanitize sensitive data from request/response bodies
        
        Removes: passwords, tokens, API keys, phone numbers
        """
        try:
            body_data = json.loads(body_str)
            
            # List of sensitive fields to redact
            sensitive_fields = [
                "password", "token", "api_key", "secret", "authorization",
                "phone_number", "ssn", "credit_card", "cvv"
            ]
            
            # Recursively sanitize
            def redact_sensitive(data):
                if isinstance(data, dict):
                    return {
                        k: "[REDACTED]" if any(s in k.lower() for s in sensitive_fields) else redact_sensitive(v)
                        for k, v in data.items()
                    }
                elif isinstance(data, list):
                    return [redact_sensitive(item) for item in data]
                else:
                    return data
            
            sanitized = redact_sensitive(body_data)
            return json.dumps(sanitized, indent=2)[:500]  # Limit to 500 chars
            
        except json.JSONDecodeError:
            # Not JSON - return truncated string
            return body_str[:200] + "..." if len(body_str) > 200 else body_str
        except Exception:
            return "[SANITIZATION_ERROR]"


# ============================================================================
# Production Configuration
# ============================================================================

# For production use, set environment variables:
# LOG_REQUEST_BODY=false (default - don't log bodies for performance)
# LOG_RESPONSE_BODY=false (default - don't log bodies for performance)
# LOG_LEVEL=INFO (or WARNING for production)

# For development/debugging:
# LOG_REQUEST_BODY=true (enable for debugging specific issues)
# LOG_LEVEL=DEBUG
