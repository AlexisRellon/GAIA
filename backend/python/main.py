"""
GAIA Backend API Entry Point
Geospatial AI-driven Assessment - Environmental Hazard Detection
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Import AI models and processors
from backend.python.models.classifier import classifier
from backend.python.models.geo_ner import geo_ner
from backend.python.pipeline.rss_processor import rss_processor

# Import research API router (commented out until Supabase configured)
# from backend.python.research_api import router as research_router

# Import PDF report generation router
from backend.python.reports import router as reports_router

# Import citizen reports router
from backend.python.citizen_reports import router as citizen_reports_router

# Import admin dashboard router
from backend.python.admin_api import router as admin_router

# Import RSS admin router
from backend.python.rss_admin_api import router as rss_admin_router

# Import security middleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.python.middleware.rate_limiter import limiter, rate_limit_exceeded_handler
from backend.python.middleware.security_headers import SecurityHeadersMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan event handler (replaces deprecated @app.on_event)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load AI models on startup, cleanup on shutdown"""
    # Startup
    logger.info("Starting GAIA Backend...")
    logger.info("Loading AI models...")
    
    try:
        # Load classifier
        classifier.load_model()
        logger.info("✓ Zero-Shot Classifier loaded")
        
        # Load Geo-NER
        geo_ner.load_model()
        logger.info("✓ Geo-NER model loaded")
        
        logger.info("GAIA Backend ready!")
        
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        raise
    
    yield  # Application runs here
    
    # Shutdown (cleanup if needed)
    logger.info("Shutting down GAIA Backend...")

# Initialize FastAPI application with lifespan handler
app = FastAPI(
    title="GAIA API",
    description="Geospatial AI-driven Assessment for Philippine Environmental Hazards",
    version="0.1.0",
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "Core",
            "description": "Core API endpoints"
        },
        {
            "name": "AI/ML",
            "description": "AI/ML endpoints for hazard classification and location extraction"
        },
        {
            "name": "RSS Processing",
            "description": "RSS feed processing for real-time hazard detection"
        },
        {
            "name": "Research & Validation",
            "description": "Officer validation, ground truth, and algorithm metrics for thesis research"
        }
    ]
)

# Determine environment for security and CORS configuration
ENV = os.getenv("ENV", "development")

# Configure CORS with environment-based whitelist
# Support for Railway deployment, localhost development, and future custom domains
if ENV == "production":
    # Production: Railway domains + custom domains (wildcard support)
    default_origins = "https://*.up.railway.app,https://*.railway.app,https://gaia.railway.app"
else:
    # Development: localhost only
    default_origins = "http://localhost:3000,http://localhost:8000"

allowed_origins_str = os.getenv("CORS_ORIGINS", default_origins)

# Parse CORS origins (support wildcards for Railway subdomains)
if "*" in allowed_origins_str:
    # Wildcard support - validate origins at runtime
    allowed_origins = "*"  # Allow all origins (Railway handles subdomain validation)
else:
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type", 
        "Authorization", 
        "Accept", 
        "Origin", 
        "X-Requested-With", 
        "X-API-Key",
        "X-CSRF-Token",
        "Railway-Deployment-Id"  # Railway-specific header
    ],
    expose_headers=["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add security headers middleware (SECURITY_AUDIT.md #5)
# Use ENV variable defined above - enable HSTS only in production
enable_hsts = ENV == "production"
app.add_middleware(
    SecurityHeadersMiddleware,
    enable_hsts=enable_hsts,
    frame_options="DENY",
    hsts_seconds=31536000  # 1 year
)

# Attach rate limiter (SECURITY_AUDIT.md #1)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Include routers
# app.include_router(research_router, prefix="/api/v1")  # Research API (commented out until configured)
app.include_router(reports_router, prefix="/api/v1")  # PDF Report Generation
app.include_router(citizen_reports_router, prefix="/api/v1")  # Citizen Reports
app.include_router(admin_router, prefix="/api/v1")  # Admin Dashboard
app.include_router(rss_admin_router, prefix="/api/v1")  # RSS Feed Management

# Import analytics router
from backend.python.analytics_api import router as analytics_router
app.include_router(analytics_router, prefix="/api/v1")  # Analytics API


# Pydantic models for request/response validation
class ClassifyTextRequest(BaseModel):
    text: str
    threshold: Optional[float] = 0.5


class ClassifyTextResponse(BaseModel):
    hazard_type: Optional[str]
    score: float
    is_hazard: bool
    all_scores: dict


class ExtractLocationsRequest(BaseModel):
    text: str


class LocationResponse(BaseModel):
    location_name: str
    location_type: str
    confidence: float
    source: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    province: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None


class ProcessRSSRequest(BaseModel):
    feeds: Optional[List[str]] = None


@app.get("/", tags=["Core"])
async def root():
    """Root endpoint"""
    return {
        "message": "GAIA API - Geospatial AI-driven Assessment",
        "version": "0.1.0",
        "status": "running",
        "capabilities": [
            "Zero-Shot Hazard Classification",
            "Philippine Geo-NER",
            "RSS Feed Processing",
            "Real-time Hazard Detection",
            "Research & Validation"
        ]
    }


@app.get("/health", tags=["Core"])
async def health_check():
    """Health check endpoint for Docker"""
    return {
        "status": "healthy",
        "service": "gaia-backend",
        "models_loaded": {
            "classifier": classifier.model is not None,
            "geo_ner": geo_ner.ner_model is not None
        }
    }


# ============================================================================
# AI/ML Endpoints
# ============================================================================
@app.post("/api/v1/classify", response_model=ClassifyTextResponse, tags=["AI/ML"])
@limiter.limit("20/minute")  # Rate limit: 20 requests per minute (AI/ML intensive)
async def classify_text(request: Request, response: Response, body: ClassifyTextRequest):
    """
    Classify text into environmental hazard categories.
    Uses model fallback hierarchy: climatebert → deberta → bart → xlm-roberta
    Rate limited: 20 requests per minute per IP
    
    - **text**: Text to classify (article content, citizen report)
    - **threshold**: Minimum confidence threshold (0.0-1.0)
    
    Returns classification result with hazard type and confidence score.
    """
    try:
        result = classifier.classify(body.text, threshold=body.threshold)
        return ClassifyTextResponse(**result)
        
    except Exception as e:
        logger.error(f"Classification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/extract-locations", response_model=List[LocationResponse], tags=["AI/ML"])
@limiter.limit("30/minute")  # Rate limit: 30 requests per minute (includes geocoding)
async def extract_locations(request: Request, response: Response, body: ExtractLocationsRequest):
    """
    Extract Philippine locations from text using Geo-NER.
    Rate limited: 30 requests per minute per IP
    
    - **text**: Text to extract locations from
    
    Returns list of locations with coordinates and administrative hierarchy.
    """
    try:
        locations = geo_ner.extract_locations(body.text)
        return [LocationResponse(**loc) for loc in locations]
        
    except Exception as e:
        logger.error(f"Location extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/hazard-categories", tags=["AI/ML"])
async def get_hazard_categories():
    """
    Get list of supported hazard categories.
    
    Returns all 10 environmental hazard types supported by the classifier.
    """
    return {
        "categories": classifier.get_categories(),
        "count": len(classifier.get_categories())
    }


@app.get("/api/v1/model-info", tags=["AI/ML"])
async def get_model_info():
    """
    Get information about currently loaded AI models.
    Useful for monitoring which model is active in the fallback hierarchy.
    """
    return {
        "classifier": {
            "active_model": classifier.get_active_model(),
            "fallback_models": classifier.fallback_models,
            "categories_count": len(classifier.get_categories())
        },
        "geo_ner": {
            "model": geo_ner.ner_model_name,
            "loaded": geo_ner.ner_model is not None
        }
    }


# ============================================================================
# RSS Processing Endpoints
# ============================================================================

@app.post("/api/v1/rss/process", tags=["RSS Processing"])
async def process_rss_feeds(request: ProcessRSSRequest, background_tasks: BackgroundTasks):
    """
    Process RSS feeds to detect environmental hazards.
    
    - **feeds**: Optional list of RSS feed URLs (uses default Philippine news sources if not provided)
    
    Triggers background processing of feeds with AI pipeline.
    Returns immediately with task started confirmation.
    
    **IMPORTANT**: This endpoint returns immediately and processes feeds in the background
    to prevent blocking other API requests. Check processing status via logs or database.
    """
    try:
        # Set feeds
        feeds_to_process = request.feeds if request.feeds else rss_processor.DEFAULT_FEEDS
        
        # Add background task (non-blocking)
        async def process_feeds_background():
            try:
                rss_processor.set_feeds(feeds_to_process)
                results = await rss_processor.process_all_feeds()
                logger.info(f"✅ Background RSS processing completed: {len(results)} feeds processed")
                return results
            except Exception as e:
                logger.error(f"❌ Background RSS processing error: {str(e)}", exc_info=True)
        
        background_tasks.add_task(process_feeds_background)
        
        # Return immediately with task started status
        return {
            "status": "processing",
            "message": "RSS feed processing started in background",
            "feeds_count": len(feeds_to_process),
            "feeds": feeds_to_process,
            "note": "Processing happens in background. Check logs or database for results."
        }
        
    except Exception as e:
        logger.error(f"RSS processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/rss/default-feeds", tags=["RSS Processing"])
async def get_default_feeds():
    """Get list of default Philippine news RSS feeds"""
    return {
        "feeds": rss_processor.DEFAULT_FEEDS,
        "count": len(rss_processor.DEFAULT_FEEDS)
    }


# ============================================================================
# Database Integration Endpoints (Placeholder - will connect to Supabase)
# ============================================================================

@app.get("/api/v1/hazards")
async def get_hazards():
    """Get all hazards from database (placeholder for Supabase integration)"""
    return {
        "hazards": [],
        "message": "Database integration pending - Supabase connection to be added"
    }


@app.get("/api/v1/hazards/{hazard_id}")
async def get_hazard(hazard_id: int):
    """Get specific hazard by ID (placeholder)"""
    return {
        "hazard": None,
        "message": f"Hazard {hazard_id} - Database integration pending"
    }


# NOTE: Routers already included at lines 133-140 with /api/v1 prefix
# Duplicate inclusions removed to prevent path conflicts


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("API_PORT", 8000))
    host = os.getenv("API_HOST", "0.0.0.0")

    uvicorn.run("main:app", host=host, port=port, reload=True, log_level="info")
