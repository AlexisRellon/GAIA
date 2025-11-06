# GAIA MCP Tools Integration Guide

## Overview
This guide provides specialized instructions for using Model Context Protocol (MCP) tools to accelerate development across the GAIA project. MCP tools integrate external services directly into your development workflow.

## Available MCP Tools

### 1. Figma MCP (`figma-mcp`)
**Purpose**: Convert Figma designs to production-ready React components

**Key Capabilities**:
- Extract design context from Figma nodes
- Generate React/TypeScript components with TailwindCSS
- Retrieve design tokens (colors, spacing, typography)
- Get component screenshots for reference
- Access Code Connect mappings

**When to Use**:
- Implementing new UI features (GV-0x, FP-0x, CR-0x modules)
- Creating map markers, dialogs, forms
- Building dashboard layouts
- Designing data visualization components

**Workflow Pattern**:
```
1. Get Figma node ID from design file URL
2. Use mcp_figma-mcp_get_design_context to extract design
3. Use mcp_shadcn_search_items_in_registries to find matching components
4. Use mcp_shadcn_get_add_command_for_items to install components
5. Generate component code with design tokens
6. Test in ComponentShowcase.tsx
```

**Example Commands**:
```typescript
// Extract design from Figma
@figma get-design-context nodeId="123:456"

// Get variable definitions (colors, spacing)
@figma get-variable-defs nodeId="123:456"

// Generate screenshot for reference
@figma get-screenshot nodeId="123:456"
```

### 2. ShadCN MCP (`shadcn`)
**Purpose**: Discover and integrate ShadCN UI components

**Key Capabilities**:
- Search component registry
- Get component examples with full code
- Generate CLI commands to install components
- View component specifications
- Access usage demos

**When to Use**:
- Building forms (Citizen Report, Admin Console)
- Creating data tables (Hazard List, User Management)
- Implementing dialogs and modals
- Adding navigation tabs

**Workflow Pattern**:
```
1. Search for component: mcp_shadcn_search_items_in_registries
2. View examples: mcp_shadcn_get_item_examples_from_registries
3. Get install command: mcp_shadcn_get_add_command_for_items
4. Install: npx shadcn@latest add [component]
5. Import and customize in your feature
```

**Example Commands**:
```bash
# Search for components
@shadcn search query="data table" registries=['@shadcn']

# Get usage examples
@shadcn get-examples query="table-demo" registries=['@shadcn']

# Get install command
@shadcn get-add-command items=['@shadcn/table', '@shadcn/dialog']
```

### 3. Hugging Face MCP (`hf-mcp-server`)
**Purpose**: Discover and integrate AI/ML models

**Key Capabilities**:
- Search models by task (zero-shot classification, NER)
- Find datasets for training/fine-tuning
- Search research papers
- Get model/dataset documentation
- Access usage examples

**When to Use**:
- Implementing Climate-NLI integration
- Finding Geo-NER models for Philippine locations
- Searching for disaster/hazard datasets
- Researching geospatial ML papers
- Evaluating model alternatives

**Workflow Pattern**:
```
1. Search models: mcp_hf-mcp-server_model_search
2. Get model details: mcp_hf-mcp-server_hub_repo_details
3. Search related papers: mcp_hf-mcp-server_paper_search
4. Find training datasets: mcp_hf-mcp-server_dataset_search
5. Fetch documentation: mcp_hf-mcp-server_hf_doc_search
6. Implement model integration
```

**Example Commands**:
```python
# Search for Climate-NLI models
@hf model_search query="climate zero-shot classification" task="zero-shot-classification"

# Find Philippine disaster datasets
@hf dataset_search query="Philippines disaster typhoon flood"

# Search papers on geospatial NER
@hf paper_search query="named entity recognition geospatial locations"

# Get model documentation
@hf hub_repo_details repo_id="facebook/bart-large-mnli"
```

### 4. StackHawk MCP (`stackhawk/stackhawk-mcp`)
**Purpose**: Security testing and vulnerability detection

**Key Capabilities**:
- Set up security scanning configuration
- Run DAST scans on API endpoints
- Get vulnerability findings for triage
- Search for security issues
- Map sensitive data exposure
- Analyze security trends

**When to Use**:
- Before deploying new API endpoints
- After implementing citizen submission forms
- Testing RSS aggregation security
- Validating authentication flows
- Scanning admin console access
- Ensuring RA 10173 compliance

**Workflow Pattern**:
```
1. Set up: mcp_stackhawk_sta_setup_stackhawk_for_project
2. Configure: Create/update stackhawk.yml
3. Run scan: mcp_stackhawk_sta_get_stackhawk_scan_instructions
4. Review findings: mcp_stackhawk_sta_get_app_findings_for_triage
5. Fix vulnerabilities
6. Re-scan to verify
```

**Example Commands**:
```bash
# Set up StackHawk
@stackhawk setup app_name="GAIA" org_id="your-org-id"

# Get scan instructions
@stackhawk get-scan-instructions config_path="stackhawk.yml"

# Get critical findings
@stackhawk get-app-findings config_path="stackhawk.yml"

# Search vulnerabilities
@stackhawk search-vulnerabilities org_id="your-org-id" severity_filter="High"
```

### 5. Supabase MCP (`supabase`)
**Purpose**: Database operations and backend infrastructure

**Key Capabilities**:
- Execute SQL queries (PostGIS geospatial)
- Apply database migrations
- Deploy Edge Functions
- Manage development branches
- List tables, extensions, migrations
- Generate TypeScript types
- Get security advisors

**When to Use**:
- Creating database schemas (hazards, users, reports)
- Implementing geospatial queries (PostGIS)
- Deploying RSS aggregation functions
- Setting up real-time subscriptions
- Managing user authentication
- Storing AI model outputs

**Workflow Pattern**:
```
1. Design schema with PostGIS
2. Create migration: mcp_supabase_apply_migration
3. Test query: mcp_supabase_execute_sql
4. Generate types: mcp_supabase_generate_typescript_types
5. Deploy Edge Function: mcp_supabase_deploy_edge_function
6. Check security: mcp_supabase_get_advisors
```

**Example Commands**:
```sql
-- Execute geospatial query
@supabase execute_sql "
  SELECT * FROM hazards 
  WHERE ST_Within(
    coordinates, 
    (SELECT geom FROM philippine_boundaries WHERE name = 'Metro Manila')
  )
"

-- Apply migration
@supabase apply_migration name="add_hazard_confidence_threshold" query="
  ALTER TABLE hazards ADD COLUMN confidence_threshold DECIMAL DEFAULT 0.7;
"

-- Deploy Edge Function
@supabase deploy_edge_function name="rss-aggregator" files=[...]

-- Get security advisors
@supabase get_advisors type="security"
```

### 6. Upstash Context7 MCP (`upstash/context7`)
**Purpose**: Access up-to-date library documentation

**Key Capabilities**:
- Resolve library IDs from package names
- Fetch comprehensive documentation
- Get code examples for specific topics
- Access API references

**When to Use**:
- Learning new library APIs (Leaflet, Mapbox)
- Understanding Supabase PostGIS functions
- Implementing React hooks patterns
- Working with TailwindCSS utilities
- Integrating third-party APIs

**Workflow Pattern**:
```
1. Resolve library: mcp_upstash_conte_resolve-library-id
2. Get docs: mcp_upstash_conte_get-library-docs
3. Apply to implementation
4. Reference for troubleshooting
```

**Example Commands**:
```bash
# Resolve library ID
@context7 resolve-library-id libraryName="leaflet"

# Get documentation
@context7 get-library-docs context7CompatibleLibraryID="/leaflet/leaflet" topic="markers and popups"

# Get Supabase PostGIS docs
@context7 get-library-docs context7CompatibleLibraryID="/supabase/supabase" topic="PostGIS geospatial queries"
```

## Integration Workflows

### Workflow 1: Figma Design → Production Code
**Use Case**: Implementing dashboard map component (GV-01)

```
Step 1: Extract Figma Design
- Get node ID from Figma URL
- @figma get-design-context nodeId="789:101"
- Review component structure and styles

Step 2: Find Matching ShadCN Components
- @shadcn search query="card map container" registries=['@shadcn']
- @shadcn get-examples query="card-demo" registries=['@shadcn']

Step 3: Install Dependencies
- @shadcn get-add-command items=['@shadcn/card']
- Run: docker-compose run frontend npx shadcn@latest add card

Step 4: Generate Component Code
- Create src/components/map/HazardMap.tsx
- Apply Figma design tokens (colors, spacing)
- Integrate Leaflet map library

Step 5: Get Documentation
- @context7 get-library-docs context7CompatibleLibraryID="/leaflet/leaflet" topic="interactive markers"

Step 6: Test in Showcase
- Add to ComponentShowcase.tsx
- Run: docker-compose up frontend
```

### Workflow 2: AI Model Integration → Backend
**Use Case**: Integrating Climate-NLI model (Core Pipeline)

```
Step 1: Search for Models
- @hf model_search query="climate natural language inference" task="zero-shot-classification"
- Review model cards and performance metrics

Step 2: Find Training Datasets
- @hf dataset_search query="climate hazards disaster classification"
- @hf paper_search query="zero-shot climate event detection"

Step 3: Get Model Documentation
- @hf hub_repo_details repo_id="climatebert/distilroberta-base-climate-f"
- @hf doc_search query="transformers zero shot classification pipeline"

Step 4: Implement in Backend
- Create backend/python/models/climate_nli.py
- Install dependencies: transformers, torch
- Load model in Docker container

Step 5: Get Supabase Storage
- @supabase execute_sql "CREATE TABLE model_cache (...)"
- Store model checkpoints in Supabase Storage

Step 6: Test Model Output
- Run: docker-compose run backend pytest tests/python/unit/test_climate_nli.py
```

### Workflow 3: Full-Stack Feature with Security
**Use Case**: Citizen Report Submission (CR-01, CR-02, CR-03)

```
Step 1: Design UI in Figma → Code
- @figma get-design-context nodeId="[report-form-node]"
- @shadcn search query="form input textarea" registries=['@shadcn']
- Install form components

Step 2: Implement Backend Validation
- @supabase apply_migration name="create_citizen_reports_table"
- @supabase deploy_edge_function name="validate-report"

Step 3: Get Security Documentation
- @context7 get-library-docs context7CompatibleLibraryID="/supabase/supabase" topic="Row Level Security"
- Implement RLS policies for citizen_reports table

Step 4: Security Testing
- @stackhawk setup app_name="GAIA-Citizen-Reports"
- @stackhawk get-scan-instructions
- Run DAST scan on /api/reports endpoint

Step 5: Fix Vulnerabilities
- @stackhawk get-app-findings
- Review OWASP findings (SQL injection, XSS)
- Apply security patches

Step 6: Re-test and Deploy
- Run security scan again
- Merge to production branch
```

### Workflow 4: Geospatial Query Optimization
**Use Case**: Optimizing hazard location queries (Data Processing)

```
Step 1: Review Current Implementation
- @supabase execute_sql "EXPLAIN ANALYZE SELECT * FROM hazards WHERE ST_Within(...)"
- Identify slow queries

Step 2: Research PostGIS Best Practices
- @context7 get-library-docs context7CompatibleLibraryID="/postgis/postgis" topic="spatial indexes"
- @supabase search_docs query="spatial indexes performance"

Step 3: Apply Optimizations
- @supabase apply_migration name="add_spatial_indexes" query="CREATE INDEX idx_hazards_geom ON hazards USING GIST(coordinates)"

Step 4: Test Performance
- Re-run EXPLAIN ANALYZE
- Benchmark Time-to-Action (TtA < 5 min target)

Step 5: Check Security Impact
- @supabase get_advisors type="performance"
- @supabase get_advisors type="security"
```

## Best Practices

### 1. Always Start with Documentation
```bash
# Before implementing a feature, get context
@context7 resolve-library-id libraryName="[your-library]"
@context7 get-library-docs context7CompatibleLibraryID="/..." topic="[your-topic]"
```

### 2. Security-First Development
```bash
# Before deploying any public endpoint
@stackhawk get-scan-instructions
# After implementation
@stackhawk get-app-findings
```

### 3. Component Reuse Over Custom Code
```bash
# Search existing components first
@shadcn search query="[feature]" registries=['@shadcn']
# Then check Figma for design specs
@figma get-design-context nodeId="..."
```

### 4. Model Validation Before Integration
```bash
# Research model performance
@hf model_search query="[task]"
@hf paper_search query="[research topic]"
# Check datasets for fine-tuning
@hf dataset_search query="[domain-specific data]"
```

### 5. Database Safety
```bash
# Always test migrations
@supabase execute_sql "SELECT version();" # Test connection
@supabase apply_migration name="..." query="..."
@supabase get_advisors type="security" # Check RLS policies
```

## Docker Context Reminders

### All MCP Tool Usage Must Consider:
1. **Service Names**: Use `backend`, `frontend`, `supabase` instead of localhost
2. **Volume Mounts**: Code changes auto-reload; dependency changes need rebuild
3. **Environment Variables**: Configure in docker-compose.yml and .env
4. **Container Commands**:
   ```bash
   docker-compose run frontend npx shadcn@latest add [component]
   docker-compose run backend pip install [package]
   docker-compose up --build # After dependency changes
   ```

## Quick Reference

### Frontend Development
- **UI Design**: Figma MCP → ShadCN MCP
- **Documentation**: Context7 MCP
- **Security**: StackHawk MCP

### Backend Development
- **AI Models**: Hugging Face MCP
- **Database**: Supabase MCP
- **Documentation**: Context7 MCP
- **Security**: StackHawk MCP

### Cross-Stack
- **Security Testing**: StackHawk MCP (all endpoints)
- **Documentation**: Context7 MCP (all libraries)
- **Infrastructure**: Supabase MCP (auth, storage, realtime)

## Troubleshooting

### MCP Tool Not Available
```bash
# Check available tools
@help

# Activate tool category if needed
# Frontend: Figma, ShadCN automatically available
# Backend: Hugging Face, Supabase automatically available
```

### Connection Issues
```bash
# Verify Docker services running
docker ps

# Check environment variables
docker-compose config

# Restart services
docker-compose restart
```

### Documentation Not Found
```bash
# Try resolving library ID first
@context7 resolve-library-id libraryName="[package-name]"

# Use exact library ID from response
@context7 get-library-docs context7CompatibleLibraryID="/org/project"
```

## Module-Specific MCP Usage

### GV-0x (Geospatial Visualization)
- **Primary**: Figma MCP, ShadCN MCP, Context7 MCP (Leaflet/Mapbox)
- **Secondary**: Supabase MCP (geospatial queries)

### CR-0x (Citizen Report)
- **Primary**: Figma MCP, ShadCN MCP, StackHawk MCP
- **Secondary**: Supabase MCP (form validation)

### AC-0x (Admin Console)
- **Primary**: ShadCN MCP (tables, dialogs), StackHawk MCP
- **Secondary**: Supabase MCP (user management)

### Core AI Pipeline
- **Primary**: Hugging Face MCP, Supabase MCP
- **Secondary**: Context7 MCP (transformers library), StackHawk MCP

### Database Schema
- **Primary**: Supabase MCP
- **Secondary**: Context7 MCP (PostGIS), StackHawk MCP (security)

---

**Remember**: MCP tools accelerate development but don't replace critical thinking. Always:
1. Understand what the tool generates
2. Adapt to GAIA-specific requirements (Philippine boundaries, confidence scores)
3. Test thoroughly in Docker environment
4. Run security scans before deployment
5. Follow OpenSpec workflow for major changes
