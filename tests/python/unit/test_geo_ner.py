"""
Unit tests for Geo-NER location precision:
- explicit-coordinate parsing (PHIVOLCS/PAGASA bulletins)
- specificity-ranked primary-location selection
- island/region classification

These exercise pure helpers only (no NER model download, no geocoding network).
"""
import os
import sys

import pytest

# Resolve backend package + lib.* imports (mirror other backend tests).
PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "..")
BACKEND_PY = os.path.join(PROJECT_ROOT, "backend", "python")
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, BACKEND_PY)

from backend.python.models.geo_ner import GeoNER  # noqa: E402

geo = GeoNER()  # constructor does NOT load the model (lazy)

PHIVOLCS_TEXT = (
    "A tsunami warning was raised after a magnitude 7.8 earthquake hit offshore "
    "Sarangani on Monday morning. PHIVOLCS recorded it at 7:37 a.m. with a depth "
    "of 10 kilometers, later upgraded to magnitude 7.8 with a depth of 33 "
    "kilometers. It was located 05.57°N, 124.98°E - 032 km S 04° W "
    "of Maasim, Sarangani."
)


class TestExplicitCoordinates:
    def test_parses_phivolcs_directional_coords(self):
        results = geo._extract_explicit_coordinates(PHIVOLCS_TEXT)
        assert len(results) == 1
        loc = results[0]
        assert loc["location_type"] == "coordinates"
        assert loc["source"] == "explicit_coords"
        assert loc["confidence"] == pytest.approx(0.99)
        assert loc["latitude"] == pytest.approx(5.57, abs=0.01)
        assert loc["longitude"] == pytest.approx(124.98, abs=0.01)

    def test_ignores_magnitude_depth_and_time(self):
        text = "magnitude 7.8 earthquake, depth of 33 kilometers, recorded at 7:37 a.m."
        assert geo._extract_explicit_coordinates(text) == []

    def test_rejects_coordinates_outside_philippines(self):
        # London ~ 51.5N, 0.12W — outside the PH bounding box.
        assert geo._extract_explicit_coordinates("located 51.5000°N, 0.1200°W") == []

    def test_label_uses_most_specific_named_place(self):
        named = [
            {"location_name": "Mindanao", "location_type": "region"},
            {"location_name": "Sarangani", "location_type": "province"},
        ]
        results = geo._extract_explicit_coordinates(
            "located 05.57°N, 124.98°E", named_locations=named
        )
        assert results[0]["location_name"] == "Sarangani"  # region is skipped


class TestSelectPrimaryLocation:
    @staticmethod
    def _loc(name, type_, conf=0.9, coords=True):
        d = {"location_name": name, "location_type": type_, "confidence": conf}
        if coords:
            d["latitude"] = 10.0
            d["longitude"] = 122.0
        return d

    def test_explicit_coordinates_win(self):
        locs = [
            self._loc("Mindanao", "region"),
            self._loc("Sarangani", "province"),
            self._loc("Maasim", "city"),
            self._loc("5.57, 124.98", "coordinates", conf=0.99),
        ]
        assert geo.select_primary_location(locs)["location_type"] == "coordinates"

    def test_city_beats_province_and_region(self):
        locs = [
            self._loc("Mindanao", "region"),
            self._loc("Sarangani", "province"),
            self._loc("Maasim", "city"),
        ]
        assert geo.select_primary_location(locs)["location_name"] == "Maasim"

    def test_province_beats_region(self):
        locs = [self._loc("Mindanao", "region"), self._loc("Sarangani", "province")]
        assert geo.select_primary_location(locs)["location_name"] == "Sarangani"

    def test_region_never_wins_even_with_higher_confidence(self):
        locs = [
            self._loc("Mindanao", "region", conf=0.99),
            self._loc("Maasim", "city", conf=0.50),
        ]
        assert geo.select_primary_location(locs)["location_name"] == "Maasim"

    def test_ignores_entries_without_coordinates(self):
        locs = [
            self._loc("Maasim", "city", coords=False),
            self._loc("Sarangani", "province"),
        ]
        assert geo.select_primary_location(locs)["location_name"] == "Sarangani"

    def test_returns_none_when_no_candidate_has_coords(self):
        assert geo.select_primary_location([self._loc("Maasim", "city", coords=False)]) is None
        assert geo.select_primary_location([]) is None


class TestClassifyRegion:
    def test_island_groups_classified_as_region(self):
        assert geo._classify_location_type("Mindanao") == "region"
        assert geo._classify_location_type("Luzon") == "region"
        assert geo._classify_location_type("Visayas") == "region"

    def test_named_region_classified_as_region(self):
        assert geo._classify_location_type("CALABARZON") == "region"

    def test_specific_place_not_region(self):
        assert geo._classify_location_type("Maasim City") == "city"
