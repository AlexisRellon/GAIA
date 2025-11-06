#!/usr/bin/env python3
"""
Script to check Supabase Realtime configuration
"""
import os
import sys
from supabase import create_client

def check_realtime():
    """Check realtime publication and RLS policies"""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    
    client = create_client(supabase_url, supabase_key)
    
    # Check RLS policies on hazards table
    print("\n=== Checking RLS Policies on gaia.hazards ===")
    try:
        result = client.rpc('exec_sql', {
            'query': """
                SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
                FROM pg_policies 
                WHERE schemaname = 'gaia' AND tablename = 'hazards'
                ORDER BY policyname;
            """
        }).execute()
        
        if result.data:
            for policy in result.data:
                print(f"\nPolicy: {policy['policyname']}")
                print(f"  Command: {policy['cmd']}")
                print(f"  Roles: {policy['roles']}")
                print(f"  Permissive: {policy['permissive']}")
        else:
            print("No RLS policies found on gaia.hazards")
    except Exception as e:
        print(f"❌ Error checking policies: {e}")
    
    # Check if hazards table is in realtime publication
    print("\n\n=== Checking Realtime Publication ===")
    try:
        result = client.rpc('exec_sql', {
            'query': """
                SELECT schemaname, tablename 
                FROM pg_publication_tables 
                WHERE pubname = 'supabase_realtime'
                ORDER BY schemaname, tablename;
            """
        }).execute()
        
        if result.data:
            print("Tables in supabase_realtime publication:")
            for table in result.data:
                marker = "✅" if table['tablename'] == 'hazards' else "  "
                print(f"{marker} {table['schemaname']}.{table['tablename']}")
        else:
            print("No tables found in supabase_realtime publication")
    except Exception as e:
        print(f"❌ Error checking publication: {e}")
    
    # Check table structure
    print("\n\n=== Checking gaia.hazards Table Structure ===")
    try:
        result = client.rpc('exec_sql', {
            'query': """
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'gaia' AND table_name = 'hazards'
                ORDER BY ordinal_position;
            """
        }).execute()
        
        if result.data:
            print("Columns:")
            for col in result.data:
                print(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
        else:
            print("❌ Table not found")
    except Exception as e:
        print(f"❌ Error checking table: {e}")

if __name__ == "__main__":
    check_realtime()
