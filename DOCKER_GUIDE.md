# GAIA Docker Setup Guide

## Overview

GAIA uses Docker for consistent development and deployment environments. This guide covers Docker-based local development and Heroku production deployment.

## Prerequisites

- **Docker Desktop** (Windows/Mac) or Docker Engine (Linux)
- **Docker Compose V2+**
- **Git**
- **Heroku CLI** (for deployment)

### Install Docker Desktop

**Windows**: Download from https://www.docker.com/products/docker-desktop/
**Mac**: Download from https://www.docker.com/products/docker-desktop/
**Linux**: Follow instructions at https://docs.docker.com/engine/install/

Verify installation:
```powershell
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone and Configure

```powershell
# Clone repository
git clone <repository-url>
cd TerraSentinel

# Copy environment files
cp backend\.env.example backend\.env
cp frontend\.env.example frontend\.env

# Edit environment files with your credentials
# backend\.env - Add SUPABASE_URL, SUPABASE_ANON_KEY
# frontend\.env - Add REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY
```

### 2. Start Services

```powershell
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### 3. Access Services

Once all containers are running:

- **Frontend PWA**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Health Check**: http://localhost:8000/health
- **API Documentation**: http://localhost:8000/docs (FastAPI Swagger UI)
- **Supabase Studio**: http://localhost:54323
- **PostgreSQL Database**: localhost:54322 (credentials in .env)

## Development Workflow

### Working with Containers

```powershell
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# Rebuild after dependency changes
docker-compose up --build
```

### Running Commands in Containers

```powershell
# Access backend shell
docker-compose exec backend bash

# Access frontend shell
docker-compose exec frontend sh

# Run Python commands
docker-compose exec backend python -c "print('Hello from container')"

# Run npm commands
docker-compose exec frontend npm run build
```

### Running Tests

```powershell
# Backend tests
docker-compose run backend pytest tests/python/ --cov=backend/python

# Frontend tests
docker-compose run frontend npm test

# Frontend tests with coverage
docker-compose run frontend npm run test:coverage
```

### Installing New Dependencies

**Backend Python packages**:
```powershell
# Add to backend/python/requirements.txt
# Then rebuild
docker-compose up --build backend
```

**Frontend npm packages**:
```powershell
# Add to frontend/package.json
# Then rebuild
docker-compose up --build frontend
```

## Docker Services Explained

### Backend Service
- **Image**: Built from `Dockerfile.backend`
- **Base**: Python 3.11-slim
- **Port**: 8000
- **Features**:
  - Multi-stage build for smaller image size
  - Automatic dependency installation
  - spaCy language model downloaded during build
  - FastAPI with hot reload
  - Health check endpoint

### Frontend Service
- **Image**: Built from `Dockerfile.frontend`
- **Base**: Node.js 18-alpine (dev), nginx:alpine (prod)
- **Port**: 3000
- **Features**:
  - React development server with hot reload
  - TailwindCSS compilation
  - PWA service worker support
  - Nginx for production serving

### Supabase Database
- **Image**: supabase/postgres:15.1.0.117
- **Port**: 54322
- **Features**:
  - PostgreSQL 15 with PostGIS extension
  - Logical replication enabled
  - Persistent volume for data
  - Auto-loads migrations from `backend/supabase/migrations/`

### Supabase Studio
- **Image**: supabase/studio:latest
- **Port**: 54323
- **Features**:
  - Web-based database management UI
  - Table editor, SQL editor, API explorer
  - Visual schema designer

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:postgres@supabase-db:5432/postgres
CLIMATE_NLI_MODEL_PATH=models/climate-nli
GEO_NER_MODEL_PATH=models/geo-ner
MIN_CONFIDENCE_THRESHOLD=0.7
```

### Frontend (.env)
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:8000
REACT_APP_MAPBOX_TOKEN=your-mapbox-token
REACT_APP_DEFAULT_CENTER_LAT=12.8797
REACT_APP_DEFAULT_CENTER_LNG=121.7740
REACT_APP_DEFAULT_ZOOM=6
REACT_APP_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

## Heroku Deployment

### Prerequisites
```powershell
# Install Heroku CLI
# Windows: Download from https://devcenter.heroku.com/articles/heroku-cli
# Mac: brew tap heroku/brew && brew install heroku

# Login to Heroku
heroku login
```

### Deploy to Heroku

```powershell
# Create Heroku app
heroku create gaia-hazard-detection

# Set stack to container (for Docker deployment)
heroku stack:set container

# Add PostgreSQL addon (or use external Supabase)
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SUPABASE_URL=your-supabase-url
heroku config:set SUPABASE_ANON_KEY=your-anon-key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
heroku config:set CLIMATE_NLI_MODEL_PATH=models/climate-nli
heroku config:set GEO_NER_MODEL_PATH=models/geo-ner
heroku config:set MIN_CONFIDENCE_THRESHOLD=0.7

# Login to Heroku Container Registry
heroku container:login

# Build and push Docker images
heroku container:push backend frontend

# Release the containers
heroku container:release backend frontend

# Open the app
heroku open

# View logs
heroku logs --tail
```

### CI/CD with GitHub Actions

The `heroku.yml` file configures automatic deployment:

```yaml
build:
  docker:
    backend: Dockerfile.backend
    frontend: Dockerfile.frontend
run:
  backend: 
    command: python backend/python/main.py
  frontend:
    command: nginx -g daemon off;
```

## Troubleshooting

### Port Conflicts
If ports 3000, 8000, 54322, or 54323 are already in use:

```powershell
# Find processes using ports (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Stop conflicting processes or modify docker-compose.yml ports
```

### Container Won't Start
```powershell
# View detailed logs
docker-compose logs backend
docker-compose logs frontend

# Remove volumes and rebuild
docker-compose down -v
docker-compose up --build
```

### Out of Memory
```powershell
# Increase Docker Desktop memory limit
# Docker Desktop → Settings → Resources → Memory (allocate 8GB+)

# Or reduce services
docker-compose up backend  # Only start backend
```

### Permission Issues (Linux)
```powershell
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## Performance Optimization

### Docker Build Cache
```powershell
# Use BuildKit for faster builds
$env:DOCKER_BUILDKIT=1
docker-compose build
```

### Volume Mounts
The `docker-compose.yml` uses volume mounts for hot reload:
- `./backend/python:/app/backend/python` - Backend code changes reload automatically
- `./frontend/src:/app/src` - Frontend code changes reload automatically

### Multi-Stage Builds
Both Dockerfiles use multi-stage builds:
- Builder stage: Installs all dependencies
- Production stage: Copies only necessary files, resulting in smaller images

## Best Practices

1. **Never commit `.env` files** - Use `.env.example` as templates
2. **Use `.dockerignore`** - Exclude unnecessary files from builds
3. **Pin dependency versions** - Use specific versions in requirements.txt and package.json
4. **Health checks** - Both containers have health check endpoints
5. **Graceful shutdown** - Use `docker-compose down` instead of killing processes
6. **Volume cleanup** - Run `docker-compose down -v` to remove unused volumes

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Heroku Container Registry: https://devcenter.heroku.com/articles/container-registry-and-runtime
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Supabase Local Development: https://supabase.com/docs/guides/local-development

---

**Questions or Issues?** Check the main README.md or open an issue in the repository.
