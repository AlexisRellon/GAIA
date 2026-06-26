import sys, os
sys.path.insert(0, '/app/backend/python')
sys.path.insert(0, '/app')

import psycopg2

database_url = os.getenv('DATABASE_URL')
conn = psycopg2.connect(database_url)
cur = conn.cursor()

# Check: do any older rows have per-service response times in metadata that we could use?
cur.execute("""
    SELECT count(*)
    FROM gaia.service_health_checks
    WHERE response_time_ms IS NULL
    AND metadata ? 'services'
    AND metadata->'services' ? 'Supabase Database';
""")
row = cur.fetchone()
print(f"Rows with null response_time_ms but metadata.services.'Supabase Database': {row[0]}")

# Verify: how many days now have avg_response_ms non-null?
cur.execute("SELECT * FROM gaia.service_health_daily(30) WHERE avg_response_ms IS NOT NULL;")
rows = cur.fetchall()
print(f"\nDays with non-null avg_response_ms (out of 30): {len(rows)}")
for r in rows:
    print(f"  {r}")

cur.close()
conn.close()
