"""
One-shot backfill script: updates response_time_ms on service_health_checks rows
where it is NULL but the Supabase Database latency is available in JSONB metadata.
Run inside the backend container: python /app/backend/python/tests/_backfill_response_time.py
"""
import sys, os

sys.path.insert(0, '/app/backend/python')
sys.path.insert(0, '/app')

db_url = os.getenv('DATABASE_URL')
if not db_url:
    print("ERROR: DATABASE_URL not set. Run this inside the backend container.")
    sys.exit(1)

import psycopg2

conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Count rows that will be updated
cur.execute("""
    SELECT count(*)
    FROM gaia.service_health_checks
    WHERE response_time_ms IS NULL
      AND metadata->'services' ? 'Supabase Database'
      AND (metadata->'services'->>'Supabase Database') IS NOT NULL
""")
count = cur.fetchone()[0]
print(f"Rows eligible for backfill: {count}")

if count == 0:
    print("Nothing to backfill.")
    cur.close()
    conn.close()
    sys.exit(0)

# Backfill
cur.execute("""
    UPDATE gaia.service_health_checks
    SET response_time_ms = (metadata->'services'->>'Supabase Database')::numeric
    WHERE response_time_ms IS NULL
      AND metadata->'services' ? 'Supabase Database'
      AND (metadata->'services'->>'Supabase Database') IS NOT NULL
""")
print(f"Rows updated: {cur.rowcount}")
conn.commit()

# Verify result via the daily rollup function
cur.execute("SELECT count(*) FROM gaia.service_health_daily(30) WHERE avg_response_ms IS NOT NULL")
days_with_data = cur.fetchone()[0]
print(f"Days with avg_response_ms (out of 30): {days_with_data}")

cur.close()
conn.close()
print("Done.")
