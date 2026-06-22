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
