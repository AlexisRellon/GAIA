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
cd TerraSentinel

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

```
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

```powershell
# Python tests
pytest tests/python/ --cov=backend/python

# Frontend tests
cd frontend
npm test

# Coverage
npm run test:coverage
```

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

- `openspec/project.md` - Complete project documentation
- `openspec/AGENTS.md` - OpenSpec workflow guide
- `.github/copilot-instructions.md` - AI agent instructions
- `Project-context/GAIA-Manuscript.docx.md` - Academic context

## License

[To be determined]

## Contact

[To be determined]
