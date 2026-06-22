# tests/python/test_brgy_match.py
import os, sys
PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
sys.path.insert(0, PROJECT_ROOT)

from backend.python.utils.brgy_match import normalize_admin, normalize_brgy  # noqa: E402


class TestNormalizeAdmin:
    def test_region_parenthetical_stripped(self):
        # DB "Region I (Ilocos Region)" and faeldon "REGION I (ILOCOS REGION)" must collapse equal.
        assert normalize_admin("Region I (Ilocos Region)") == normalize_admin("REGION I (ILOCOS REGION)")
        assert normalize_admin("Region I (Ilocos Region)") == "region i"

    def test_city_affix_stripped(self):
        assert normalize_admin("City of Imus") == "imus"
        assert normalize_admin("Imus City") == "imus"
        assert normalize_admin("IMUS") == "imus"

    def test_municipality_affix_stripped(self):
        assert normalize_admin("Municipality of Bacarra") == "bacarra"
        assert normalize_admin("BACARRA") == "bacarra"

    def test_accents_folded(self):
        assert normalize_admin("Peñablanca") == "penablanca"


class TestNormalizeBrgy:
    def test_case_and_accents(self):
        assert normalize_brgy("Bani") == "bani"
        assert normalize_brgy("Niño") == "nino"

    def test_abbreviation_expansion(self):
        assert normalize_brgy("Sto. Niño") == normalize_brgy("Santo Nino")
        assert normalize_brgy("Sta. Cruz") == normalize_brgy("Santa Cruz")

    def test_poblacion_parenthetical_dropped(self):
        # "Poblacion (Pob.)" noise should not break equality with the bare name.
        assert normalize_brgy("San Roque (Pob.)") == normalize_brgy("San Roque")

    def test_punctuation_and_whitespace(self):
        assert normalize_brgy("  Alapan  I-B ") == normalize_brgy("Alapan I B")


# append to tests/python/test_brgy_match.py
from backend.python.utils.brgy_match import (  # noqa: E402
    build_muni_index, build_brgy_index, match_file,
)

# DB rows as (code10, name). Imus (Cavite, Region IV-A) + a name-collision muni.
DB_REGIONS = [("0400000000", "Region IV-A (CALABARZON)")]
DB_PROVINCES = [("0402100000", "Cavite")]
DB_MUNIS = [("0402109000", "City of Imus")]
DB_BRGYS = [
    ("0402109011", "Bucandala I"),
    ("0402109001", "Alapan I-B"),
    ("0402109099", "Sto. Niño"),
]


def test_build_muni_index_keys_on_normalized_hierarchy():
    idx, idx_noprov = build_muni_index(DB_REGIONS, DB_PROVINCES, DB_MUNIS)
    # normalize_admin strips punctuation, so "IV-A" normalizes to "iv a" (matches
    # the existing normalizer behavior verified by test_punctuation_and_whitespace).
    assert idx[("region iv a", "cavite", "imus")] == "0402109"
    assert idx_noprov[("region iv a", "imus")] == "0402109"


def test_build_brgy_index_scopes_by_muni_prefix():
    bidx = build_brgy_index(DB_BRGYS)
    assert bidx[("0402109", "bucandala i")] == "0402109011"
    assert bidx[("0402109", "alapan i b")] == "0402109001"


def test_match_file_matches_within_resolved_municipality():
    midx, midx_noprov = build_muni_index(DB_REGIONS, DB_PROVINCES, DB_MUNIS)
    bidx = build_brgy_index(DB_BRGYS)
    features = [
        {"properties": {"ADM1_EN": "REGION IV-A (CALABARZON)", "ADM2_EN": "CAVITE",
                        "ADM3_EN": "City of Imus", "ADM4_EN": "Bucandala I"},
         "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [0, 1], [1, 1], [0, 0]]]}},
        {"properties": {"ADM1_EN": "REGION IV-A (CALABARZON)", "ADM2_EN": "CAVITE",
                        "ADM3_EN": "City of Imus", "ADM4_EN": "Santo Nino"},  # matches "Sto. Niño"
         "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [0, 2], [2, 2], [0, 0]]]}},
    ]
    matched, unmatched = match_file(features, midx, midx_noprov, bidx)
    ids = {m[0] for m in matched}
    assert ids == {"0402109011", "0402109099"}
    assert unmatched == []


def test_match_file_reports_unmatched_municipality():
    midx, midx_noprov = build_muni_index(DB_REGIONS, DB_PROVINCES, DB_MUNIS)
    bidx = build_brgy_index(DB_BRGYS)
    features = [{"properties": {"ADM1_EN": "REGION III (CENTRAL LUZON)", "ADM2_EN": "BULACAN",
                                "ADM3_EN": "Malolos", "ADM4_EN": "X"},
                 "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [0, 1], [1, 1], [0, 0]]]}}]
    matched, unmatched = match_file(features, midx, midx_noprov, bidx)
    assert matched == []
    assert unmatched and unmatched[0]["reason"] == "municipality_not_found"
