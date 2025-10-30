"""
GAIA Backend API Entry Point
Geospatial AI-driven Assessment - Environmental Hazard Detection
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI application
app = FastAPI(
    title="GAIA API",
    description="Geospatial AI-driven Assessment for Philippine Environmental Hazards",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "GAIA API",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {
        "status": "healthy",
        "service": "gaia-backend"
    }

@app.get("/api/v1/hazards")
async def get_hazards():
    """Get all hazards (placeholder)"""
    return {
        "hazards": [],
        "message": "Hazard detection pipeline not yet implemented"
    }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("API_PORT", 8000))
    host = os.getenv("API_HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
