## ADDED Requirements

### Requirement: Project Directory Structure
The system SHALL establish a standardized directory hierarchy separating backend AI/ML pipeline, Supabase infrastructure, frontend PWA, and test suites to enable independent development and deployment.

#### Scenario: Backend directory creation
- **GIVEN** a new development environment
- **WHEN** the project foundation is initialized
- **THEN** `backend/python/` directory SHALL exist for AI/ML code
- **AND** `backend/supabase/` directory SHALL exist for Edge Functions and migrations
- **AND** directory structure SHALL match the three-tiered architecture (Ingestion → Processing → Presentation)

#### Scenario: Frontend directory creation
- **GIVEN** a new development environment
- **WHEN** the project foundation is initialized
- **THEN** `frontend/src/` directory SHALL exist for React components
- **AND** `frontend/public/` directory SHALL exist for PWA static assets
- **AND** directory SHALL support TypeScript configuration

#### Scenario: Test directory isolation
- **GIVEN** a new development environment
- **WHEN** the project foundation is initialized
- **THEN** `tests/python/` directory SHALL exist for Pytest
- **AND** `tests/frontend/` directory SHALL exist for Jest
- **AND** test directories SHALL mirror source code structure for discoverability

### Requirement: Python Environment Configuration
The system SHALL provide a reproducible Python 3.9+ virtual environment with all AI/ML dependencies (Climate-NLI, spaCy, NLTK, scikit-learn) pinned to specific versions to prevent dependency conflicts.

#### Scenario: Virtual environment creation
- **GIVEN** Python 3.9+ is installed on the system
- **WHEN** developer runs `python -m venv venv`
- **THEN** isolated virtual environment SHALL be created in `venv/` directory
- **AND** `.gitignore` SHALL exclude `venv/` from version control

#### Scenario: Python dependency installation
- **GIVEN** a virtual environment is activated
- **WHEN** developer runs `pip install -r backend/python/requirements.txt`
- **THEN** all AI/ML dependencies SHALL install without conflicts
- **AND** transformers (Hugging Face) version SHALL be 4.35.0 or compatible
- **AND** spaCy version SHALL be 3.7.2 or compatible
- **AND** installation SHALL complete within 5 minutes on standard internet connection

#### Scenario: spaCy language model download
- **GIVEN** spaCy is installed
- **WHEN** developer runs `python -m spacy download en_core_web_sm`
- **THEN** English language model SHALL download successfully
- **AND** model SHALL be available for NLP preprocessing

### Requirement: React PWA Frontend Setup
The system SHALL provide a React 18+ application with TypeScript, TailwindCSS, PWA capabilities, and Leaflet/Mapbox integration configured for geospatial visualization.

#### Scenario: React app initialization
- **GIVEN** Node.js 18+ and npm are installed
- **WHEN** developer runs `npx create-react-app frontend --template typescript`
- **THEN** React app with TypeScript SHALL be created in `frontend/` directory
- **AND** development server SHALL start successfully on `http://localhost:3000`
- **AND** PWA service worker SHALL be configured in `frontend/src/serviceWorker.ts`

#### Scenario: TailwindCSS configuration
- **GIVEN** React app is initialized
- **WHEN** developer installs TailwindCSS via `npm install -D tailwindcss postcss autoprefixer`
- **THEN** `tailwind.config.js` SHALL be generated with content paths
- **AND** TailwindCSS directives SHALL be included in `frontend/src/index.css`
- **AND** utility classes SHALL work in React components

#### Scenario: Leaflet map library setup
- **GIVEN** React app is initialized
- **WHEN** developer installs `react-leaflet` and `leaflet`
- **THEN** map components SHALL import without TypeScript errors
- **AND** Leaflet CSS SHALL be included in `public/index.html`
- **AND** sample map component SHALL render Philippine base map

### Requirement: Supabase Integration Setup
The system SHALL configure Supabase CLI for local development with PostgreSQL/PostGIS, authentication, storage, and real-time subscriptions to enable full-stack development without cloud dependencies.

#### Scenario: Supabase CLI installation
- **GIVEN** npm is installed globally
- **WHEN** developer runs `npm install -g supabase`
- **THEN** Supabase CLI SHALL be available as `supabase` command
- **AND** `supabase --version` SHALL return version 1.127.0 or higher

#### Scenario: Supabase project initialization
- **GIVEN** Docker Desktop is installed and running
- **WHEN** developer runs `supabase init` in project root
- **THEN** `supabase/` directory SHALL be created with config.toml
- **AND** `supabase/migrations/` directory SHALL exist for schema versions
- **AND** local Supabase containers SHALL start via `supabase start`

#### Scenario: PostGIS extension enablement
- **GIVEN** Supabase local instance is running
- **WHEN** developer creates migration enabling PostGIS
- **THEN** geospatial queries SHALL execute successfully
- **AND** ST_Within, ST_Distance functions SHALL be available
- **AND** Philippine administrative boundaries SHALL be loadable as geography types

#### Scenario: Supabase client library integration
- **GIVEN** React app is initialized
- **WHEN** developer installs `@supabase/supabase-js`
- **THEN** Supabase client SHALL initialize with environment variables
- **AND** real-time subscriptions SHALL connect to local instance
- **AND** authentication methods SHALL be accessible

### Requirement: Testing Framework Configuration
The system SHALL provide Pytest for Python unit/integration tests and Jest for React component tests with coverage reporting enabled to ensure code quality gates.

#### Scenario: Pytest setup
- **GIVEN** Python virtual environment is activated
- **WHEN** developer installs `pytest pytest-cov`
- **THEN** `pytest` command SHALL discover tests in `tests/python/`
- **AND** `pytest --cov=backend/python` SHALL generate coverage report
- **AND** sample test SHALL pass demonstrating configuration works

#### Scenario: Jest configuration for React
- **GIVEN** Create React App includes Jest by default
- **WHEN** developer runs `npm test` in `frontend/`
- **THEN** Jest SHALL run in watch mode
- **AND** React Testing Library SHALL be available for component tests
- **AND** sample component test SHALL pass

#### Scenario: Test coverage thresholds
- **GIVEN** tests are configured
- **WHEN** coverage report is generated
- **THEN** coverage data SHALL be output in HTML and terminal formats
- **AND** configuration SHALL support setting minimum coverage thresholds (future)

### Requirement: Development Tooling Setup
The system SHALL configure code formatters (Black, ESLint), linters, and pre-commit hooks to enforce code quality standards automatically before commits.

#### Scenario: Black formatter configuration
- **GIVEN** Python virtual environment is activated
- **WHEN** developer installs Black and creates `.black.toml`
- **THEN** `black backend/python/` SHALL format code to 88-char line length
- **AND** formatting SHALL comply with PEP 8 guidelines
- **AND** VS Code SHALL auto-format on save if configured

#### Scenario: ESLint configuration for TypeScript
- **GIVEN** React app with TypeScript is initialized
- **WHEN** ESLint configuration is created
- **THEN** `npm run lint` SHALL check TypeScript files
- **AND** common errors (unused variables, missing types) SHALL be flagged
- **AND** auto-fix SHALL correct formatting issues

#### Scenario: Pre-commit hooks installation
- **GIVEN** Python and Node.js are configured
- **WHEN** developer installs `pre-commit` and creates `.pre-commit-config.yaml`
- **THEN** git commits SHALL trigger Black and ESLint checks
- **AND** commits SHALL be blocked if formatting fails
- **AND** `pre-commit run --all-files` SHALL validate entire codebase

### Requirement: Environment Variable Management
The system SHALL provide `.env.example` templates for backend and frontend with placeholders for Supabase API keys, reCAPTCHA secrets, and RSS feed URLs to document required configuration.

#### Scenario: Backend environment template
- **GIVEN** project foundation is initialized
- **WHEN** developer copies `.env.example` to `.env`
- **THEN** template SHALL include `SUPABASE_URL`, `SUPABASE_KEY` placeholders
- **AND** template SHALL include `RECAPTCHA_SECRET_KEY` placeholder
- **AND** template SHALL document required vs optional variables

#### Scenario: Frontend environment template
- **GIVEN** React app is initialized
- **WHEN** developer copies `frontend/.env.example` to `frontend/.env.local`
- **THEN** template SHALL include `REACT_APP_SUPABASE_URL` placeholder
- **AND** template SHALL include `REACT_APP_RECAPTCHA_SITE_KEY` placeholder
- **AND** variables SHALL follow Create React App naming convention (REACT_APP_*)

#### Scenario: Environment variable security
- **GIVEN** environment files are created
- **WHEN** developer reviews `.gitignore`
- **THEN** `.env` and `.env.local` SHALL be excluded from version control
- **AND** `.env.example` SHALL be tracked to document structure
- **AND** README SHALL warn against committing secrets
