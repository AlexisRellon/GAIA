"""
Backfill Philippine administrative boundary GEOMETRY into
gaia.ph_administrative_boundaries.

Context:
    The table already holds the full PSGC hierarchy (names + codes, source
    PSGC_Q4_2024) but its `geometry` column is empty (0 of ~43,553 rows). This
    script fills geometry from the barangay-boundaries-repository (PSA/PSGC +
    NAMRIA, Douglas-Peucker simplified), matched by the canonical 10-digit PSGC
    code. Geometry is required by gaia.get_psgc_hierarchy() and the GeoJSON
    export's `ph_georef` block, and by the map's barangay boundary overlay.

Matching:
    The DB stores PSGC codes with leading zeros stripped (e.g. "402109026"),
    while the repo uses zero-padded 10-digit codes ("0402109026"). We match on
    LPAD(psgc_code, 10, '0') = <repo 10-digit code>.

Idempotent: by default only fills rows whose geometry IS NULL (resumable).
Use --force to overwrite existing geometry.

Run (inside the backend container):
    docker-compose run --rm backend python -m backend.python.utils.ingest_ph_boundaries
    docker-compose run --rm backend python -m backend.python.utils.ingest_ph_boundaries --only regions.geojson
    docker-compose run --rm backend python -m backend.python.utils.ingest_ph_boundaries --force

Attribution: boundary data (c) Philippine Statistics Authority (PSGC) and
NAMRIA, redistributed via bendlikeabamboo/barangay-boundaries-repository.
"""
import argparse
import json
import os
import re
import sys
import urllib.request

import psycopg2
from psycopg2.extras import execute_batch


def _resolve_dsn(url: str) -> str:
    """Rewrite a direct Supabase URL (db.<ref>.supabase.co, IPv6-only) to the
    IPv4 connection pooler so it is reachable from an IPv4-only container.

    Direct host -> aws-0-<region>.pooler.supabase.com:6543 with the tenant-
    qualified user postgres.<ref>. Uses tolerant string ops (not urlparse,
    which chokes on special characters in the password). The password is
    preserved and never logged. Override via SUPABASE_REGION / SUPABASE_POOLER_PORT.
    """
    dsn = url
    m = re.search(r"@db\.([a-z0-9]+)\.supabase\.co", dsn)
    if m:
        ref = m.group(1)
        region = os.getenv("SUPABASE_REGION", "ap-southeast-1")
        port = os.getenv("SUPABASE_POOLER_PORT", "6543")
        # Qualify a bare "postgres" user for the pooler (postgres -> postgres.<ref>).
        dsn = re.sub(r"://postgres:", f"://postgres.{ref}:", dsn, count=1)
        # Swap the direct host for the pooler host.
        dsn = dsn.replace(f"@db.{ref}.supabase.co", f"@aws-0-{region}.pooler.supabase.com")
        # Force the pooler port.
        if re.search(r"pooler\.supabase\.com:\d+", dsn):
            dsn = re.sub(r"(pooler\.supabase\.com):\d+", rf"\1:{port}", dsn)
        else:
            dsn = re.sub(r"(pooler\.supabase\.com)(/|\?|$)", rf"\1:{port}\2", dsn)
    if "sslmode=" not in dsn:
        dsn += ("&" if "?" in dsn else "?") + "sslmode=require"
    return dsn

DEFAULT_TAG = os.getenv("PH_BOUNDARIES_TAG", "v2026.4.13.0")
BASE_URL = "https://github.com/bendlikeabamboo/barangay-boundaries-repository/releases/download"

# Not GAIA admin levels — skip (they would not match our PSGC rows anyway and
# country.geojson is large).
SKIP_ASSETS = {"country.geojson", "non_administrative.geojson"}

UPDATE_FILL = (
    "UPDATE gaia.ph_administrative_boundaries "
    "SET geometry = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)), updated_at = now() "
    "WHERE LPAD(psgc_code, 10, '0') = %s AND geometry IS NULL"
)
UPDATE_FORCE = (
    "UPDATE gaia.ph_administrative_boundaries "
    "SET geometry = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)), updated_at = now() "
    "WHERE LPAD(psgc_code, 10, '0') = %s"
)


def _fetch_json(url: str):
    with urllib.request.urlopen(url, timeout=180) as resp:
        return json.load(resp)


def main() -> int:
    ap = argparse.ArgumentParser(description="Backfill PH boundary geometry by PSGC code.")
    ap.add_argument("--tag", default=DEFAULT_TAG, help="release tag")
    ap.add_argument("--only", default="", help="comma-separated asset filenames to ingest")
    ap.add_argument("--force", action="store_true", help="overwrite existing geometry")
    args = ap.parse_args()

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL is not set", file=sys.stderr)
        return 1

    manifest = _fetch_json(f"{BASE_URL}/{args.tag}/manifest.json")
    files = manifest.get("files") or manifest.get("assets") or []
    paths = [f["path"] for f in files if str(f.get("path", "")).endswith(".geojson")]
    if args.only:
        wanted = {x.strip() for x in args.only.split(",") if x.strip()}
        paths = [p for p in paths if p in wanted]
    else:
        paths = [p for p in paths if p not in SKIP_ASSETS]

    if not paths:
        print("No matching assets to ingest.", file=sys.stderr)
        return 1

    sql = UPDATE_FORCE if args.force else UPDATE_FILL
    print(f"Connecting to database … ({len(paths)} asset(s), tag {args.tag})", flush=True)
    conn = psycopg2.connect(_resolve_dsn(db_url))
    conn.autocommit = False
    total_features = 0
    try:
        with conn.cursor() as cur:
            for path in paths:
                url = f"{BASE_URL}/{args.tag}/{path}"
                print(f"-> {path}: downloading …", flush=True)
                fc = _fetch_json(url)
                rows = []
                for feat in fc.get("features", []):
                    props = feat.get("properties") or {}
                    code = props.get("psgc_code")
                    geom = feat.get("geometry")
                    if not code or not geom:
                        continue
                    rows.append((json.dumps(geom), str(code).zfill(10)))

                processed = 0
                batch = 500
                for i in range(0, len(rows), batch):
                    execute_batch(cur, sql, rows[i:i + batch], page_size=batch)
                    conn.commit()
                    processed = min(i + batch, len(rows))
                    print(f"   {path}: {processed}/{len(rows)} features", flush=True)
                total_features += len(rows)
                print(f"== {path}: {len(rows)} features processed", flush=True)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print(f"DONE. {total_features} features processed across {len(paths)} asset(s).")
    print("Verify with: SELECT count(geometry) FROM gaia.ph_administrative_boundaries;")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
