-- GAIA Database Quick Reference
-- Common SQL queries for development and testing

-- ============================================================================
-- DATABASE VERIFICATION
-- ============================================================================

-- Check PostGIS version
SELECT PostGIS_Version();

-- List all tables in gaia schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'gaia' 
ORDER BY table_name;

-- Count records in each table
SELECT 
    'hazard_types' as table_name, COUNT(*) as record_count FROM gaia.hazard_types
UNION ALL
SELECT 'hazards', COUNT(*) FROM gaia.hazards
UNION ALL
SELECT 'citizen_reports', COUNT(*) FROM gaia.citizen_reports
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM gaia.user_profiles
UNION ALL
SELECT 'ph_administrative_boundaries', COUNT(*) FROM gaia.ph_administrative_boundaries
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM gaia.audit_logs;

-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'gaia'
ORDER BY tablename, policyname;

-- Count indexes
SELECT COUNT(*) as total_indexes 
FROM pg_indexes 
WHERE schemaname = 'gaia';

-- ============================================================================
-- HAZARD QUERIES
-- ============================================================================

-- Get all validated hazards
SELECT 
    id,
    hazard_type,
    severity,
    location_name,
    latitude,
    longitude,
    confidence_score,
    source_type,
    detected_at
FROM gaia.hazards
WHERE validated = TRUE AND status = 'active'
ORDER BY detected_at DESC
LIMIT 50;

-- Get hazards by type
SELECT 
    hazard_type,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM gaia.hazards
WHERE status = 'active'
GROUP BY hazard_type
ORDER BY count DESC;

-- Get recent hazards (last 24 hours)
SELECT *
FROM gaia.hazards
WHERE detected_at >= NOW() - INTERVAL '24 hours'
ORDER BY detected_at DESC;

-- Get hazards in specific area (Manila)
SELECT *
FROM gaia.get_hazards_in_bbox(
    14.4, 120.9,  -- min_lat, min_lng
    14.7, 121.1,  -- max_lat, max_lng
    NULL,         -- filter_type (all types)
    NULL,         -- time_from
    NULL          -- time_to
);

-- Find nearby hazards
SELECT *
FROM gaia.get_nearby_hazards(
    14.5995,  -- Manila latitude
    120.9842, -- Manila longitude
    10.0,     -- 10 km radius
    48        -- last 48 hours
);

-- ============================================================================
-- CITIZEN REPORTS QUERIES
-- ============================================================================

-- Get pending citizen reports for triage
SELECT *
FROM gaia.get_pending_citizen_reports(NULL, 20);

-- Get citizen report by tracking ID
SELECT 
    tracking_id,
    hazard_type,
    description,
    location_name,
    status,
    submitted_at,
    validated
FROM gaia.citizen_reports
WHERE tracking_id = 'CR-20251101-XXXXX';

-- Get citizen reports by status
SELECT 
    status,
    COUNT(*) as count
FROM gaia.citizen_reports
GROUP BY status;

-- ============================================================================
-- USER QUERIES
-- ============================================================================

-- List all users with roles
SELECT 
    email,
    full_name,
    role,
    status,
    organization,
    last_login,
    onboarding_completed
FROM gaia.user_profiles
ORDER BY created_at DESC;

-- Get users by role
SELECT 
    role,
    COUNT(*) as count
FROM gaia.user_profiles
GROUP BY role;

-- Get user permissions
SELECT 
    r.role,
    r.permission_name,
    r.description
FROM gaia.role_permissions r
WHERE r.role = 'validator'
ORDER BY r.permission_name;

-- ============================================================================
-- AUDIT LOG QUERIES
-- ============================================================================

-- Get recent audit logs
SELECT 
    user_email,
    action,
    action_description,
    resource_type,
    success,
    created_at
FROM gaia.audit_logs
ORDER BY created_at DESC
LIMIT 50;

-- Get user activity history
SELECT *
FROM gaia.get_user_activity_history(
    'user-uuid-here',
    100
);

-- Get failed login attempts
SELECT 
    email,
    ip_address,
    reason,
    attempted_at
FROM gaia.failed_login_attempts
ORDER BY attempted_at DESC
LIMIT 20;

-- ============================================================================
-- GEOSPATIAL VALIDATION
-- ============================================================================

-- Test if coordinates are in Philippines
SELECT gaia.is_within_philippines(14.5995, 120.9842);  -- Manila (TRUE)
SELECT gaia.is_within_philippines(40.7128, -74.0060);  -- New York (FALSE)

-- Get administrative division for coordinates
SELECT *
FROM gaia.get_admin_division(14.5995, 120.9842);  -- Manila

-- Search Philippine locations
SELECT 
    name,
    admin_level,
    province_code,
    ST_X(centroid) as longitude,
    ST_Y(centroid) as latitude
FROM gaia.ph_administrative_boundaries
WHERE name ILIKE '%manila%';

-- ============================================================================
-- TESTING & DEVELOPMENT
-- ============================================================================

-- Insert test hazard (requires service role or master_admin)
INSERT INTO gaia.hazards (
    hazard_type,
    severity,
    location,
    latitude,
    longitude,
    location_name,
    confidence_score,
    source_type,
    source_title,
    source_content,
    source_published_at
) VALUES (
    'flood',
    'moderate',
    ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326),
    14.5995,
    120.9842,
    'Manila',
    0.85,
    'verified_news',
    'Heavy rains cause flooding in Manila',
    'Heavy rains overnight caused flooding in several areas of Manila...',
    NOW() - INTERVAL '2 hours'
);

-- Insert test citizen report
INSERT INTO gaia.citizen_reports (
    hazard_type,
    severity,
    description,
    location,
    latitude,
    longitude,
    location_name,
    captcha_verified
) VALUES (
    'landslide',
    'severe',
    'Major landslide blocking main road in Baguio. Multiple vehicles trapped.',
    ST_SetSRID(ST_MakePoint(120.5960, 16.4023), 4326),
    16.4023,
    120.5960,
    'Baguio City',
    TRUE
);

-- ============================================================================
-- PERFORMANCE ANALYSIS
-- ============================================================================

-- Analyze query performance
EXPLAIN ANALYZE
SELECT *
FROM gaia.hazards
WHERE hazard_type = 'flood'
AND detected_at >= NOW() - INTERVAL '7 days'
AND ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(121.0244, 14.5995), 4326)::geography,
    50000  -- 50 km
);

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'gaia'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'gaia'
ORDER BY idx_scan DESC;

-- ============================================================================
-- MAINTENANCE
-- ============================================================================

-- Clean up old sessions
SELECT gaia.cleanup_expired_sessions();

-- Update table statistics
ANALYZE gaia.hazards;
ANALYZE gaia.citizen_reports;
ANALYZE gaia.ph_administrative_boundaries;

-- Vacuum tables
VACUUM ANALYZE gaia.hazards;
VACUUM ANALYZE gaia.audit_logs;

-- Archive old hazards
UPDATE gaia.hazards
SET status = 'archived', archived_at = NOW()
WHERE status = 'resolved' 
AND detected_at < NOW() - INTERVAL '1 year';

-- ============================================================================
-- DEBUGGING
-- ============================================================================

-- Check active connections
SELECT 
    datname,
    usename,
    application_name,
    client_addr,
    state,
    query_start
FROM pg_stat_activity
WHERE datname = 'postgres';

-- Check for blocked queries
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- ============================================================================
-- RESET DATABASE (DANGER!)
-- ============================================================================

-- WARNING: This deletes ALL data!
-- Only use for development/testing

-- Drop all data
-- DROP SCHEMA IF EXISTS gaia CASCADE;

-- Re-apply migrations
-- \i backend/supabase/migrations/20241101000000_init_postgis.sql
-- \i backend/supabase/migrations/20241101000001_create_hazard_types.sql
-- ... (continue for all migrations)
