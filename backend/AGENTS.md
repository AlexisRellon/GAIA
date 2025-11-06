# Backend Agent Instructions

## Context
You are working in the **backend** directory of the GAIA project. This handles AI/ML pipeline, data processing, and API services for hazard detection.

## Quick Navigation

### 🎯 Primary Instructions
**Start here**: `COPILOT_INSTRUCTIONS.md` - Complete backend MCP tools guide

### 📚 Additional Resources
- **Project Overview**: `../.github/copilot-instructions.md` - Full GAIA architecture and conventions
- **Full-Stack Workflows**: `../.github/copilot-mcp-workflows.md` - Cross-stack integration patterns
- **MCP Tools Reference**: `../.github/copilot-mcp-tools.md` - All available MCP tools
- **OpenSpec Workflow**: `../openspec/AGENTS.md` - For major architectural changes

## Backend Tech Stack

### Core Technologies
- **Language**: Python 3.11+
- **API Framework**: FastAPI (planned) / Flask
- **AI/ML**: Transformers (Hugging Face), PyTorch
- **NLP**: spaCy, NLTK
- **Database**: PostgreSQL + PostGIS (via Supabase)
- **Async**: asyncio, aiohttp
- **Testing**: pytest, pytest-cov
- **Code Quality**: Black (formatter), pylint
- **Containerization**: Docker

### Environment
- **Development**: Docker Compose (`docker-compose up backend`)
- **Port**: 8000
- **Hot Reload**: Enabled via volume mounts
- **Service Name**: `backend` (use in internal communication)

## Primary MCP Tools for Backend

### 1. 🤗 Hugging Face MCP
**Use for**: AI model discovery and integration

**Quick Commands**:
```bash
@hf model_search query="climate zero-shot classification" task="zero-shot-classification"
@hf hub_repo_details repo_id="climatebert/distilroberta-base-climate-f"
@hf dataset_search query="Philippines disaster hazard"
@hf paper_search query="geospatial named entity recognition"
@hf doc_search query="transformers pipeline parameters"
```

**When to use**:
- Finding Climate-NLI models
- Searching for Geo-NER models (Philippine locations)
- Discovering disaster/hazard datasets
- Researching geospatial ML papers
- Getting Transformers API documentation

### 2. 🗄️ Supabase MCP
**Use for**: Database operations and backend infrastructure

**Quick Commands**:
```bash
@supabase execute_sql "SELECT version(), PostGIS_version();"
@supabase apply_migration name="create_hazards_table" query="..."
@supabase deploy_edge_function name="rss-aggregator" files=[...]
@supabase generate_typescript_types
@supabase get_advisors type="security"
```

**When to use**:
- Creating database schemas with PostGIS
- Executing geospatial queries
- Applying migrations
- Deploying Edge Functions
- Managing authentication
- Storing AI model outputs
- Setting up real-time channels

### 3. 📖 Context7 MCP
**Use for**: Up-to-date library documentation

**Quick Commands**:
```bash
@context7 resolve-library-id libraryName="transformers"
@context7 get-library-docs context7CompatibleLibraryID="/huggingface/transformers" topic="zero shot classification"
@context7 get-library-docs context7CompatibleLibraryID="/postgis/postgis" topic="spatial indexes"
```

**When to use**:
- Learning Transformers API
- Understanding PostGIS functions
- Working with FastAPI/Flask
- Implementing Supabase Python SDK
- Using spaCy/NLTK for NLP

### 4. 🔒 StackHawk MCP
**Use for**: API security testing

**Quick Commands**:
```bash
@stackhawk setup app_name="GAIA-Backend-API"
@stackhawk get-scan-instructions config_path="backend/stackhawk.yml"
@stackhawk get-app-findings config_path="backend/stackhawk.yml"
@stackhawk search-vulnerabilities org_id="[org-id]" severity_filter="Critical"
```

**When to use**:
- Before deploying API endpoints
- Testing RSS aggregation security
- Validating citizen submission endpoints
- Checking authentication/authorization
- Ensuring OWASP compliance

## Module Focus Areas

### Core AI Pipeline
**Climate-NLI** → **Geo-NER** → **PostGIS Validation** → **Storage**

**Components**:
- Zero-shot hazard classification
- Philippine location extraction
- Geospatial boundary validation
- Confidence scoring

**Key Files**:
- `python/models/climate_nli.py`
- `python/models/geo_ner.py`
- `python/pipeline/hazard_pipeline.py`

### RSS Aggregation (EDI-01)
- Fetch from Philippine news outlets
- Parse RSS feeds
- Extract hazard-related articles
- Process through AI pipeline
- Schedule with cron/Edge Functions

**Key Files**:
- `supabase/functions/rss-aggregator/`
- `python/pipeline/rss_processor.py`

### Citizen Report Processing (CR-02, CR-03, CR-04)
- Validate reCAPTCHA tokens
- Process submissions (30% initial confidence)
- Extract hazard + location via AI
- Flag for manual triage if needed
- Store in database

**Key Files**:
- `supabase/functions/submit-citizen-report/`
- `python/api/routes.py`

### Geospatial Validation
- PostGIS boundary checks
- Philippine administrative divisions
- Coordinate geocoding
- Location name normalization

**Key Files**:
- `supabase/migrations/[timestamp]_create_boundaries.sql`
- `python/pipeline/geospatial_validator.py`

### Data Quality & Governance (DQG-0x)
- Duplicate detection
- Geocoding validation
- Confidence threshold management
- Data taxonomy

**Key Files**:
- `python/pipeline/data_quality.py`
- `python/utils/validators.py`

## Common Backend Workflows

### Workflow 1: Integrate New AI Model
```bash
# 1. Research models
@hf model_search query="[task]" task="[task-type]"
@hf paper_search query="[research-topic]"

# 2. Get model documentation
@hf hub_repo_details repo_id="[model-id]"
@hf doc_search query="transformers pipeline"

# 3. Get library docs
@context7 get-library-docs context7CompatibleLibraryID="/huggingface/transformers" topic="[topic]"

# 4. Implement model in python/models/
# 5. Add to requirements.txt
docker-compose run backend pip install [packages]

# 6. Test model
docker-compose run backend pytest tests/python/unit/ -v

# 7. Integrate with pipeline
# 8. Security scan
@stackhawk get-app-findings
```

### Workflow 2: Create Database Migration
```bash
# 1. Get PostGIS documentation
@context7 get-library-docs context7CompatibleLibraryID="/postgis/postgis" topic="[feature]"

# 2. Create migration
@supabase apply_migration name="[migration-name]" query="[SQL]"

# 3. Test migration
@supabase execute_sql "SELECT * FROM [table] LIMIT 5;"

# 4. Generate TypeScript types (for frontend)
@supabase generate_typescript_types

# 5. Check security
@supabase get_advisors type="security"
@supabase get_advisors type="performance"
```

### Workflow 3: Deploy Edge Function
```bash
# 1. Get Edge Function docs
@context7 get-library-docs context7CompatibleLibraryID="/supabase/supabase" topic="edge functions"

# 2. Implement function in supabase/functions/[name]/
# 3. Deploy
@supabase deploy_edge_function name="[function-name]" entrypoint_path="index.ts" files=[...]

# 4. Test function
curl -X POST https://[project].supabase.co/functions/v1/[function-name]

# 5. Security scan
@stackhawk get-app-findings
```

### Workflow 4: Optimize Geospatial Query
```bash
# 1. Get PostGIS best practices
@context7 get-library-docs context7CompatibleLibraryID="/postgis/postgis" topic="spatial indexes performance"

# 2. Analyze current query
@supabase execute_sql "EXPLAIN ANALYZE SELECT ..."

# 3. Apply optimizations (indexes, query restructuring)
@supabase apply_migration name="add_spatial_indexes" query="..."

# 4. Verify improvement
@supabase execute_sql "EXPLAIN ANALYZE SELECT ..."

# 5. Check performance advisors
@supabase get_advisors type="performance"
```

## Development Commands

```bash
# Start backend service
docker-compose up backend

# Install Python packages
docker-compose run backend pip install [package]

# Update requirements.txt
docker-compose run backend pip freeze > backend/python/requirements.txt

# Run all tests
docker-compose run backend pytest tests/python/ -v

# Run with coverage
docker-compose run backend pytest tests/python/ -v --cov=backend/python

# Run specific test file
docker-compose run backend pytest tests/python/unit/test_climate_nli.py -v

# Format code with Black
docker-compose run backend black backend/python/

# Lint code
docker-compose run backend pylint backend/python/

# Run security scan
docker-compose run backend hawk scan backend/stackhawk.yml

# Access Python shell
docker-compose run backend python

# Run migration
docker-compose run backend python backend/python/scripts/migrate.py
```

## Testing Checklist

Before committing backend code:

- [ ] **Unit Tests**: `pytest tests/python/unit/ -v --cov`
- [ ] **Integration Tests**: `pytest tests/python/integration/ -v`
- [ ] **Model Performance**: F1-score > 0.85 (Climate-NLI), Precision > 0.90 (Geo-NER)
- [ ] **Geospatial Validation**: All coordinates within Philippine boundaries
- [ ] **PostGIS Performance**: Queries < 100ms
- [ ] **Time-to-Action**: Pipeline processing < 5 minutes
- [ ] **Security Scan**: `@stackhawk get-app-findings`
- [ ] **Database Migrations**: Applied and tested
- [ ] **Code Quality**: Black formatted, no pylint errors
- [ ] **API Documentation**: Updated OpenAPI/Swagger

## File Structure

```
backend/
├── python/
│   ├── models/
│   │   ├── climate_nli.py       # Zero-shot hazard classification
│   │   └── geo_ner.py           # Philippine location extraction
│   ├── pipeline/
│   │   ├── hazard_pipeline.py   # Complete processing pipeline
│   │   ├── rss_processor.py     # RSS feed aggregation
│   │   └── geospatial_validator.py
│   ├── preprocessing/
│   │   └── text_cleaner.py      # Text preprocessing
│   ├── api/
│   │   └── routes.py            # API endpoints (FastAPI)
│   ├── utils/
│   │   └── validators.py
│   ├── main.py                  # Application entry point
│   └── requirements.txt         # Python dependencies
├── supabase/
│   ├── functions/
│   │   ├── rss-aggregator/      # RSS Edge Function
│   │   └── submit-citizen-report/
│   └── migrations/              # Database migrations
└── stackhawk.yml                # Security scan config
```

## Environment Variables

```bash
# backend/.env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_ANON_KEY=
HUGGING_FACE_TOKEN=
CONFIDENCE_THRESHOLD=0.7
BACKEND_URL=http://backend:8000
RECAPTCHA_SECRET_KEY=
```

## AI Model Guidelines

### Climate-NLI (Hazard Classification)
- **Task**: Zero-shot classification
- **Input**: Preprocessed text (news article, citizen report)
- **Output**: Hazard type + confidence score
- **Labels**: typhoon, flood, earthquake, landslide, volcanic eruption, drought, storm surge, fire
- **Target Performance**: F1-score > 0.85

**Key Considerations**:
- Code-switching (English/Tagalog mix)
- Philippine-specific terminology
- Confidence threshold (0.7 default)

### Geo-NER (Location Extraction)
- **Task**: Named Entity Recognition (token classification)
- **Input**: Preprocessed text
- **Output**: Location names + confidence scores
- **Focus**: Philippine administrative divisions (provinces, cities, municipalities)
- **Target Performance**: Precision > 0.90

**Key Considerations**:
- Homonyms (multiple "San Juan" locations)
- Informal place names
- Alternative spellings
- Must validate against PostGIS boundaries

## PostGIS Best Practices

1. **Always use spatial indexes**: `CREATE INDEX USING GIST(geom)`
2. **Validate coordinates**: Check against Philippine boundaries
3. **Use Geography type**: For accurate distance calculations
4. **Optimize queries**: Use `ST_DWithin` for radius searches
5. **Cache boundaries**: Load NAMRIA reference data once

## Common Pitfalls

1. ❌ **Don't hardcode credentials**
   - Use environment variables: `os.getenv("SUPABASE_URL")`

2. ❌ **Don't skip geospatial validation**
   - Always check coordinates against PostGIS boundaries

3. ❌ **Don't ignore confidence thresholds**
   - Route low-confidence predictions to manual triage

4. ❌ **Don't forget to log AI decisions**
   - Essential for audit trail and debugging

5. ❌ **Don't cache models incorrectly**
   - Load once at startup, reuse across requests

6. ❌ **Don't use blocking I/O in async code**
   - Use `asyncio` properly for concurrent processing

## Performance Targets

- **RSS Processing**: Process 100 articles in < 5 minutes
- **Citizen Report**: End-to-end processing < 10 seconds
- **API Response**: < 200ms for hazard queries
- **Database Queries**: < 100ms with spatial indexes
- **Model Inference**: Climate-NLI < 2s, Geo-NER < 1s per text

## Quick Links

- **Current Directory**: `/backend`
- **Frontend Guide**: `../frontend/AGENTS.md`
- **Root Navigation**: `../AGENTS.md`
- **Main Instructions**: `COPILOT_INSTRUCTIONS.md` ⭐

---

**When in doubt**: Open `COPILOT_INSTRUCTIONS.md` for detailed MCP tool workflows and complete code examples for AI pipeline implementation.
