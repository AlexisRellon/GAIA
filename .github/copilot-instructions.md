# GAIA: Geospatial AI-driven Assessment - Copilot Instructions

## Project Overview
GAIA is a Philippine-focused environmental hazard detection system using Zero-Shot Classification (Climate-NLI) and Geo-NER to process RSS feeds and citizen reports, visualizing hazards on a real-time PWA map.

**CRITICAL DEVELOPMENT CONTEXT**: All development is conducted within Docker containers. Every feature, proposal, and implementation must account for:
- Docker Compose orchestration of services (backend, frontend, Supabase)
- Container-based networking (use service names, not localhost)
- Volume mounts for live code reload during development
- Environment variable configuration via docker-compose.yml and .env files
- Containerized testing workflows (pytest, npm test run inside containers)
- Heroku deployment using Docker containers (Heroku Container Registry)

## Architecture: Three-Tiered Pipeline

### 1. Data Ingestion Layer
- **RSS Aggregation**: Fetch from Philippine news outlets (GMA, ABS-CBN, Inquirer)
- **Citizen Submission**: Public API with reCAPTCHA, flags submissions as "Unverified" (30% confidence)
- **Reference Data**: Philippine administrative boundaries (provinces, cities, municipalities) from NAMRIA

### 2. Core Processing (AI Pipeline)
```
Text → Preprocessing (spaCy/NLTK) → Climate-NLI (hazard type) → Geo-NER (location) → PostGIS Validation → Output
```
**Critical**: Output format is `{Hazard Type, X, Y Coordinate, Confidence Score}`
- Only events within Philippine boundaries are processed
- Low confidence (<threshold) reports require manual triage (AC-04: Unverified Report Triage)

### 3. Presentation Layer (PWA)
- React + TailwindCSS + ShadCN UI frontend
- Leaflet/Mapbox for interactive mapping with marker clustering (GV-03)
- Real-time updates via Supabase Realtime
- Filtering: hazard type (FP-01), region (FP-02), time (FP-03), source (FP-04)

## Module Codes (Use in branch/commit names)
- `AUTH-0x`: Authentication/Registration
- `CD-01`: Dashboard/Command Interface
- `GV-0x`: Geospatial Visualization (map layers, markers, heatmaps)
- `FP-0x`: Filtering Panel (hazard/region/time/source selectors)
- `RG-0x`: Report Generation (CSV/GeoJSON export, PDF reports)
- `AC-0x`: Admin Console (logs, thresholds, triage, user management)
- `CR-0x`: Citizen Report (submission form, CAPTCHA, validation)
- `UM-0x`: User Management (RBAC: Master Admin, Validator, LGU Responder)
- `OB-0x`: Onboarding Process (system tour, training, setup checklist)
- `AAM-0x`: Advanced Analytics & Predictive (trend analysis, vulnerability layers, KPI dashboard)
- `EDI-0x`: External Data Integration (weather alerts, social media, critical assets)
- `SHM-0x`: System Health & Maintenance (backups, monitoring, updates, status page)
- `DQG-0x`: Data Quality & Governance (duplicate detection, geocoding validation, taxonomy)

## Development Workflow (OpenSpec-Driven)

### Before Any Feature Work
1. **Remember**: All work happens in Docker containers - design accordingly
2. **Check MODULE_CHECKLIST.md**: Read `MODULE_CHECKLIST.md` to see implementation status and avoid duplicate work
3. Check `openspec/project.md` for tech stack and conventions
4. Run `openspec spec list --long` to see existing capabilities
5. Run `openspec list` to check active changes
6. Ensure Docker Desktop is running (`docker ps` should succeed)

### Creating New Features
```bash
# 1. Create proposal under openspec/changes/[verb-led-id]/
# Example: openspec/changes/add-heatmap-layer/
mkdir -p openspec/changes/add-heatmap-layer/{specs/geospatial-viz}

# 2. Create proposal.md, tasks.md, and spec deltas
# Use ## ADDED|MODIFIED|REMOVED Requirements with #### Scenario: headers
# ALWAYS include Docker considerations:
#   - Required dependencies (requirements.txt, package.json)
#   - Environment variables (docker-compose.yml, .env)
#   - Service communication patterns (container names)
#   - Volume mount requirements
#   - Container rebuild triggers

# 3. Validate before implementation
openspec validate add-heatmap-layer --strict

# 4. Branch naming: feature/GV-04-heatmap-density
```

### Key Workflows
- **Module Tracking**: ALWAYS update `MODULE_CHECKLIST.md` when starting (📋 → 🚧) or completing (🚧 → ✅) a module
- **Commits**: `feat(GV-02): add dynamic marker refresh`, `fix(CR-03): CAPTCHA timeout handling`
- **Testing**: Focus on AI model accuracy (F1-score), geospatial validation, Time-to-Action (TtA < 5 min)
- **Archiving**: After deployment, `openspec archive [change-id] --yes` moves to `changes/archive/`

## Tech Stack Specifics

### Supabase Integration
- **Database**: Cloud Supabase PostgreSQL with PostGIS extension (geospatial queries)
- **Auth**: Supabase Auth for email/password + social login (RBAC enforcement)
- **Storage**: Citizen-uploaded hazard images (CR-02)
- **Realtime**: Live hazard notifications pushed to PWA
- **Note**: GAIA uses cloud-hosted Supabase, not local Docker container

### AI/ML Pipeline
- **Climate-NLI**: Zero-shot hazard classification (replaces BART)
- **Geo-NER**: Custom model for extracting Philippine location names
- **Model Storage**: AI models stored in Supabase Storage (Climate-NLI, Geo-NER checkpoints)
- **Linguistic Challenges**: Code-switching (English/Tagalog), homonyms (multiple "San Juan"), informal place names

### Code Style
- **Python**: PEP 8, Black formatter (88 char max), `snake_case`
- **JavaScript**: ES6+, `const`/`let` only, `camelCase`, arrow functions
- **Files**: `kebab-case.py`, `PascalCase` for classes

## Critical Constraints
1. **Geographic Scope**: ONLY Philippine administrative boundaries. Validate all coordinates against PostGIS reference data.
2. **Confidence Thresholds**: Always display confidence scores. Route low-confidence predictions to manual triage (AC-04).
3. **Time-to-Action (TtA)**: Target < 5 minutes from RSS article publication to map marker display.
4. **Data Privacy**: Citizen reports are anonymous (no PII). Comply with RA 10173 (Philippine Data Protection Act).
5. **Human-in-the-Loop**: LGU Responders manually validate unverified citizen reports (CR-04).

## Common Pitfalls
- **Don't hardcode hazard types**: Use dynamic categories from database
- **Don't skip geospatial validation**: All locations MUST match PostGIS boundaries
- **Don't ignore confidence scores**: Display uncertainty to users
- **Don't bypass CAPTCHA**: Public forms (CR-01) require reCAPTCHA v3
- **Don't commit secrets**: Use environment variables in Docker, never hardcode credentials
- **Don't use localhost**: In containers, reference services by name (backend, frontend, supabase)
- **Don't forget container rebuilds**: When adding dependencies, run `docker-compose up --build`
- **Don't test outside containers**: Always run tests using `docker-compose run` commands
- **Don't ignore volume mounts**: Code changes auto-reload; dependency changes need rebuild
## Documentation Guidelines

**CRITICAL**: All new documentation MUST be placed in the `docs/` directory structure:

### Documentation Categories

1. **Setup & Configuration** → `docs/setup/`
   - Database setup guides
   - Environment configuration
   - Installation instructions
   - Initial project setup

2. **Security & Testing** → `docs/security/`
   - Security audit reports
   - StackHawk scan configurations
   - Security best practices
   - Vulnerability fixes

3. **Implementation Logs** → `docs/implementation/archive/`
   - Completion reports (files ending in `_COMPLETE.md`)
   - Milestone documentation
   - Historical implementation records

4. **Research & Analysis** → `docs/research/`
   - Integration analysis
   - Research findings
   - Technical investigations

5. **How-To Guides** → `docs/guides/`
   - Docker deployment guides
   - Feature implementation guides
   - Reference documentation
   - Best practices

### Documentation Rules

- **NEVER** create documentation files in the project root
- **ALWAYS** use the appropriate `docs/` subdirectory
- **UPDATE** `docs/README.md` when adding new documentation
- **LINK** from main `README.md` only if essential for getting started
- Use descriptive filenames with UPPERCASE for markdown: `FEATURE_IMPLEMENTATION.md`
- After feature completion, move `*_COMPLETE.md` files to `docs/implementation/archive/`

### Example: Creating New Documentation

```bash
# ❌ WRONG - Do not create in root
touch NEW_FEATURE.md

# ✅ CORRECT - Use appropriate docs subdirectory
touch docs/guides/NEW_FEATURE_GUIDE.md
# Then update docs/README.md with entry
```

## Key Files
- `MODULE_CHECKLIST.md`: Implementation status tracker - **READ/UPDATE BEFORE AND AFTER MODULE WORK**
- `docs/README.md`: Complete documentation index - **UPDATE WHEN ADDING NEW DOCS**
- `openspec/project.md`: Complete tech stack, conventions, dependencies
- `openspec/AGENTS.md`: Full OpenSpec workflow for proposals/specs
- `Project-context/GAIA-modules.md`: Module codes and descriptions
- `Project-context/GAIA-Manuscript.docx.md`: Academic context and methodology
- `docker-compose.yml`: Local development service orchestration
- `Dockerfile.backend`: Production backend container definition
- `Dockerfile.frontend`: Production frontend container definition
- `heroku.yml`: Heroku deployment configuration
- `.dockerignore`: Docker build exclusion rules

## MCP Tools Integration

### When to Use MCP Tools

#### Figma MCP (`figma-mcp`)
- **Design-to-Code**: Convert Figma designs to React components for PWA frontend
- **UI Prototyping**: Extract design tokens, colors, spacing from Figma files
- **Component Generation**: Generate TailwindCSS classes from Figma styles
- **Example**: `@figma get-design-context [node-id]` for map marker designs

#### Hugging Face MCP (`hf-mcp-server`)
- **Model Discovery**: Search for Climate-NLI, NER, or geospatial models
- **Model Documentation**: Fetch usage examples for Climate-NLI/Geo-NER integration
- **Dataset Search**: Find Philippine disaster/hazard training datasets
- **Example**: `@hf model_search query="climate NLI" task="zero-shot-classification"`

#### StackHawk MCP (`stackhawk/stackhawk-mcp`)
- **Security Scanning**: Run security tests on API endpoints (RSS aggregation, citizen submission)
- **Vulnerability Detection**: Scan for OWASP Top 10 in PWA and backend
- **Compliance Checks**: Verify RA 10173 (Data Protection Act) compliance
- **Example**: `@stackhawk get_app_findings_for_triage` for security triage

#### Supabase MCP (`supabase`)
- **Database Operations**: Query PostGIS for geospatial validation
- **Schema Management**: Apply migrations for hazard types, user roles
- **Edge Functions**: Deploy RSS aggregation or AI processing functions
- **Real-time**: Set up live hazard notification channels
- **Example**: `@supabase execute_sql "SELECT * FROM hazards WHERE ST_Within(coordinates, philippine_bounds)"`

#### Upstash Context7 MCP (`upstash/context7`)
- **Documentation Lookup**: Fetch up-to-date docs for Supabase, Leaflet, Climate-NLI
- **Library Integration**: Get code examples for PostGIS queries, Mapbox integration
- **Example**: `@upstash get-library-docs context7CompatibleLibraryID="/supabase/supabase" topic="PostGIS"`

### MCP Tool Usage Patterns
- Use Figma MCP when implementing UI components (GV-0x, FP-0x, CR-0x modules)
- Use Hugging Face MCP when working on AI pipeline (Climate-NLI, Geo-NER)
- Use StackHawk MCP before deploying features with public endpoints
- Use Supabase MCP for all database operations and backend logic
- Use Upstash Context7 MCP when unclear about library usage or API changes

## Directory Structure
```
backend/
  python/           # AI/ML pipeline (Climate-NLI, Geo-NER)
  supabase/         # Edge Functions, database migrations
frontend/
  src/              # React + TailwindCSS PWA
  public/           # Static assets, PWA manifest
tests/
  python/           # Pytest for AI models
  frontend/         # Jest for React components
docker/
  backend/          # Backend Docker configuration
## Testing Commands

### Local (without Docker)
```bash
# Python AI/ML tests
pytest tests/python/ --cov=backend/python

# Frontend tests
npm test --coverage

# End-to-end testing
npm run test:e2e
```

### Docker Environment
```bash
# Run Python tests in container
docker-compose run backend pytest tests/python/ --cov=backend/python

# Run frontend tests in container
docker-compose run frontend npm test --coverage

# Test Docker builds before deployment
docker build -f Dockerfile.backend -t gaia-backend .
docker build -f Dockerfile.frontend -t gaia-frontend .
```python AI/ML tests
pytest tests/python/ --cov=backend/python

# Frontend tests
npm test --coverage

# End-to-end testing
npm run test:e2e
```

## Deployment

### Production Deployment (Heroku)
- **Platform**: Heroku with Docker containers
- **Backend**: Deploy Python AI/ML pipeline as Docker container
- **Frontend**: Deploy React PWA as static build or Docker container
- **Database**: Supabase (managed PostgreSQL/PostGIS) - external to Heroku
- **Container Registry**: Heroku Container Registry
- **CI/CD**: GitHub Actions → Docker build → Heroku deploy

### Local Development (Docker)
- **Docker Compose**: Orchestrate backend, frontend, and Supabase services
- **Hot Reload**: Volume mounts for live code changes
- **Services**:
  - `backend`: Python AI/ML pipeline (port 8000)
  - `frontend`: React dev server (port 3000)
  - `supabase`: Local Supabase stack (PostgreSQL + PostGIS)
- **Commands**:
  ```bash
  # Start all services
  docker-compose up
  
  # Rebuild after dependency changes
  docker-compose up --build
  
  # Stop all services
  docker-compose down
  ```

### Docker Configuration Files
- `Dockerfile.backend` - Python AI/ML service
- `Dockerfile.frontend` - React PWA build
- `docker-compose.yml` - Local development orchestration
- `.dockerignore` - Exclude unnecessary files from builds
- `heroku.yml` - Heroku deployment configuration
