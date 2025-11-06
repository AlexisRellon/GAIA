# GAIA: Geospatial AI-driven Assessment

🌏 **AI-driven environmental hazard detection system for the Philippines**

## Overview

GAIA is a three-tiered pipeline system that processes RSS feeds and citizen reports to detect and visualize environmental hazards (typhoons, floods, earthquakes, landslides) on an interactive map using:

- **Climate-NLI**: Zero-shot hazard classification
- **Geo-NER**: Philippine location extraction
- **PostGIS**: Geospatial validation
- **React PWA**: Real-time hazard visualization

## Quick Start

### Prerequisites

- Docker Desktop (for local development)
- Docker Compose V2+
- Git

### Docker-Based Setup (Recommended)

```powershell
# Clone the repository
git clone <repository-url>
cd GAIA

# Copy environment files
cp backend\.env.example backend\.env
cp frontend\.env.example frontend\.env
# Edit .env files with your Supabase credentials

# Start all services with Docker Compose
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - Supabase Studio: http://localhost:54323
# - PostgreSQL: localhost:54322
```

### Alternative: Local Setup (Without Docker)

<details>
<summary>Click to expand local setup instructions</summary>

#### Backend Setup

```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r backend\python\requirements.txt

# Download spaCy language model
python -m spacy download en_core_web_sm

# Copy environment file
cp backend\.env.example backend\.env
# Edit backend\.env with your Supabase credentials
```

</details>

### Docker Commands

```powershell
# Start services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Run backend tests
docker-compose run backend pytest tests/python/ --cov=backend/python

# Run frontend tests
docker-compose run frontend npm test

# Access backend container shell
docker-compose exec backend bash

# Access frontend container shell
docker-compose exec frontend sh
```

### Heroku Deployment

```powershell
# Login to Heroku
heroku login

# Create Heroku app
heroku create gaia-hazard-detection

# Set stack to container
heroku stack:set container

# Add PostgreSQL addon (or use external Supabase)
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SUPABASE_URL=your-supabase-url
heroku config:set SUPABASE_ANON_KEY=your-anon-key

# Deploy using Heroku Container Registry
heroku container:login
heroku container:push backend frontend
heroku container:release backend frontend

# View logs
heroku logs --tail
```

### Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

### Supabase Setup
## Testing

### Docker-Based Testing (Recommended)

```powershell
# Python tests
docker-compose run backend pytest tests/python/ --cov=backend/python

# Frontend tests
docker-compose run frontend npm test

# Coverage report
docker-compose run frontend npm run test:coverage
```

### Local Testing

```powershell
# Python tests
pytest tests/python/ --cov=backend/python

# Frontend tests
cd frontend
npm test

# Coverage
npm run test:coverage
```Project Structure
backend/
  python/              # AI/ML pipeline (Climate-NLI, Geo-NER)
    models/            # Model implementations
    preprocessing/     # Text preprocessing
    pipeline/          # Processing orchestration
  supabase/
    functions/         # Edge Functions
    migrations/        # Database migrations

frontend/
  src/
    components/        # React components
    pages/            # Page components
    services/         # API clients
    hooks/            # Custom React hooks
  public/             # Static assets

tests/
  python/             # Python tests (pytest)
  frontend/           # Frontend tests (Jest)
```

## Module Codes

Use these prefixes for branch/commit names:

- `AUTH-0x`: Authentication/Registration
- `CD-01`: Dashboard/Command Interface
- `GV-0x`: Geospatial Visualization
- `FP-0x`: Filtering Panel
- `RG-0x`: Report Generation
- `AC-0x`: Admin Console
- `CR-0x`: Citizen Report
- `UM-0x`: User Management

## Development Workflow

1. Check `openspec/project.md` for tech stack
2. Run `openspec spec list --long` to see capabilities
3. Create proposals in `openspec/changes/[verb-led-id]/`
4. Branch naming: `feature/GV-04-heatmap-density`
5. Commits: `feat(GV-02): add dynamic marker refresh`

## Testing

### Unit & Integration Tests
```powershell
# Python tests
pytest tests/python/ --cov=backend/python

# Frontend tests
cd frontend
npm test

# Coverage
npm run test:coverage
```

### Security Testing (StackHawk)
```powershell
# Quick setup (one-time)
.\scripts\setup-stackhawk.ps1

# Load test functions
. .\scripts\test-stackhawk.ps1

# Run scans
Test-Backend    # Scan backend API (5 min)
Test-Frontend   # Scan frontend PWA (10 min)
Test-Quick      # Quick backend scan (30 sec)
Test-Both       # Full stack scan (15 min)

# View results
# Backend:  https://app.stackhawk.com/applications/7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc
# Frontend: https://app.stackhawk.com/applications/2038be8b-5252-4763-9d17-36f9da0cb9ba
```

**Documentation**:
- `docs/security/STACKHAWK_TESTING_GUIDE.md` - Comprehensive guide
- `docs/security/STACKHAWK_QUICK_REFERENCE.md` - Command cheat sheet
- `scripts/README.md` - Script documentation
- `config/README.md` - Configuration guide

## Tech Stack

- **Backend**: Python 3.9+, transformers, spaCy, NLTK, scikit-learn
- **Database**: Supabase (PostgreSQL + PostGIS)
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Mapping**: Leaflet, react-leaflet
- **Testing**: Pytest, Jest, React Testing Library
- **Code Quality**: Black, ESLint, pre-commit hooks

## Key Constraints

1. **Geographic Scope**: Philippine administrative boundaries only
2. **Confidence Display**: Always show confidence scores
3. **Time-to-Action**: Target < 5 minutes from RSS to map
4. **Data Privacy**: Comply with RA 10173 (Philippine Data Protection Act)
5. **Human-in-the-Loop**: Manual validation for low-confidence reports

## Documentation

### 📍 Start Here
- **[DIRECTORY_CLEANUP_SUMMARY.md](DIRECTORY_CLEANUP_SUMMARY.md)** - ✨ Directory reorganization summary
- **[docs/README.md](docs/README.md)** - Complete documentation index with quick links

### Core Documentation
- **[README.md](README.md)** - This file (project overview)
- **[MODULE_CHECKLIST.md](MODULE_CHECKLIST.md)** - Implementation status tracker
- **[AGENTS.md](AGENTS.md)** - Agent navigation guide
- **[docs/README.md](docs/README.md)** - Complete documentation index

### Setup & Configuration
- **[Quick Start](docs/setup/QUICK_START.md)** - Fast setup after security integration
- **[Database Setup](docs/setup/DATABASE_SETUP.md)** - Database schema and migrations
- **[Cloud Supabase Setup](docs/setup/CLOUD_SUPABASE_SETUP.md)** - Cloud configuration
- **[Setup Status](docs/setup/SETUP_STATUS.md)** - Foundation completion status

### Security
- **[StackHawk Testing Guide](docs/security/STACKHAWK_TESTING_GUIDE.md)** - Comprehensive security testing
- **[StackHawk Quick Reference](docs/security/STACKHAWK_QUICK_REFERENCE.md)** - Command cheat sheet
- **[Security Audit](docs/security/SECURITY_AUDIT.md)** - Audit findings and recommendations
- **[Security Headers](docs/security/SECURITY_HEADERS_QUICK_REF.md)** - HTTP security headers

### Guides
- **[Docker Guide](docs/guides/DOCKER_GUIDE.md)** - Docker setup and deployment
- **[Model Fallback Reference](docs/guides/MODEL_FALLBACK_REFERENCE.md)** - AI model hierarchy
- **[Next Steps](docs/guides/NEXT_STEPS.md)** - Project roadmap
- **[Use Case Clarification](docs/guides/USE_CASE_CLARIFICATION.md)** - System requirements

### OpenSpec & Development
- **[openspec/project.md](openspec/project.md)** - Complete project specification
- **[openspec/AGENTS.md](openspec/AGENTS.md)** - OpenSpec workflow guide
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI agent instructions
- **[Project-context/GAIA-Manuscript.docx.md](Project-context/GAIA-Manuscript.docx.md)** - Academic context

### Implementation Archives
- **[Implementation Logs](docs/implementation/archive/)** - Completed milestones and implementation logs

## License

[To be determined]

## Contact

[To be determined]
