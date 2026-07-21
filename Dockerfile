# GAIA Backend - root Dockerfile for PaaS auto-detection
# DigitalOcean App Platform and similar services look for "Dockerfile" at repo root.
# Secured version with CVE fixes. Build context: repo root.

# Multi-stage build for GAIA Backend (Python AI/ML Pipeline)
FROM python:3.12-slim AS builder

# Set working directory
WORKDIR /app

# Upgrade pip and install pip-tools for reproducible builds
RUN pip install --upgrade pip pip-tools

# Install system dependencies for building Python packages (minimize perl dependencies)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    build-essential \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    libffi-dev \
    pkg-config \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY backend/python/requirements.txt .

# Install Python dependencies from requirements.txt
RUN pip install --no-cache-dir --user -r requirements.txt

# Download spaCy language model (install with --user so it lands in /root/.local)
RUN pip install --no-cache-dir --user https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl

# Production stage with security patches
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install runtime dependencies with security updates
# Explicitly pin curl to fixed version and remove perl/unnecessary packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl=8.14.1-2+deb13u4 \
    libcurl4t64=8.14.1-2+deb13u4 \
    libssh2-1t64=1.11.1-1+deb13u1 \
    ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -r appuser

# Copy Python dependencies from builder with ownership
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Copy application code with ownership
COPY --chown=appuser:appuser backend/python/ ./backend/python/

# Create models directory with correct ownership
RUN mkdir -p /app/models && chown -R appuser:appuser /app/models

# Switch to non-root user
USER appuser

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV PATH=/home/appuser/.local/bin:$PATH

# Expose port
EXPOSE 8000

# Health check for PaaS (App Platform, Railway, etc.)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
