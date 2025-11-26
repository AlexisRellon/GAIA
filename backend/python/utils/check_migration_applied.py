"""
Check if ph_administrative_boundaries migration has been applied.
Quick diagnostic script to verify table exists before loading data.
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.python.lib.supabase_client import supabase

def check_migration():
    """Check if the table exists and is accessible."""
    print("=" * 60)
    print("Checking ph_administrative_boundaries table...")
    print("=" * 60)
    print()
    
    # Test 1: Check if table exists via PostgREST
    print("Test 1: Checking via PostgREST API...")
    try:
        result = supabase.schema('gaia').from_('ph_administrative_boundaries').select('id').limit(1).execute()
        print("✅ Table is accessible via PostgREST")
        if result.data:
            print(f"   Found {len(result.data)} existing record(s)")
        else:
            print("   Table exists but is empty")
    except Exception as e:
        error_str = str(e)
        if 'PGRST205' in error_str or 'schema cache' in error_str.lower():
            print("❌ Table NOT found in PostgREST schema cache")
            print("   This usually means:")
            print("   1. Migration hasn't been applied, OR")
            print("   2. PostgREST schema cache needs refresh")
        else:
            print(f"❌ Error: {error_str}")
    
    print()
    
    # Test 2: Check via raw SQL (if RPC function exists)
    print("Test 2: Checking via raw SQL query...")
    try:
        # Try to query information_schema directly
        sql = """
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'gaia' 
            AND table_name = 'ph_administrative_boundaries'
        ) as table_exists;
        """
        
        # Note: This requires an RPC function or direct SQL access
        # For now, we'll just provide instructions
        print("   ⚠️  Raw SQL check requires RPC function or direct database access")
        print("   Run this in Supabase SQL Editor:")
        print(f"   {sql.strip()}")
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    print("=" * 60)
    print("RECOMMENDED ACTIONS:")
    print("=" * 60)
    print()
    print("If table doesn't exist:")
    print("  1. Go to Supabase Dashboard → SQL Editor")
    print("  2. Apply migration: backend/supabase/migrations/20241101000003_create_ph_boundaries.sql")
    print("  3. Run this check script again")
    print()
    print("If table exists but PostgREST can't see it:")
    print("  1. Go to Supabase Dashboard → Settings → API")
    print("  2. Click 'Reload Schema' to refresh PostgREST cache")
    print("  3. Wait 10-30 seconds")
    print("  4. Run this check script again")
    print()
    print("Alternative: Use SQL generation method")
    print("  python backend/python/utils/generate_psgc_sql.py")
    print("  Then copy psgc_inserts.sql to Supabase SQL Editor")
    print()

if __name__ == '__main__':
    try:
        check_migration()
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        sys.exit(1)

