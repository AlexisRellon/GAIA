# backend/python/utils/ingest_barangays_faeldon.py
"""
Re-ingest higher-fidelity barangay geometry from faeldon/philippines-json-maps
(2019 hires) into gaia.ph_administrative_boundaries, matched by admin-name
hierarchy (see brgy_match.py). Barangay rows ONLY are updated; city/municipality/
province/region geometry is never touched.

Run inside the backend container. Requires DATABASE_URL; GITHUB_TOKEN is strongly
recommended (the unauthenticated GitHub API is 60 req/hr and will 403). Pass it
with `docker exec -e GITHUB_TOKEN=$(gh auth token) gaia-backend ...`:
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
import urllib.parse
import urllib.request

import psycopg2
from psycopg2.extras import execute_batch

from backend.python.utils.ingest_ph_boundaries import _resolve_dsn
from backend.python.utils.brgy_match import (
    build_muni_index, build_brgy_index, match_file, normalize_admin,
)

# Enumerate via the Git Trees API, not the Contents API: the Contents API caps
# directory listings at 1000 entries but there are ~1647 municipality files.
GH_PARENT = ("https://api.github.com/repos/faeldon/philippines-json-maps/"
             "contents/2019/geojson/barangays")
GH_TREE = "https://api.github.com/repos/faeldon/philippines-json-maps/git/trees/"
RAW_BASE = ("https://raw.githubusercontent.com/faeldon/philippines-json-maps/"
            "master/2019/geojson/barangays/hires")

UPDATE_SQL = (
    "UPDATE gaia.ph_administrative_boundaries "
    "SET geometry = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)), updated_at = now() "
    "WHERE LPAD(psgc_code, 10, '0') = %s AND admin_level = 'barangay'"
)


def _get(url, retries=3):
    """GET + JSON-parse a URL, with auth for the GitHub API and simple retry.

    A GITHUB_TOKEN (if set) is sent only to api.github.com to lift the 60 req/hr
    unauthenticated cap to 5000/hr. Transient failures are retried with backoff.
    """
    headers = {"User-Agent": "agaila-ingest"}
    token = os.getenv("GITHUB_TOKEN", "").strip()
    host = (urllib.parse.urlparse(url).hostname or "").lower()
    if token and host == "api.github.com":
        headers["Authorization"] = f"Bearer {token}"
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=180) as resp:
                return json.load(resp)
        except Exception as exc:  # noqa: BLE001 - retry any transient error
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise last


def _list_files():
    """Enumerate every per-municipality filename via the Git Trees API.

    Resolve the 'hires' directory's tree SHA, then list that tree (a single level,
    ~1647 entries) — the Trees API is not subject to the Contents API's 1000-entry
    directory cap.
    """
    parent = _get(GH_PARENT)
    sha = next((e["sha"] for e in parent if e.get("name") == "hires"), None)
    if not sha:
        raise RuntimeError("could not resolve the 'hires' directory tree SHA")
    tree = _get(f"{GH_TREE}{sha}")
    return [e["path"] for e in tree.get("tree", [])
            if e.get("type") == "blob" and str(e.get("path", "")).endswith(".json")]


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
    ap.add_argument("--name-prefix", default="",
                    help="only files whose filename starts with this (filters BEFORE download; "
                         "e.g. 'barangays-municity-ph1339' for City of Manila)")
    ap.add_argument("--dry-run", action="store_true", help="report match rate; write nothing")
    args = ap.parse_args()

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL is not set", file=sys.stderr)
        return 1

    want_prov = normalize_admin(args.province) if args.province else None

    conn = psycopg2.connect(_resolve_dsn(db_url))
    conn.autocommit = False
    tot_matched = tot_unmatched = files_done = files_skipped = files_errored = 0
    unmatched_munis, sample_unmatched_brgy = [], []
    try:
        with conn.cursor() as cur:
            print("Loading DB indexes …", flush=True)
            muni_idx, muni_idx_noprov, brgy_idx = _load_indexes(cur)
            print("Enumerating faeldon files …", flush=True)
            names = _list_files()
            print(f"{len(names)} municipality files found.", flush=True)

            for name in names:
                # Filename filter happens BEFORE download (cheap), so a targeted
                # re-run (e.g. just Manila) never fetches the rest of the country.
                if args.name_prefix and not name.startswith(args.name_prefix):
                    files_skipped += 1
                    continue
                # Isolate each file: one bad fetch/parse/write must not abort the
                # whole nationwide run. Already-committed files stay committed.
                try:
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
                except Exception as exc:  # noqa: BLE001 - isolate one bad file
                    files_errored += 1
                    conn.rollback()  # discard this file's partial/aborted write
                    print(f"  ERROR {name}: {exc}", flush=True)
                    continue
    finally:
        conn.close()

    print("\n==== SUMMARY ====")
    print(f"files processed: {files_done} (skipped {files_skipped}, errored {files_errored})")
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
