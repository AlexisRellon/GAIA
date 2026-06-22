# backend/python/utils/ingest_barangays_faeldon.py
"""
Re-ingest higher-fidelity barangay geometry from faeldon/philippines-json-maps
(2019 hires) into gaia.ph_administrative_boundaries, matched by admin-name
hierarchy (see brgy_match.py). Barangay rows ONLY are updated; city/municipality/
province/region geometry is never touched.

Run inside the backend container (DATABASE_URL must be set):
    # validation: report match rate, write nothing
    python -m backend.python.utils.ingest_barangays_faeldon --province Cavite --dry-run
    # real run for one province
    python -m backend.python.utils.ingest_barangays_faeldon --province Cavite
    # nationwide
    python -m backend.python.utils.ingest_barangays_faeldon

Attribution: barangay geometry (c) faeldon/philippines-json-maps (MIT), derived
from altcoder/philippines-psgc-shapefiles + PSA/NAMRIA.
"""
import argparse
import json
import os
import sys
import time
import urllib.request

import psycopg2
from psycopg2.extras import execute_batch

from backend.python.utils.ingest_ph_boundaries import _resolve_dsn
from backend.python.utils.brgy_match import (
    build_muni_index, build_brgy_index, match_file, normalize_admin,
)

API_DIR = ("https://api.github.com/repos/faeldon/philippines-json-maps/"
           "contents/2019/geojson/barangays/hires")
RAW_BASE = ("https://raw.githubusercontent.com/faeldon/philippines-json-maps/"
            "master/2019/geojson/barangays/hires")

UPDATE_SQL = (
    "UPDATE gaia.ph_administrative_boundaries "
    "SET geometry = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)), updated_at = now() "
    "WHERE LPAD(psgc_code, 10, '0') = %s AND admin_level = 'barangay'"
)


def _get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "agaila-ingest"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.load(resp)


def _list_files():
    """Enumerate every per-municipality file (contents API, paginated)."""
    files, page = [], 1
    while True:
        batch = _get(f"{API_DIR}?per_page=100&page={page}")
        if not batch:
            break
        files.extend(e["name"] for e in batch if e["name"].endswith(".json"))
        if len(batch) < 100:
            break
        page += 1
        time.sleep(0.3)  # be polite to the API
    return files


def _load_indexes(cur):
    cur.execute("""
        SELECT LPAD(psgc_code,10,'0'), name, admin_level
        FROM gaia.ph_administrative_boundaries
    """)
    regions, provinces, munis, brgys = [], [], [], []
    for code10, name, lvl in cur.fetchall():
        if lvl == "region":
            regions.append((code10, name))
        elif lvl == "province":
            provinces.append((code10, name))
        elif lvl in ("city", "municipality"):
            munis.append((code10, name))
        elif lvl == "barangay":
            brgys.append((code10, name))
    muni_idx, muni_idx_noprov = build_muni_index(regions, provinces, munis)
    return muni_idx, muni_idx_noprov, build_brgy_index(brgys)


def main() -> int:
    ap = argparse.ArgumentParser(description="Re-ingest barangay geometry from faeldon 2019 hires.")
    ap.add_argument("--province", default="", help="only files whose ADM2_EN normalizes to this")
    ap.add_argument("--dry-run", action="store_true", help="report match rate; write nothing")
    args = ap.parse_args()

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL is not set", file=sys.stderr)
        return 1

    want_prov = normalize_admin(args.province) if args.province else None

    conn = psycopg2.connect(_resolve_dsn(db_url))
    conn.autocommit = False
    tot_matched = tot_unmatched = files_done = files_skipped = 0
    unmatched_munis, sample_unmatched_brgy = [], []
    try:
        with conn.cursor() as cur:
            print("Loading DB indexes …", flush=True)
            muni_idx, muni_idx_noprov, brgy_idx = _load_indexes(cur)
            print("Enumerating faeldon files …", flush=True)
            names = _list_files()
            print(f"{len(names)} municipality files found.", flush=True)

            for name in names:
                fc = _get(f"{RAW_BASE}/{name}")
                feats = fc.get("features", [])
                if not feats:
                    continue
                if want_prov:
                    fprov = normalize_admin(feats[0].get("properties", {}).get("ADM2_EN", ""))
                    if fprov != want_prov:
                        files_skipped += 1
                        continue

                matched, unmatched = match_file(feats, muni_idx, muni_idx_noprov, brgy_idx)
                tot_matched += len(matched)
                tot_unmatched += len(unmatched)
                for u in unmatched:
                    if u["reason"] == "municipality_not_found":
                        unmatched_munis.append((u["region"], u["province"], u["municipality"]))
                    elif len(sample_unmatched_brgy) < 25:
                        sample_unmatched_brgy.append((u["municipality"], u["barangay"]))

                if not args.dry_run and matched:
                    rows = [(json.dumps(g), c) for c, g in matched]
                    execute_batch(cur, UPDATE_SQL, rows, page_size=500)
                    conn.commit()
                files_done += 1
                if files_done % 100 == 0:
                    print(f"  … {files_done} files, {tot_matched} matched", flush=True)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print("\n==== SUMMARY ====")
    print(f"files processed: {files_done} (skipped {files_skipped})")
    print(f"barangays matched:   {tot_matched}")
    print(f"barangays unmatched: {tot_unmatched}")
    if unmatched_munis:
        print(f"municipalities NOT resolved: {len(unmatched_munis)} (sample)")
        for r, p, m in unmatched_munis[:15]:
            print(f"   region={r!r} province={p!r} municipality={m!r}")
    if sample_unmatched_brgy:
        print("sample unmatched barangays:")
        for m, b in sample_unmatched_brgy:
            print(f"   {m} / {b}")
    if args.dry_run:
        print("DRY RUN — no rows written.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
