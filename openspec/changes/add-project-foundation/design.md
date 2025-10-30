## Context

GAIA is a greenfield project requiring a comprehensive development environment setup. The system integrates multiple technologies:
- Python-based AI/ML pipeline (Climate-NLI for zero-shot classification, custom Geo-NER)
- React PWA frontend with geospatial visualization
- Supabase backend (PostgreSQL/PostGIS, Auth, Storage, Realtime)
- Real-time RSS feed processing and citizen report ingestion

## Goals

- Establish a reproducible development environment for all team members
- Configure all required dependencies for the three-tiered architecture
- Enable immediate feature development without setup blockers
- Ensure code quality through automated tooling (linters, formatters, tests)

## Non-Goals

- Deployment configuration (AWS/Azure/GCP TBD)
- Production-ready CI/CD pipelines (separate change)
- Complete AI model training infrastructure
- RSS feed scraper implementation (feature work, not foundation)

## Technical Decisions

### Python Environment Management
**Decision**: Use `venv` for virtual environment isolation
**Rationale**: Standard library solution, widely supported, no additional dependencies
**Alternatives**: Poetry (adds complexity), Conda (heavyweight for our needs)

### Frontend Framework
**Decision**: Create React App with TypeScript
**Rationale**: 
- TypeScript provides type safety for complex geospatial data structures
- CRA handles PWA configuration out-of-box
- Well-documented, battle-tested for production PWAs
**Alternatives**: Next.js (overkill for client-heavy app), Vite (less PWA tooling)

### Package Management
**Decision**: npm for frontend, pip for backend
**Rationale**: Standard tools, good ecosystem support, team familiarity
**Alternatives**: Yarn/pnpm (marginal benefits), pipenv (adds abstraction layer)

### Code Formatting
**Decision**: Black (Python), Prettier via ESLint (JavaScript)
**Rationale**: Opinionated formatters eliminate bikeshedding, auto-fixable in CI
**Configuration**: Black 88-char line length (PEP 8 compatible)

### Geospatial Library Choice
**Decision**: Start with Leaflet, keep Mapbox as optional upgrade
**Rationale**:
- Leaflet is open-source, zero licensing costs
- Simpler API for basic marker rendering and clustering
- Mapbox can be added later if advanced features needed (GL rendering, 3D terrain)
**Trade-off**: Leaflet has less smooth animations than Mapbox GL JS

### Supabase Local Development
**Decision**: Use Supabase CLI with local Docker containers
**Rationale**:
- Enables offline development
- Identical local/production schema via migrations
- Free tier limits avoided during development
**Requirements**: Docker Desktop must be installed and running

## Directory Structure Rationale

```
backend/
  python/           # AI/ML pipeline isolated from infrastructure
    models/         # Climate-NLI, Geo-NER model loading
    preprocessing/  # Text cleaning, tokenization
    pipeline/       # End-to-end RSS → hazard classification
  supabase/
    functions/      # Edge Functions (RSS aggregation, webhooks)
    migrations/     # Database schema versions
frontend/
  src/
    components/     # Reusable React components (Map, FilterPanel)
    pages/          # Route-level components (Dashboard, AdminConsole)
    services/       # API clients (Supabase, geospatial utilities)
    hooks/          # Custom React hooks (useHazards, useGeolocation)
tests/
  python/
    unit/           # Model accuracy, preprocessing logic
    integration/    # Pipeline end-to-end tests
  frontend/
    components/     # Component unit tests
    e2e/            # Playwright/Cypress (future)
```

**Key Principle**: Separation between AI pipeline (Python) and infrastructure (Supabase) allows independent scaling and deployment.

## Dependencies Breakdown

### Python Core (AI/ML)
```
transformers==4.35.0      # Hugging Face for Climate-NLI
torch==2.1.0              # PyTorch backend for transformers
spacy==3.7.2              # NER and text preprocessing
nltk==3.8.1               # Tokenization, stopwords
scikit-learn==1.3.2       # Model evaluation metrics
numpy==1.24.3             # Numerical operations
pandas==2.1.3             # Data manipulation
```

### Python Infrastructure
```
supabase==2.0.0           # Supabase Python client
psycopg2-binary==2.9.9    # PostgreSQL adapter
python-dotenv==1.0.0      # Environment variable management
requests==2.31.0          # RSS feed fetching
feedparser==6.0.10        # RSS/Atom parsing
```

### Frontend Core
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.2.2",
  "react-router-dom": "^6.20.0"
}
```

### Frontend UI/Styling
```json
{
  "tailwindcss": "^3.3.5",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.31"
}
```

### Frontend Geospatial
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.8"
}
```

### Frontend Backend Integration
```json
{
  "@supabase/supabase-js": "^2.38.4",
  "google-recaptcha": "^3.1.0"
}
```

## Risks & Mitigations

### Risk: Python dependency conflicts (transformers vs spaCy)
**Likelihood**: Medium  
**Impact**: High (blocks AI pipeline development)  
**Mitigation**: Pin exact versions in requirements.txt, use venv isolation, test install order

### Risk: Large AI model downloads (Climate-NLI ~500MB)
**Likelihood**: High  
**Impact**: Low (one-time setup delay)  
**Mitigation**: Document expected download times, provide Supabase Storage fallback for pre-downloaded models

### Risk: Supabase local Docker resource usage
**Likelihood**: Medium  
**Impact**: Medium (slow development machines)  
**Mitigation**: Document minimum RAM requirements (8GB), provide cloud dev database option

### Risk: CRA webpack build times for large app
**Likelihood**: Low (early stage)  
**Impact**: Medium (developer productivity)  
**Mitigation**: Monitor bundle size, consider Vite migration if build times exceed 30s

## Migration Plan

N/A - Greenfield project, no existing code to migrate.

## Open Questions

1. **Hugging Face Model Hosting**: Should Climate-NLI model be downloaded from Hugging Face Hub or pre-stored in Supabase Storage?
   - **Recommendation**: Start with Hub (always latest), add Supabase caching if bandwidth becomes issue

2. **Philippine Administrative Boundaries Data**: Where to source the official GeoJSON/Shapefile?
   - **Recommendation**: NAMRIA (National Mapping and Resource Information Authority) - need to research API/download options

3. **Development vs Production Supabase Projects**: Separate projects or branches?
   - **Recommendation**: Separate projects (free tier sufficient), branches for feature testing

4. **TypeScript Strictness**: Enable strict mode immediately or gradually?
   - **Recommendation**: Start strict (`"strict": true`), prevents technical debt accumulation
