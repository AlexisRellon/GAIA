<div align="center">

<img src="./frontend/public/assets/img/GAIA.png" /><br />
# GAIA: Geospatial AI-driven Assessment

*AI-powered environmental hazard detection for the Philippines*

[![Build Status](https://img.shields.io/badge/Build-Passing-success?style=flat-square)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)]()
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)]()
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)]()
[![License](https://img.shields.io/badge/License-TBD-yellow?style=flat-square)]()

[Overview](#overview) • [Features](#features) • [Getting Started](#getting-started) • [Architecture](#architecture) • [Documentation](#documentation)

</div>

---

## Overview

GAIA (Geospatial AI-driven Assessment) is a real-time environmental hazard detection and visualization system built specifically for the Philippines. The system automatically processes news feeds and citizen reports to detect, classify, and map environmental hazards including typhoons, floods, earthquakes, landslides, and wildfires.

Using state-of-the-art AI models and geospatial validation, GAIA provides disaster management agencies, local government units (LGUs), and emergency responders with actionable intelligence to support rapid response and resource allocation.

<div align="center">
  <img src="./Project-context/img/gaia-architecture-diagram.png" alt="GAIA Architecture" width="800px" />
</div>

> **Target Time-to-Action**: Less than 5 minutes from article publication to hazard visualization on the map.

## Features

### AI-Powered Detection
- **Zero-Shot Classification**: Uses Climate-NLI model for hazard type detection without extensive training data
- **Geo-NER Extraction**: Custom model extracts Philippine location names from unstructured text
- **Multi-lingual Support**: Handles code-switching between English, Tagalog, and regional dialects
- **Confidence Scoring**: Provides uncertainty quantification for all AI predictions

### Real-Time Monitoring
- **RSS Feed Aggregation**: Automatic ingestion from Philippine news outlets (GMA News, ABS-CBN, Inquirer.net)
- **Live Updates**: Supabase Realtime pushes new hazards instantly to the map
- **Background Processing**: Celery workers handle AI pipeline and RSS processing asynchronously

### Interactive Visualization
- **Progressive Web App**: Offline-capable React application with responsive design
- **Dynamic Mapping**: Leaflet-powered interactive maps with marker clustering
- **Advanced Filtering**: Filter by hazard type, region, time window, and source
- **Heatmap Visualization**: Density-based visualization for high-concentration areas

### Citizen Reporting
- **Public Submission**: Anonymous hazard reporting with reCAPTCHA protection
- **Image Upload**: Support for photo evidence with geotag extraction
- **Manual Triage**: Human-in-the-loop validation for low-confidence reports

### Administrative Tools
- **Report Triage**: Validate or reject citizen-submitted reports
- **User Management**: Role-based access control (Master Admin, Validator, LGU Responder)
- **Activity Logging**: Complete audit trail of all system actions
- **Analytics Dashboard**: Performance metrics and trend analysis

## Getting Started

### Prerequisites

**For Docker Development (Recommended)**
- [Docker Desktop](https://www.docker.com/products/docker-desktop) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) V2+
- [Git](https://git-scm.com/downloads)

**For Local Development**
- [Node.js](https://nodejs.org/) 18 LTS or later
- [Python](https://www.python.org/downloads/) 3.9+
- [PostgreSQL](https://www.postgresql.org/download/) 14+ with PostGIS extension
- Git

### Quick Start with Docker

The fastest way to get GAIA running locally:

```bash
# Clone the repository
git clone https://github.com/AlexisRellon/GAIA.git
cd GAIA

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your Supabase credentials
# Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Start all services with Docker Compose
docker-compose up --build
```

**Services will be available at:**
- Frontend PWA: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Deploy to Railway

GAIA supports production deployment on Railway with a single command:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# View logs
railway logs --service backend
```

For complete deployment instructions including environment variables, database setup, and custom domains, see the [Railway Deployment Guide](docs/guides/RAILWAY_DEPLOYMENT.md).

**Monthly Cost Estimate**: ~$65-105 (Railway: $40-80 + Supabase Pro: $25)

## Architecture

GAIA follows a three-tiered serverless architecture designed for real-time processing and scalability:

### 1. Data Ingestion Layer
- **RSS Aggregation**: Celery Beat scheduler triggers hourly RSS feed ingestion
- **Citizen Reports**: Public API endpoint with reCAPTCHA validation
- **Reference Data**: Philippine administrative boundaries from NAMRIA

### 2. Core Processing (AI Pipeline)
```
Text Input → Preprocessing (spaCy/NLTK) → Climate-NLI (Hazard Type) 
  → Geo-NER (Location) → PostGIS Validation → Database Storage
```

**Output Format**: `{Hazard Type, Latitude, Longitude, Confidence Score}`

- Only events within Philippine administrative boundaries are processed
- Low-confidence predictions (<0.7) are flagged for manual triage
- All processing happens in background workers to maintain API responsiveness

### 3. Presentation Layer (PWA)
- **React 18** with TypeScript for type-safe development
- **TailwindCSS + ShadCN UI** for modern, accessible components
- **Leaflet** for interactive geospatial visualization
- **React Query** for efficient data fetching and caching
- **Zustand** for lightweight state management

### Service Architecture

**Production Deployment** (5 Services):
```
┌─────────────┐   ┌─────────────┐   ┌──────────┐
│   Frontend  │──▶│   Backend   │──▶│ Supabase │
│  (Nginx)    │   │  (FastAPI)  │   │(PostGIS) │
└─────────────┘   └─────────────┘   └──────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │    Redis    │
                  └─────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
   ┌─────────────┐              ┌─────────────┐
   │   Celery    │              │   Celery    │
   │   Worker    │              │    Beat     │
   │ (AI Tasks)  │              │ (Scheduler) │
   └─────────────┘              └─────────────┘
```

### Tech Stack

**Frontend**
- React 18, TypeScript, TailwindCSS
- Leaflet (interactive maps), react-leaflet-cluster
- ShadCN UI (11 components), Radix UI primitives
- React Query (data fetching), Zustand (state)

**Backend**
- Python 3.9+, FastAPI, Uvicorn
- Transformers (Climate-NLI), spaCy (Geo-NER)
- Celery + Redis (background tasks)
- Supabase Python SDK

**Database & Storage**
- Supabase (managed PostgreSQL + PostGIS)
- Supabase Auth (RBAC), Storage (images)
- Supabase Realtime (live notifications)

**Deployment**
- Docker + Docker Compose (local dev)
- Railway (production hosting)
- GitHub Actions (CI/CD)

## Documentation

### Core Documentation
- **[MODULE_CHECKLIST.md](MODULE_CHECKLIST.md)** - Implementation status tracker
- **[docs/README.md](docs/README.md)** - Complete documentation index
- **[AGENTS.md](AGENTS.md)** - AI agent navigation guide

### Setup Guides
- **[Railway Deployment](docs/guides/RAILWAY_DEPLOYMENT.md)** - Production deployment (550+ lines)
- **[Docker Guide](docs/guides/DOCKER_GUIDE.md)** - Local development setup
- **[Quick Start](docs/setup/QUICK_START.md)** - Fast setup after security integration
- **[Database Setup](docs/setup/DATABASE_SETUP.md)** - PostgreSQL + PostGIS configuration

### Security
- **[StackHawk Testing Guide](docs/security/STACKHAWK_TESTING_GUIDE.md)** - Security scanning
- **[Security Audit](docs/security/SECURITY_AUDIT.md)** - Findings and recommendations
- **[Security Headers](docs/security/SECURITY_HEADERS_QUICK_REF.md)** - HTTP security reference

### Development
- **[OpenSpec Workflow](openspec/AGENTS.md)** - Proposal and spec management
- **[Project Specification](openspec/project.md)** - Complete tech stack and conventions
- **[Frontend Instructions](frontend/COPILOT_INSTRUCTIONS.md)** - Frontend development guide
- **[Backend Instructions](backend/COPILOT_INSTRUCTIONS.md)** - Backend development guide

## Development Workflow

### Module Codes

Use these prefixes for branches and commits:

```
AUTH-0x  Authentication/Registration
CD-01    Dashboard/Command Interface
GV-0x    Geospatial Visualization (maps, markers, heatmaps)
FP-0x    Filtering Panel (hazard/region/time/source)
RG-0x    Report Generation (CSV, GeoJSON, PDF exports)
AC-0x    Admin Console (logs, thresholds, triage)
CR-0x    Citizen Report (submission, validation)
UM-0x    User Management (RBAC)
```

### Git Conventions

```bash
# Branch naming
feature/GV-04-heatmap-density
fix/CR-03-captcha-timeout

# Commit messages
feat(GV-02): add dynamic marker refresh
fix(CR-03): handle CAPTCHA timeout gracefully
docs(README): update deployment instructions
```

### Docker Development

All development happens in Docker containers for consistency:

```bash
# Start all services
docker-compose up

# Rebuild after dependency changes
docker-compose up --build

# Run backend tests
docker-compose run backend pytest tests/python/ --cov

# Run frontend tests
docker-compose run frontend npm test

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Testing

**Unit & Integration Tests**
```bash
# Python AI/ML tests
pytest tests/python/ --cov=backend/python

# Frontend tests
cd frontend && npm test

# Coverage report
npm run test:coverage
```

**Security Testing** (StackHawk)
```powershell
# Quick setup (one-time)
.\scripts\setup-stackhawk.ps1

# Load test functions
. .\scripts\test-stackhawk.ps1

# Run scans
Test-Backend    # Backend API scan (5 min)
Test-Frontend   # Frontend PWA scan (10 min)
Test-Quick      # Quick backend scan (30 sec)
```

## Key Constraints

> **Important**: These constraints are critical for system integrity and compliance.

1. **Geographic Scope**: ONLY processes events within Philippine administrative boundaries
2. **Confidence Display**: Always show confidence scores alongside predictions
3. **Time-to-Action**: Target < 5 minutes from RSS article to map marker
4. **Data Privacy**: Comply with RA 10173 (Philippine Data Protection Act)
5. **Human-in-the-Loop**: Manual validation required for low-confidence reports (<0.7)
6. **Container-First**: All services must run in Docker containers

## Troubleshooting

**Docker Issues**
- Ensure Docker Desktop is running: `docker ps` should succeed
- Clear Docker cache: `docker system prune -a`
- Check Docker logs: `docker-compose logs -f [service]`

**API Connection Errors**
- Verify Supabase credentials in `backend/.env`
- Check CORS settings in `backend/python/main.py`
- Ensure services can communicate: use container names, not localhost

**Frontend Build Errors**
- Clear node_modules: `rm -rf frontend/node_modules && cd frontend && npm install`
- Check TypeScript errors: `cd frontend && npm run lint`

For more troubleshooting, see:
- [Docker Implementation Guide](docs/guides/DOCKER_IMPLEMENTATION.md)
- [Railway Troubleshooting](docs/guides/RAILWAY_DEPLOYMENT.md#troubleshooting)

## Resources

### Learning Materials
- [Academic Manuscript](Project-context/GAIA-Manuscript.docx.md) - Research context and methodology
- [System Modules](Project-context/GAIA-modules.md) - Detailed module descriptions
- [Use Case Clarification](docs/guides/USE_CASE_CLARIFICATION.md) - System requirements

### External Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Railway Documentation](https://docs.railway.app/)

### Related Projects
- [Climate-NLI Model](https://huggingface.co/MoritzLaurer/deberta-v3-base-zeroshot-v1.1-all-33)
- [spaCy NER Models](https://spacy.io/models/en)
- [NAMRIA Philippine Boundaries](https://www.namria.gov.ph/)

## Project Status

**Current Phase**: Production-ready with ongoing enhancements

**Completed Modules** (✅):
- Authentication & Authorization (AUTH-01, AUTH-02)
- Dashboard Interface (CD-01)
- Geospatial Visualization (GV-01 to GV-04)
- Filtering Panel (FP-01 to FP-04)
- Report Generation (RG-01, RG-02, RG-03)
- Admin Console (AC-01 to AC-04)
- Citizen Reports (CR-01 to CR-07)

**In Progress** (🚧):
- Advanced Analytics (AAM-01 to AAM-03)
- External Data Integration (EDI-01 to EDI-03)

See [MODULE_CHECKLIST.md](MODULE_CHECKLIST.md) for detailed implementation status.

---

<div align="center">

**Built with ❤️ for disaster resilience in the Philippines**

[Report Bug](https://github.com/AlexisRellon/GAIA/issues) • [Request Feature](https://github.com/AlexisRellon/GAIA/issues) • [Documentation](docs/README.md)

</div>
