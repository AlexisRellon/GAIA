# Graph Report - backend  (2026-04-25)

## Corpus Check
- 48 files · ~119,488 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 867 nodes · 1823 edges · 50 communities detected
- Extraction: 57% EXTRACTED · 42% INFERRED · 0% AMBIGUOUS · INFERRED: 773 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Args Audit|Args Audit]]
- [[_COMMUNITY_User Hazard|User Hazard]]
- [[_COMMUNITY_Error System|Error System]]
- [[_COMMUNITY_Process Task|Process Task]]
- [[_COMMUNITY_Args Error|Args Error]]
- [[_COMMUNITY_Research Ground|Research Ground]]
- [[_COMMUNITY_Field Decrypt|Field Decrypt]]
- [[_COMMUNITY_Region Location|Region Location]]
- [[_COMMUNITY_Check Patterns|Check Patterns]]
- [[_COMMUNITY_Cache Redis|Cache Redis]]
- [[_COMMUNITY_Hazard Realtime|Hazard Realtime]]
- [[_COMMUNITY_Rate Redis|Rate Redis]]
- [[_COMMUNITY_Location Locations|Location Locations]]
- [[_COMMUNITY_Entry Checksum|Entry Checksum]]
- [[_COMMUNITY_Nominatim Coordinates|Nominatim Coordinates]]
- [[_COMMUNITY_Stack Fastapi|Stack Fastapi]]
- [[_COMMUNITY_Auth Event|Auth Event]]
- [[_COMMUNITY_Report Citizen|Report Citizen]]
- [[_COMMUNITY_Rate Limit|Rate Limit]]
- [[_COMMUNITY_Phone Philippine|Phone Philippine]]
- [[_COMMUNITY_Supabase Structured|Supabase Structured]]
- [[_COMMUNITY_Check Migration|Check Migration]]
- [[_COMMUNITY_Migration Geospatial|Migration Geospatial]]
- [[_COMMUNITY_Security Level|Security Level]]
- [[_COMMUNITY_Agaila Wordmark|Agaila Wordmark]]
- [[_COMMUNITY_Supabase Client|Supabase Client]]
- [[_COMMUNITY_Generate Psgc|Generate Psgc]]
- [[_COMMUNITY_Create From|Create From]]
- [[_COMMUNITY_Hmac Secret|Hmac Secret]]
- [[_COMMUNITY_Compute Hash|Compute Hash]]
- [[_COMMUNITY_Sign Content|Sign Content]]
- [[_COMMUNITY_Verify Hmac|Verify Hmac]]
- [[_COMMUNITY_Create Tamper|Create Tamper]]
- [[_COMMUNITY_Verify Integrity|Verify Integrity]]
- [[_COMMUNITY_Verify Integrity|Verify Integrity]]
- [[_COMMUNITY_Content Hash|Content Hash]]
- [[_COMMUNITY_Analyze Audit|Analyze Audit]]
- [[_COMMUNITY_Error System|Error System]]
- [[_COMMUNITY_Exception Unhandled|Exception Unhandled]]
- [[_COMMUNITY_Silent Logic|Silent Logic]]
- [[_COMMUNITY_Database Error|Database Error]]
- [[_COMMUNITY_Sanitizes Sensitive|Sanitizes Sensitive]]
- [[_COMMUNITY_Model Name|Model Name]]
- [[_COMMUNITY_Description System|Description System]]
- [[_COMMUNITY_Name External|Name External]]
- [[_COMMUNITY_Source Validation|Source Validation]]
- [[_COMMUNITY_Source Operation|Source Operation]]
- [[_COMMUNITY_Build Regex|Build Regex]]
- [[_COMMUNITY_Best Effort|Best Effort]]
- [[_COMMUNITY_Gaia Audit|Gaia Audit]]

## God Nodes (most connected - your core abstractions)
1. `UserContext` - 168 edges
2. `ActivityLogger` - 157 edges
3. `UserRole` - 69 edges
4. `UserStatus` - 69 edges
5. `RSSProcessor` - 27 edges
6. `RequestLoggingMiddleware` - 26 edges
7. `SecurityHeadersMiddleware` - 24 edges
8. `ErrorSource` - 23 edges
9. `SystemErrorLogger` - 21 edges
10. `log_activity()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Citizen Report Submission Endpoints Module: CR-03, CR-04 Handles public hazard` --uses--> `ActivityLogger`  [INFERRED]
  D:\Thesis25-26\GAIA\backend\python\citizen_reports.py → D:\Thesis25-26\GAIA\backend\python\middleware\activity_logger.py
- `Response after successful report submission` --uses--> `ActivityLogger`  [INFERRED]
  D:\Thesis25-26\GAIA\backend\python\citizen_reports.py → D:\Thesis25-26\GAIA\backend\python\middleware\activity_logger.py
- `Response for report tracking queries` --uses--> `ActivityLogger`  [INFERRED]
  D:\Thesis25-26\GAIA\backend\python\citizen_reports.py → D:\Thesis25-26\GAIA\backend\python\middleware\activity_logger.py
- `Verify Cloudflare Turnstile token with Cloudflare's API          Args:` --uses--> `ActivityLogger`  [INFERRED]
  D:\Thesis25-26\GAIA\backend\python\citizen_reports.py → D:\Thesis25-26\GAIA\backend\python\middleware\activity_logger.py
- `Get client identifier for cooldown (IP).` --uses--> `ActivityLogger`  [INFERRED]
  D:\Thesis25-26\GAIA\backend\python\citizen_reports.py → D:\Thesis25-26\GAIA\backend\python\middleware\activity_logger.py

## Hyperedges (group relationships)
- **AI Pipeline Core Processing Flow** — aipipeline_rss_processor, aipipeline_zero_shot_classifier, aipipeline_geo_ner_hybrid, aipipeline_fastapi_endpoints [EXTRACTED 1.00]
- **Geospatial Validation Stack** — migrations_postgis_extension, migrations_ph_boundaries_table, migrations_geospatial_validation_functions, aipipeline_geo_ner_hybrid [INFERRED 0.82]
- **Security and Governance Controls for Compliance** — migrations_rls_policies, migrations_audit_logs_table, requirements_cryptography_dependency, migrations_ra10173_rationale [INFERRED 0.76]
- **AGAILA Logo Composition** — gaia_logo_image_asset, gaia_agaila_wordmark, gaia_map_pin_icon [EXTRACTED 0.97]

## Communities

### Community 0 - "Args Audit"
Cohesion: 0.03
Nodes (170): ActivityLogger, Log audit event to audit_logs table.                  Args:             user_, Log RSS processing completion.                  Args:             started_by:, Centralized activity and audit logging utility.          Usage:         # Log, Log hazard validation action.                  Args:             validator: U, Log system configuration change.                  Args:             admin: Ad, Log authentication events.                  Args:             user_email: Use, Log user activity to activity_logs table.                  Args: (+162 more)

### Community 1 - "User Hazard"
Cohesion: 0.05
Nodes (81): log_activity(), log_audit(), log_config_change(), log_hazard_validation(), log_rss_processing(), log_user_auth(), Activity and Audit Logging Utility for GAIA Centralized logging for all user ac, create_user() (+73 more)

### Community 2 - "Error System"
Cohesion: 0.06
Nodes (61): BaseHTTPMiddleware, Get the list of supported hazard categories., ErrorSource, log_database_error(), log_error(), log_external_api_error(), log_model_error(), log_silent_bug() (+53 more)

### Community 3 - "Process Task"
Cohesion: 0.04
Nodes (43): process_rss_feeds_task(), process_single_feed_task(), Celery Worker Configuration for GAIA RSS Feed Processing Module: RSS-08 (Backen, Process a single RSS feed by ID.     Used for manual/on-demand processing., Send SMS notification to citizen reporter about report status (CR-06 SMS Notific, Test task to verify Celery is working.          Returns:         dict: Test r, Background task to process RSS feeds.     Runs on schedule (default: every 5 mi, send_sms_notification() (+35 more)

### Community 4 - "Args Error"
Cohesion: 0.06
Nodes (41): Enum, ErrorCategory, ErrorStatus, Error categories matching gaia.error_category enum, Error status matching gaia.error_status enum, RSS Feed Processor for GAIA Fetches and processes RSS feeds from Philippine new, Extract and clean content from RSS entry.                  Args:, Remove HTML tags and clean text.                  Args:             html_text (+33 more)

### Community 5 - "Research Ground"
Cohesion: 0.05
Nodes (44): AlgorithmMetrics, compare_models(), Config, ConfusionMatrixEntry, ConfusionMatrixResponse, DatasetExportRequest, export_research_dataset(), get_algorithm_metrics() (+36 more)

### Community 6 - "Field Decrypt"
Cohesion: 0.06
Nodes (30): get_triage_queue(), decrypt_field(), decrypt_pii_fields(), derive_key_from_password(), encrypt_field(), encrypt_pii_fields(), FieldEncryptor, generate_encryption_key() (+22 more)

### Community 7 - "Region Location"
Cohesion: 0.07
Nodes (33): extract_feature_by_name(), get_location_boundary(), health_check(), load_geojson_file(), Boundaries API - Serve Philippine administrative boundaries by location Provide, Load and parse a GeoJSON file., Extract a specific feature from GeoJSON by name with field priority., Health check endpoint. (+25 more)

### Community 8 - "Check Patterns"
Cohesion: 0.08
Nodes (18): ClimateNLIClassifier, Zero-Shot Classification Module for GAIA Enhanced for Philippine Environmental, Enhanced Zero-shot text classifier for Philippine environmental hazards., Initialize the enhanced classifier with fallback hierarchy.          Args:, Pre-compile regex patterns for better performance., Load the zero-shot classification model with automatic fallback.         Uses c, Check if text matches any exclusion patterns (false positive detection)., Check if text is about unrelated news categories (crime, politics, sports, etc.) (+10 more)

### Community 9 - "Cache Redis"
Cohesion: 0.09
Nodes (29): cache_response(), clear_all_cache(), close_redis(), delete_cached(), deserialize_value(), get_cache_stats(), get_cached(), get_redis() (+21 more)

### Community 10 - "Hazard Realtime"
Cohesion: 0.1
Nodes (19): ConnectionManager, format_hazard_event(), format_heartbeat(), get_realtime_stats(), hazard_event_generator(), matches_filters(), Realtime SSE API - Server-Sent Events for Hazard Updates Replaces direct Supaba, Get connection statistics (+11 more)

### Community 11 - "Rate Redis"
Cohesion: 0.09
Nodes (22): rate_limit_stats(), Get rate limiting statistics (PATCH-2), add_rate_limit_headers(), create_rate_limit_dependency(), get_limit(), get_rate_limit_stats(), get_redis(), get_redis_client() (+14 more)

### Community 12 - "Location Locations"
Cohesion: 0.1
Nodes (11): GeoNER, Geo-Named Entity Recognition Module for GAIA Extracts Philippine location infor, Initialize Geo-NER module.                  Args:             ner_model_name:, Load NER model and initialize geocoder, Extract location entities from text using hybrid approach.                  Ar, Extract Philippine-specific locations using regex patterns and regional enrichme, Geographic Named Entity Recognition for Philippine locations.     Hybrid approa, Classify the type of location based on name patterns (+3 more)

### Community 13 - "Entry Checksum"
Cohesion: 0.16
Nodes (19): AuditEntry, AuditIntegrity, compute_checksum_for_log(), _compute_content_hash(), create_entry(), detect_tampering(), get_entry_hash(), _get_hmac_secret() (+11 more)

### Community 14 - "Nominatim Coordinates"
Cohesion: 0.18
Nodes (17): _build_nominatim_params(), get_centroid_from_geocoding(), get_coordinates_from_nominatim_async(), get_coordinates_from_nominatim_sync(), _get_headers(), _is_within_philippine_bounds(), _parse_nominatim_response(), _prepare_query_string() (+9 more)

### Community 15 - "Stack Fastapi"
Cohesion: 0.16
Nodes (16): Fallback to BART-MNLI Because Climate-NLI Is Not Publicly Available, FastAPI Inference Endpoints, Hybrid Geo-NER Pipeline, GeoAware Reference Repository, Nominatim 1 req/sec Rate-Limit Compliance Rationale, Asynchronous RSS Processor, Unit and Integration Test Suite, Zero-Shot Hazard Classifier (+8 more)

### Community 16 - "Auth Event"
Cohesion: 0.16
Nodes (13): AuthEventRequest, AuthEventResponse, check_email_exists(), CheckEmailRequest, CheckEmailResponse, invalidate_other_sessions(), log_auth_event(), Authentication Event Logging API for GAIA Handles auth event logging (login/log (+5 more)

### Community 17 - "Report Citizen"
Cohesion: 0.17
Nodes (12): _get_client_identifier(), Citizen Report Submission Endpoints Module: CR-03, CR-04 Handles public hazard, Get client identifier for cooldown (IP)., # TODO: SMS delivery cleanup: contact_phone (encrypted) is used during admin app, Track the status of a submitted citizen report          - **tracking_id**: Uni, Response after successful report submission, Response for report tracking queries, Verify Cloudflare Turnstile token with Cloudflare's API          Args: (+4 more)

### Community 18 - "Rate Limit"
Cohesion: 0.33
Nodes (5): get_rate_limit(), rate_limit_exceeded_handler(), Rate Limiting Middleware for GAIA API Implements slowapi rate limiter for resea, Custom handler for rate limit exceeded errors.          Returns:         JSON, Get rate limit configuration for endpoint type.          Args:         endpoi

### Community 19 - "Phone Philippine"
Cohesion: 0.33
Nodes (5): format_philippine_phone_number(), is_valid_philippine_phone_number(), Philippine Phone Number Validation Validates Philippine phone numbers in variou, Validates if a phone number is a valid Philippine phone number          Args:, Formats a Philippine phone number for storage/display          Args:

### Community 20 - "Supabase Structured"
Cohesion: 0.4
Nodes (5): Structured Hazard Output Schema, Supabase Integration Next Steps, Backend Documentation Guidelines, gaia.hazards Table, Supabase and PostgreSQL Client Stack

### Community 21 - "Check Migration"
Cohesion: 0.5
Nodes (3): check_migration(), Check if ph_administrative_boundaries migration has been applied. Quick diagnos, Check if the table exists and is accessible.

### Community 22 - "Migration Geospatial"
Cohesion: 0.5
Nodes (4): Geospatial Validation SQL Functions, gaia.ph_administrative_boundaries Table, PostGIS Extension Migration, Supabase CLI Migration Push Workflow

### Community 23 - "Security Level"
Cohesion: 0.5
Nodes (4): RA 10173 Compliance Rationale for Security Controls, RBAC Helper Functions, Row-Level Security Policies, Cryptography for Field-Level PII Encryption

### Community 24 - "Agaila Wordmark"
Cohesion: 0.67
Nodes (4): AGAILA Wordmark, Geospatial Location Concept, GAIA Logo Image, Map Pin Icon

### Community 25 - "Supabase Client"
Cohesion: 1.0
Nodes (1): Centralized Supabase client for GAIA backend. Uses SUPABASE_URL and SUPABASE_SE

### Community 26 - "Generate Psgc"
Cohesion: 1.0
Nodes (1): Generate SQL INSERT statements from PSGC CSV file. Useful for loading data via

### Community 28 - "Create From"
Cohesion: 1.0
Nodes (1): Create from dictionary (database retrieval).

### Community 29 - "Hmac Secret"
Cohesion: 1.0
Nodes (1): Get HMAC secret for signing entries.                  Reads from GAIA_AUDIT_HM

### Community 30 - "Compute Hash"
Cohesion: 1.0
Nodes (1): Compute SHA-256 hash of entry content.                  Includes all fields ex

### Community 31 - "Sign Content"
Cohesion: 1.0
Nodes (1): Sign content hash with HMAC for additional integrity.                  Returns

### Community 32 - "Verify Hmac"
Cohesion: 1.0
Nodes (1): Verify HMAC signature on checksum.                  Args:             checksu

### Community 33 - "Create Tamper"
Cohesion: 1.0
Nodes (1): Create a new tamper-evident audit entry.                  Args:             e

### Community 34 - "Verify Integrity"
Cohesion: 1.0
Nodes (1): Verify integrity of a single audit entry.                  Recomputes the chec

### Community 35 - "Verify Integrity"
Cohesion: 1.0
Nodes (1): Verify integrity of an audit chain.                  Checks:         1. Each

### Community 36 - "Content Hash"
Cohesion: 1.0
Nodes (1): Get the content hash of an entry (for chaining).                  Args:

### Community 37 - "Analyze Audit"
Cohesion: 1.0
Nodes (1): Analyze audit chain for tampering evidence.                  Returns detailed

### Community 38 - "Error System"
Cohesion: 1.0
Nodes (1): Log a system error to audit_logs with error tracking fields.          Args:

### Community 39 - "Exception Unhandled"
Cohesion: 1.0
Nodes (1): Log an unhandled exception.          Args:             exception: The excepti

### Community 40 - "Silent Logic"
Cohesion: 1.0
Nodes (1): Log a silent bug (logic error without exception).          Args:

### Community 41 - "Database Error"
Cohesion: 1.0
Nodes (1): Log a database operation error.          Args:             error: Database ex

### Community 42 - "Sanitizes Sensitive"
Cohesion: 1.0
Nodes (1): Sanitizes sensitive fields from input data before logging.

### Community 43 - "Model Name"
Cohesion: 1.0
Nodes (1): Log an AI model inference error.          Args:             model_name: Name

### Community 44 - "Description System"
Cohesion: 1.0
Nodes (1): Log a system crash event.          Args:             description: Description

### Community 45 - "Name External"
Cohesion: 1.0
Nodes (1): Log an external API error.          Args:             api_name: Name of the e

### Community 46 - "Source Validation"
Cohesion: 1.0
Nodes (1): Log a data validation error.          Args:             source: Source of the

### Community 47 - "Source Operation"
Cohesion: 1.0
Nodes (1): Log an operation timeout error.          Args:             source: Source of

### Community 48 - "Build Regex"
Cohesion: 1.0
Nodes (1): Build regex pattern from list of location names

### Community 49 - "Best Effort"
Cohesion: 1.0
Nodes (1): Best-effort detection of a PostgreSQL unique-constraint violation         surfa

### Community 50 - "Gaia Audit"
Cohesion: 1.0
Nodes (1): gaia.audit_logs Table

## Ambiguous Edges - Review These
- `Backend Documentation Guidelines` → `Supabase Integration Next Steps`  [AMBIGUOUS]
  backend/AGENTS.md · relation: conceptually_related_to
- `AGAILA Wordmark` → `Geospatial Location Concept`  [AMBIGUOUS]
  backend/python/assets/img/GAIA.png · relation: conceptually_related_to

## Knowledge Gaps
- **255 isolated node(s):** `Health check for admin API (requires authentication)`, `Config`, `Analytics API for GAIA Dashboard Provides real-time analytics, statistics, and`, `Overall hazard statistics`, `Time-series data for hazard trends - supports all hazard types dynamically` (+250 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Supabase Client`** (2 nodes): `supabase_client.py`, `Centralized Supabase client for GAIA backend. Uses SUPABASE_URL and SUPABASE_SE`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Generate Psgc`** (2 nodes): `Generate SQL INSERT statements from PSGC CSV file. Useful for loading data via`, `generate_psgc_sql.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create From`** (1 nodes): `Create from dictionary (database retrieval).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hmac Secret`** (1 nodes): `Get HMAC secret for signing entries.                  Reads from GAIA_AUDIT_HM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Compute Hash`** (1 nodes): `Compute SHA-256 hash of entry content.                  Includes all fields ex`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sign Content`** (1 nodes): `Sign content hash with HMAC for additional integrity.                  Returns`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Verify Hmac`** (1 nodes): `Verify HMAC signature on checksum.                  Args:             checksu`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create Tamper`** (1 nodes): `Create a new tamper-evident audit entry.                  Args:             e`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Verify Integrity`** (1 nodes): `Verify integrity of a single audit entry.                  Recomputes the chec`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Verify Integrity`** (1 nodes): `Verify integrity of an audit chain.                  Checks:         1. Each`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Content Hash`** (1 nodes): `Get the content hash of an entry (for chaining).                  Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Analyze Audit`** (1 nodes): `Analyze audit chain for tampering evidence.                  Returns detailed`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Error System`** (1 nodes): `Log a system error to audit_logs with error tracking fields.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Exception Unhandled`** (1 nodes): `Log an unhandled exception.          Args:             exception: The excepti`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Silent Logic`** (1 nodes): `Log a silent bug (logic error without exception).          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Error`** (1 nodes): `Log a database operation error.          Args:             error: Database ex`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sanitizes Sensitive`** (1 nodes): `Sanitizes sensitive fields from input data before logging.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Model Name`** (1 nodes): `Log an AI model inference error.          Args:             model_name: Name`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Description System`** (1 nodes): `Log a system crash event.          Args:             description: Description`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Name External`** (1 nodes): `Log an external API error.          Args:             api_name: Name of the e`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Source Validation`** (1 nodes): `Log a data validation error.          Args:             source: Source of the`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Source Operation`** (1 nodes): `Log an operation timeout error.          Args:             source: Source of`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Build Regex`** (1 nodes): `Build regex pattern from list of location names`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Best Effort`** (1 nodes): `Best-effort detection of a PostgreSQL unique-constraint violation         surfa`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Gaia Audit`** (1 nodes): `gaia.audit_logs Table`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Backend Documentation Guidelines` and `Supabase Integration Next Steps`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `AGAILA Wordmark` and `Geospatial Location Concept`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `UserContext` connect `Args Audit` to `User Hazard`, `Hazard Realtime`, `Rate Redis`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `ActivityLogger` connect `Args Audit` to `Auth Event`, `User Hazard`, `Hazard Realtime`, `Report Citizen`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `compute_checksum_for_log()` connect `Entry Checksum` to `User Hazard`, `Error System`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 159 inferred relationships involving `UserContext` (e.g. with `UserProfileResponse` and `CreateUserRequest`) actually correct?**
  _`UserContext` has 159 INFERRED edges - model-reasoned connections that need verification._
- **Are the 155 inferred relationships involving `ActivityLogger` (e.g. with `UserProfileResponse` and `CreateUserRequest`) actually correct?**
  _`ActivityLogger` has 155 INFERRED edges - model-reasoned connections that need verification._