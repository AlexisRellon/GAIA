# GAIA: Geospatial AI-driven Assessment
# Project Context

## Purpose

**GAIA** is an AI-driven framework integrating Zero-Shot Classification (ZSC) and Geospatial Named Entity Recognition (Geo-NER) for real-time environmental hazard detection and visualization in the Philippines.

### Core Objectives
1. Automatically detect and classify environmental hazards from online information streams
2. Extract and validate geospatial locations from unstructured textual data
3. Visualize detected hazards on an interactive real-time map
4. Support disaster management agencies, LGUs, and emergency responders with actionable intelligence
5. Enable citizen reporting for crowdsourced hazard awareness

### Target Users
- **LGU Responders**: Front-line emergency response personnel
- **ICTD Administrators**: System configuration and user management
- **Citizen Reporters**: Anonymous public users submitting hazard reports
- **Disaster Management Agencies**: NDRRMC, DOST, local government offices

## Tech Stack

### Frontend
- **Progressive Web Application (PWA)**: Offline-capable web application
- **HTML/CSS/JavaScript**: Core web technologies
- **GIS Libraries**: Leaflet or Mapbox for interactive mapping
- **UI Framework**: ReactJS + TailwindCSS

### Backend & Processing
**Python**: Primary language for AI/ML pipeline
**Climate-NLI Model**: For Zero-Shot Classification of climate/environmental hazards
**spaCy/NLTK**: Natural language processing and text preprocessing
**Custom Geo-NER Model**: Geospatial named entity recognition
**Supabase**: Managed backend platform (PostgreSQL/PostGIS, Auth, Storage, Edge Functions, Real-time APIs)

- **Philippine Administrative Boundaries**: Reference geospatial data

### Data Sources
- **RSS Feed Aggregators**: Real-time news feeds from Philippine news outlets (GMA News, ABS-CBN, Inquirer.net)
- **Citizen Submission API**: Public reporting endpoint with CAPTCHA protection

### AI/ML Pipeline
- **Zero-Shot Classification**: Climate-NLI model for hazard type detection
- **Geo-NER**: Location extraction from text
- **Confidence Scoring**: Uncertainty quantification for AI predictions
- **Geospatial Validation**: Cross-referencing with Philippine administrative boundaries

### Security & Infrastructure
- **Supabase Auth**: Email/password or social login authentication
- **Google reCAPTCHA**: Bot prevention for public forms
- **Role-Based Access Control (RBAC)**: Master Admin, Report Validator, LGU Responder roles

### Storage & Real-Time
- **Supabase Storage**: For citizen-uploaded images/media
- **Supabase Realtime**: For live hazard/event notifications and updates

## Project Conventions

### Code Style
- **Python**: Follow PEP 8 guidelines
  - 4 spaces for indentation
  - Max line length: 88 characters (Black formatter standard)
  - Descriptive variable names following snake_case
- **JavaScript**: Modern ES6+ syntax
  - Use `const` and `let`, avoid `var`
  - Prefer arrow functions for callbacks
  - camelCase for variables and functions
- **File Naming**: kebab-case for files, PascalCase for classes
- **Comments**: Document complex algorithms, AI model decisions, and geospatial logic

### Architecture Patterns

#### Three-Tiered Architecture
1. **Data Ingestion Layer**
   - RSS feed aggregation
   - Citizen report submission
   - Static reference data (hazard categories, geospatial boundaries)

2. **Core Processing (AI Pipeline) Layer**
   - Text preprocessing (NLTK/spaCy)
   - Zero-Shot Classification (BART model)
   - Geo-NER extraction
   - Geospatial validation against PostGIS database
   - Confidence score calculation
   - Output: `{Hazard Type, X, Y Coordinate, Confidence Score}`

3. **Presentation and Output Layer**
   - Progressive Web Application (PWA)
   - Real-time geospatial visualization (Leaflet/Mapbox)
   - Dynamic marker rendering and clustering
   - Filtering controls (hazard type, region, time window)
   - Report generation and export (CSV, GeoJSON, PDF)
   - Alert/notification system

#### Design Principles
- **Modularity**: Separate concerns for RSS ingestion, AI processing, and visualization
- **Real-Time Processing**: Minimize Time-to-Action (TtA) from article publication to map display
- **Geospatial Constraint**: Only process and display events within Philippine administrative boundaries
- **Human-in-the-Loop**: Manual triage for low-confidence or citizen-submitted reports
- **Uncertainty Quantification**: Always display confidence scores alongside predictions

### Testing Strategy

#### Unit Testing
- **AI Models**: Test ZSC and Geo-NER accuracy against annotated datasets
- **Geospatial Validation**: Verify coordinate matching against reference data
- **API Endpoints**: Test all backend routes for correct responses

#### Integration Testing
- **End-to-End Pipeline**: RSS feed → AI processing → Database → Map visualization
- **Citizen Report Flow**: Form submission → CAPTCHA → Flagging → Manual triage

#### Performance Testing
- **Time-to-Action (TtA)**: Measure elapsed time from article publication to map marker display
- **Concurrent User Load**: Test PWA under multiple simultaneous users
- **Database Query Performance**: Optimize PostGIS queries for large datasets

#### Model Evaluation Metrics
- **Accuracy**: Overall correctness of hazard classification
- **Precision**: Rate of false alarms (minimize resource misallocation)
- **Recall**: Rate of missed detections (critical for capturing all hazards)
- **F1-Score**: Balanced measure for imbalanced datasets
- **Algorithmic Fairness**: Compare F1-scores across linguistic inputs (English vs. local dialects) and geographic regions

### Git Workflow
- **Branching Strategy**: Feature branches from `main`
  - `feature/[module-code]-[brief-description]` (e.g., `feature/GV-02-dynamic-markers`)
  - `fix/[issue-number]-[brief-description]`
- **Commit Conventions**: Use semantic commit messages
  - `feat(module): description` for new features
  - `fix(module): description` for bug fixes
  - `docs: description` for documentation updates
  - `refactor(module): description` for code improvements
- **Pull Requests**: Require code review before merging to `main`
- **Deployment**: CI/CD pipeline for automated testing and deployment

## Domain Context

### Environmental Hazards (Philippine Context)
- **Typhoons**: Philippines is in the Pacific typhoon belt (avg. 20 typhoons/year)
- **Floods**: Monsoon rains and urban flooding
- **Earthquakes**: Pacific Ring of Fire (seismic activity)
- **Landslides**: Mountainous terrain and heavy rainfall
- **Volcanic Eruptions**: Active volcanoes (e.g., Mayon, Taal)

### Linguistic Characteristics
- **Code-Switching**: Blending of English, Tagalog, and regional dialects in news reports
- **Local Place Names**: Informal names, abbreviations, and regional variations
- **Homonyms**: Multiple locations with similar names (e.g., "San Juan" in multiple provinces)

### Disaster Management Framework
- **NDRRMC**: National Disaster Risk Reduction and Management Council
- **LGUs**: Local Government Units (provincial, city, municipal levels)
- **Project NOAH**: DOST initiative for hazard mapping (reference platform)
- **GeoRiskPH**: Geospatial analytics for localized hazards

### Key Performance Indicator
- **Time-to-Action (TtA)**: Elapsed time from article publication to hazard marker appearing on the PWA map
- **Target**: Near real-time processing (< 5 minutes)

## Important Constraints

### Technical Constraints
1. **Philippine Geographic Scope**: System ONLY processes events within Philippine administrative boundaries
2. **Geospatial Reference Data**: Must use official Philippine provinces, cities, and municipalities
3. **Confidence Threshold**: AI predictions below minimum confidence score require human review
4. **Internet Dependency**: Relies on online news sources (limited coverage in areas with poor connectivity)
5. **Unstructured Text Quality**: Accuracy depends on clarity of source text (ambiguous reports reduce precision)

### Business Constraints
1. **Data Privacy**: Citizen reports are anonymous; no personally identifiable information collected
2. **Source Reliability**: Verified news feeds prioritized over citizen reports
3. **Resource Allocation**: System aims to minimize false alarms to prevent resource misallocation
4. **Audit Trail**: All user activities (login, parameter changes, manual promotions) must be logged

### Regulatory Constraints
1. **Data Protection Act (RA 10173)**: Compliance with Philippine data privacy laws
2. **CAPTCHA Requirement**: Public forms must prevent automated spam/DoS attacks
3. **Role-Based Access Control**: Strict separation of Master Admin, Validator, and Responder roles

### Model Limitations
1. **Zero-Shot Learning**: May miss hazards outside training context (e.g., hailstorms not reported in Philippines)
2. **Geo-NER Ambiguity**: Homonyms and informal place names can reduce location accuracy
3. **No Predictive Modeling**: System detects reported events only, does not forecast future occurrences
4. **Sensor Network Integration**: Not included in current scope

## External Dependencies
### Platform Services
- **Supabase**: Managed backend, authentication, storage, real-time APIs, and Edge Functions (https://supabase.com/)

### Data Sources
- **GMA News RSS**: https://www.gmanetwork.com/news/rss/
- **ABS-CBN News RSS**: News feed URLs
- **Inquirer.net RSS**: News feed URLs
- **Philippine Administrative Boundaries**: NAMRIA (National Mapping and Resource Information Authority) official datasets

### AI Models & Libraries
- **Climate-NLI**: Pretrained language model for Zero-Shot Classification of climate/environmental hazards
- **spaCy**: Industrial-strength NLP library (v3.x+)
- **NLTK**: Natural Language Toolkit for text preprocessing
- **Scikit-learn**: Machine learning utilities for model evaluation

### Cloud Services
- **Cloud Identity Provider**: (TBD - e.g., Firebase Auth, Auth0, AWS Cognito)
- **Google reCAPTCHA v3**: https://www.google.com/recaptcha/
- **Hosting/Infrastructure**: (TBD - e.g., AWS, Azure, Google Cloud)

### Geospatial Services
- **Leaflet**: Open-source JavaScript library for interactive maps (https://leafletjs.com/)
- **Mapbox**: Alternative mapping platform (https://www.mapbox.com/)
- **PostGIS**: Spatial database extension for PostgreSQL (https://postgis.net/)

### Development Tools
- **Black**: Python code formatter
- **ESLint**: JavaScript linter
- **Pytest**: Python testing framework
- **Jest**: JavaScript testing framework (if applicable)

### Monitoring & Logging
- **Activity Logger**: Custom session and activity tracking system
- **Performance Metrics**: Custom TtA measurement and dashboard
