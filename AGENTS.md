<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open @/openspec/AGENTS.md when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use @/openspec/AGENTS.md to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

<!-- GLOBAL RULESET:START -->

# Antigravity Global Rules

## Context Architecture: Graphify + lean-ctx (MCP)

Antigravity MUST utilize a dual-context strategy to navigate and modify this full-stack React, FastAPI, and Supabase workspace efficiently. Default to **Graphify MCP** tools for system-wide architectural mapping and **lean-ctx MCP** tools for token-efficient file inspection, knowledge tracking, and shell execution. Never rely on native, uncompressed terminal commands or basic file readers.

### Context Routing Strategy

1. **Map Before Reading (Graphify MCP):** ALWAYS query Graphify (`query_graph`, `get_node`, `get_impact_radius`) to understand cross-file dependencies, database schemas, and blast radius *before* opening any files. Never read a file blindly if its relationship to the broader system is unknown.
2. **File Inspection (lean-ctx MCP):** Once targets are identified via Graphify, use the `lean_ctx_read` tool to inspect them.
    * Use the `signatures` or `map` read mode for reviewing API surfaces and dependency structures.
    * Use the `full` read mode **only** immediately before making file edits to ensure the latest content is cached in the context buffer.
    * Use the `lines:N-M` read mode for targeted reading when the exact location is already known.
3. **Boundary Crossing:** When modifying API contracts (e.g., updating a FastAPI route that queries Supabase), use Graphify to identify the exact frontend React components affected, then use `lean_ctx_read` (mode: `full`) exclusively on those specific files to implement changes.

### Tool Mappings

| Objective | Instead of | Use | Example / Syntax |
| :--- | :--- | :--- | :--- |
| **System Discovery & Architecture** | Grepping for imports, guessing relationships | **Graphify MCP Tools** | `query_graph(query="trace connection between React LoginForm and Supabase auth")` |
| **Reading Code / File Inspection** | Native file readers (`view_file`, `cat`) | **`lean_ctx_read`** | `lean_ctx_read(file="api/routes.py", mode="signatures")` |
| **Targeted Text Search** | Native `grep_search` | **`lean_ctx_grep`** | `lean_ctx_grep(pattern="def process_hazard", path="src/")` |
| **Shell Execution / Build Tools** | Native `run_command` or terminal | **`lean_ctx_shell`** | `lean_ctx_shell(command="npm run build")` |

### Session Lifecycle Management

- **Start:** Begin every task by calling `lean_ctx_session_status` and using Graphify to retrieve the overarching project architecture related to the goal.
- **Workflow:** Set active task focus using `lean_ctx_session_task` and record tactical discoveries via `lean_ctx_session_finding`.
- **Sync:** If the workflow adds new files, alters database schemas, or changes endpoint structures, ensure the graph is updated (e.g., via `lean_ctx_shell` running `graphify index`) to keep the property graph synchronized.
- **Permanent Knowledge:** Persist immutable architectural facts and system constraints using `lean_ctx_knowledge_remember` and retrieve them using `lean_ctx_knowledge_search`.

<!-- GLOBAL RULESET:END -->

---

# AGAILA: Geospatial AI-driven Assessment - Copilot Instructions

## Project Overview
AGAILA (A Framework Integrating Zero-Shot Classification and Geo-NER for Natural Hazard Detection) is a Philippine-focused environmental hazard detection system. It leverages Zero-Shot Classification (ZSC) via large language models (e.g., DeBERTa-MNLI, ClimateNLI) and Geospatial Named Entity Recognition (Geo-NER) to automatically detect and locate natural hazards from online information streams (RSS feeds, news articles, citizen reports) and real-time PWA map visualization.AGAILA reduces the "Time-to-Action" during crises by providing near real-time, geocoded environmental intelligence for LGUs, NDRRMC, and emergency responders.


**CRITICAL DEVELOPMENT CONTEXT**: All development is conducted within Docker containers. Every feature, proposal, and implementation must account for:
- Docker Compose orchestration of services (backend, frontend, Supabase)
- Container-based networking (use service names, not localhost)
- Volume mounts for live code reload during development
- Environment variable configuration via \docker-compose.yml\ and \.env\ files
- Containerized testing workflows (\pytest\, \
pm test\ run inside containers)
- Heroku deployment using Docker containers (Heroku Container Registry)

## Architecture
- **Data Ingestion Layer**: RSS aggregates, Citizen submissions, Reference data.
- **Core Processing Layer**: Preprocessing -> Climate-NLI (hazard type) -> Geo-NER (location) -> PostGIS Validation.
- **Presentation Layer**: React / Tailwind / Leaflet PWA with real-time UI.

## Module Codes (For branches/commits)
- \AUTH-0x\: Authentication/Registration
- \CD-01\: Dashboard/Command Interface
- \GV-0x\: Geospatial Visualization
- \FP-0x\: Filtering Panel
- \RG-0x\: Report Generation
- \AC-0x\: Admin Console
- \CR-0x\: Citizen Report
- \UM-0x\: User Management
- \AAM-0x\: Advanced Analytics
- \EDI-0x\: External Data Integration

## OpenSpec Workflow
When starting new features: check [MODULE_CHECKLIST.md](MODULE_CHECKLIST.md) and [openspec/project.md](openspec/project.md). Create change proposals under [openspec/changes/](openspec/changes/).

## Documentation Guidelines
Create docs in [docs/](docs/) ([docs/setup/](docs/setup/), [docs/security/](docs/security/), [docs/implementation/archive/](docs/implementation/archive/), [docs/research/](docs/research/), [docs/guides/](docs/guides/)). Update [docs/README.md](docs/README.md). No new files in root (except MODULE_CHECKLIST.md, README.md, and AGENTS.md).

## MCP Tools Integration
- **Upstash Context7 MCP**: Up-to-date SDK docs (Supabase, Leaflet, PostGIS, Transformers, FastAPI).
- **Supabase MCP**: Deploy edge functions, manage migrations, execute SQL, generate TypeScript types.
- **Hugging Face MCP**: Model discovery & docs (DeBERTa-v3, Climate-NLI, spaCy-NER for Geo-NER).
- **StackHawk MCP**: Security scanning for API endpoints (DAST scans).
- **GitHub MCP**: Issue/PR management, commit automation, branch operations.
- **Figma MCP** (optional): Connect designs to React components.

## Testing & Build Commands
### Docker Environment
```bash
# Run Python tests in container
docker-compose run backend pytest tests/python/ --cov=backend/python

# Run frontend tests in container
docker-compose run frontend npm test --coverage

# Test Docker builds before deployment
docker build -f Dockerfile.backend -t gaia-backend .
docker build -f Dockerfile.frontend -t gaia-frontend .
```

See [backend/AGENTS.md](backend/AGENTS.md) and [frontend/AGENTS.md](frontend/AGENTS.md) for detailed domain instructions.
