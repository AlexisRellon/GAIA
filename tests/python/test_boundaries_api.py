"""
Unit tests for boundaries_api input validation (GV-01).

Covers the security-relevant path: untrusted location names are validated
(charset allowlist + length) before reaching the parameterized DB lookup.
"""
import os
import sys

import pytest

PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
BACKEND_PY = os.path.join(PROJECT_ROOT, "backend", "python")
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, BACKEND_PY)

from fastapi import HTTPException  # noqa: E402
from backend.python import boundaries_api as b  # noqa: E402


class TestValidateLocationName:
    @pytest.mark.parametrize(
        "name",
        [
            "Imus",
            "Alapan I-B",
            "City of Cavite",
            "Quezon City",
            "General Trias",
            "Lapu-Lapu",
            "O'Donnell",
            "Sablayan (Pob.)",
            "Niñofranco",
        ],
    )
    def test_accepts_valid_names(self, name):
        assert b._validate_location_name(name) == name.strip()

    def test_strips_surrounding_whitespace(self):
        assert b._validate_location_name("  Imus  ") == "Imus"

    @pytest.mark.parametrize(
        "bad",
        [
            "",
            "   ",
            "a" * 101,           # too long
            "<script>",          # angle brackets
            "Imus; DROP TABLE",  # semicolon
            "a|b",               # pipe
            "a`b",               # backtick
            "a$b",               # dollar
            "a\x00b",            # null byte
            "a\nb",              # newline
        ],
    )
    def test_rejects_invalid_names(self, bad):
        with pytest.raises(HTTPException) as exc_info:
            b._validate_location_name(bad)
        assert exc_info.value.status_code == 400
