"""
Apply Supabase Migration: Activity Logs & Realtime Triggers
Module: FP-04, RSS-09, GV-02
"""

import os
from supabase import create_client, Client

# Read migration SQL
with open('backend/supabase/migrations/20251105000001_add_realtime_and_activity_logs.sql', 'r') as f:
    migration_sql = f.read()

# Remove BEGIN/COMMIT for Supabase REST API (auto-transaction)
migration_sql = migration_sql.replace('BEGIN;', '').replace('COMMIT;', '')

# Remove rollback comment block
migration_sql = migration_sql.split('-- ============================================================================')[0]
migration_sql = migration_sql.split('-- ROLLBACK SCRIPT')[0]

# Connect to Supabase
supabase_url = os.getenv('SUPABASE_URL', 'https://lxfkysfytxaqxgwtskrz.supabase.co')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_key:
    print("❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment")
    print("Set it with: $env:SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

print("🔄 Applying migration: Add Realtime & Activity Logs...")
print("=" * 60)

try:
    # Execute migration (Supabase automatically handles transactions)
    result = supabase.rpc('exec_sql', {'sql': migration_sql}).execute()
    
    print("✅ Migration applied successfully!")
    print("\nCreated:")
    print("  - gaia.activity_logs table")
    print("  - gaia.audit_logs table")
    print("  - gaia.broadcast_rss_feed_changes() function")
    print("  - gaia.broadcast_hazard_changes() function")
    print("  - Triggers on rss_feeds and hazards tables")
    print("  - RLS policies for Master Admin access")
    print("  - Realtime broadcast permissions")
    
except Exception as e:
    print(f"❌ Migration failed: {e}")
    print("\n📋 Manual Steps:")
    print("1. Go to Supabase Dashboard → SQL Editor")
    print("2. Copy contents of: backend/supabase/migrations/20251105000001_add_realtime_and_activity_logs.sql")
    print("3. Paste and run in SQL Editor")
    exit(1)
