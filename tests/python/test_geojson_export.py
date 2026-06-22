"""
Tests for the compliance export endpoints (RG-01): GeoJSON + CSV.

Verifies:
- RFC 7946 FeatureCollection structure + PMP ISO 19115 metadata header.
- Coordinates use [longitude, latitude] (WGS 84) order.
- PII fields are never emitted.
- UNDP damage-assessment nesting for citizen-report hazards.
- CSV header + provenance line + row values.
- RBAC: unauthenticated requests are rejected (401/403).

These tests exercise the pure builder functions directly (no DB needed) plus
a lightweight FastAPI app for the auth check.
"""
import csv
import io
import os
import sys

import pytest

# Resolve backend package + lib.* imports (mirror existing backend tests).
PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
BACKEND_PY = os.path.join(PROJECT_ROOT, "backend", "python")
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, BACKEND_PY)

from backend.python import reports  # noqa: E402
from backend.python.reports import HazardData  # noqa: E402


def _rss_hazard(**overrides):
    base = dict(
        id="11111111-1111-1111-1111-111111111111",
        hazard_type="flood",
        severity="severe",
        location_name="Quezon City",
        admin_division="Metro Manila",
        latitude=14.6760,
        longitude=121.0437,
        confidence_score=0.91,
        source_type="rss",
        source_url="https://example.com/article",
        source_title="Heavy flooding in QC",
        status="validated",
        validated=True,
        created_at="2026-06-20T03:00:00Z",
    )
    base.update(overrides)
    return HazardData(**base)


def test_geojson_is_valid_feature_collection_with_metadata():
    fc = reports._build_geojson([_rss_hazard()], generated_by="validator@example.com")

    assert fc["type"] == "FeatureCollection"
    assert isinstance(fc["features"], list) and len(fc["features"]) == 1

    meta = fc["metadata"]
    assert meta["spatial_reference"] == "EPSG:4326 (WGS 84)"
    assert meta["standard_compliance"] == "PMP-ISO-19115:2014, RFC 7946"
    assert meta["feature_count"] == 1
    assert meta["agency_source"] == "AGAILA"
    assert meta["generated_by"] == "validator@example.com"
    assert "export_timestamp" in meta


def test_geojson_coordinates_are_lon_lat_order():
    fc = reports._build_geojson([_rss_hazard()], generated_by="x")
    geom = fc["features"][0]["geometry"]

    assert geom["type"] == "Point"
    # RFC 7946 mandates [longitude, latitude].
    assert geom["coordinates"] == [121.0437, 14.676]


def test_geojson_scrubs_pii_and_keeps_confidence():
    fc = reports._build_geojson([_rss_hazard()], generated_by="x")
    props = fc["features"][0]["properties"]

    assert props["confidence_score"] == 0.91  # confidence always shown
    for forbidden in ("reporter_id", "reporter_ip_hash", "user_agent",
                      "exif_data", "captcha_score"):
        assert forbidden not in props


def test_geojson_nests_undp_assessment_for_citizen_reports(monkeypatch):
    citizen = _rss_hazard(
        id="22222222-2222-2222-2222-222222222222",
        source_type="citizen_report",
    )
    undp = {
        "infrastructure_types": ["residential"],
        "infrastructure_details": "Two-storey house",
        "crisis_categories": None,
        "debris_status": "yes",
        "damage_severity": "severe",
    }
    monkeypatch.setattr(reports, "_fetch_undp_assessments", lambda ids: {citizen.id: undp})

    fc = reports._build_geojson([citizen], generated_by="x")
    props = fc["features"][0]["properties"]

    assert "undp_damage_assessment" in props
    assert props["undp_damage_assessment"]["debris_status"] == "yes"
    assert props["undp_damage_assessment"]["damage_severity"] == "severe"


def test_geojson_omits_ph_georef_when_unresolved(monkeypatch):
    # When PSGC cannot be resolved (e.g. an offshore point, or geometry not yet
    # loaded), ph_georef must be absent rather than empty — never break the export.
    monkeypatch.setattr(reports, "_resolve_psgc", lambda lat, lng: None)
    fc = reports._build_geojson([_rss_hazard()], generated_by="x")
    assert "ph_georef" not in fc["features"][0]["properties"]


def test_geojson_includes_ph_georef_when_resolved(monkeypatch):
    georef = {
        "region": {"name": "Region IV-A (CALABARZON)", "psgc": "0400000000"},
        "province": {"name": "Cavite", "psgc": "0402100000"},
        "city_municipality": {"name": "Imus", "psgc": "0402109000"},
        "barangay": {"name": "Alapan I-B", "psgc": "0402109026"},
    }
    monkeypatch.setattr(reports, "_resolve_psgc", lambda lat, lng: georef)

    fc = reports._build_geojson([_rss_hazard()], generated_by="x")
    props = fc["features"][0]["properties"]

    assert props["ph_georef"]["barangay"]["psgc"] == "0402109026"
    assert props["ph_georef"]["region"]["name"].startswith("Region IV-A")


def test_csv_has_provenance_header_and_rows():
    content = reports._build_csv([_rss_hazard()], generated_by="validator@example.com")
    lines = content.splitlines()

    assert lines[0].startswith("# AGAILA hazard export")
    assert "EPSG:4326" in lines[0]

    reader = csv.DictReader(io.StringIO("\n".join(lines[1:])))
    rows = list(reader)
    assert len(rows) == 1
    row = rows[0]
    assert row["hazard_type"] == "flood"
    assert row["latitude"] == "14.676"
    assert row["longitude"] == "121.0437"
    assert row["confidence_score"] == "0.91"


@pytest.mark.parametrize("path", ["/reports/export/geojson", "/reports/export/csv"])
def test_export_requires_authentication(path):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    app = FastAPI()
    app.include_router(reports.router)
    client = TestClient(app)

    resp = client.post(path, json={"hazards": []})
    # Unauthenticated requests must never reach the export logic.
    assert resp.status_code in (401, 403)
