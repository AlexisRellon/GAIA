# backend/python/utils/brgy_match.py
"""
Pure (no DB / no network) matching logic for re-ingesting barangay geometry
from faeldon/philippines-json-maps into gaia.ph_administrative_boundaries.

Matching is by administrative NAME hierarchy, never by PSGC code: faeldon's
2019 codes use a different scheme than the DB. faeldon supplies ADM1_EN
(region), ADM2_EN (province), ADM3_EN (municipality), ADM4_EN (barangay); the
DB links barangay->municipality->province->region by zero-padded psgc_code
prefixes (region=2, province=5, municipality=7 digits).
"""
import re
import unicodedata

_PARENS = re.compile(r"\([^)]*\)")
_CITY_AFFIX = re.compile(r"^(city of|municipality of)\s+|\s+(city|municipality)$")
_NON_ALNUM = re.compile(r"[^a-z0-9 ]+")
_WS = re.compile(r"\s+")
_ABBREV = (
    (re.compile(r"\bsto\b"), "santo"),
    (re.compile(r"\bsta\b"), "santa"),
    (re.compile(r"\bgen\b"), "general"),
    (re.compile(r"\bpob\b"), "poblacion"),
)


def _fold(text: str) -> str:
    """Lowercase + strip accents (ñ->n, é->e) via NFKD, drop combining marks."""
    nfkd = unicodedata.normalize("NFKD", text or "")
    no_marks = "".join(c for c in nfkd if not unicodedata.combining(c))
    return no_marks.lower()


def _core(text: str) -> str:
    """Shared: fold, drop parentheticals, expand abbreviations, strip punctuation."""
    s = _fold(text)
    s = _PARENS.sub(" ", s)              # drop "(Pob.)", "(Ilocos Region)", etc.
    s = s.replace(".", " ")              # "sto." -> "sto "
    s = _WS.sub(" ", s).strip()
    for pat, repl in _ABBREV:
        s = pat.sub(repl, s)
    s = _NON_ALNUM.sub(" ", s)
    return _WS.sub(" ", s).strip()


def normalize_admin(name: str) -> str:
    """Normalize region/province/municipality names (mirrors gaia.norm_admin_name)."""
    s = _core(name)
    prev = None
    while prev != s:                     # strip affixes until stable (handles both ends)
        prev = s
        s = _CITY_AFFIX.sub("", s).strip()
    return s


def normalize_brgy(name: str) -> str:
    """Normalize a barangay name (no city/municipality affix stripping)."""
    return _core(name)
