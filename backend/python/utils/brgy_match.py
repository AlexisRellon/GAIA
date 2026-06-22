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


# append to backend/python/utils/brgy_match.py

def build_muni_index(regions, provinces, munis):
    """Return (idx, idx_noprov):
      idx[(norm_region, norm_province, norm_muni)] -> muni 7-digit prefix
      idx_noprov[(norm_region, norm_muni)]         -> muni 7-digit prefix
    Args are lists of (code10, name). NCR-style province-less municipalities are
    reachable via idx_noprov.
    """
    region_by2 = {c[:2]: normalize_admin(n) for c, n in regions}
    prov_by5 = {c[:5]: normalize_admin(n) for c, n in provinces}
    idx, idx_noprov = {}, {}
    for code10, name in munis:
        muni7 = code10[:7]
        nreg = region_by2.get(code10[:2], "")
        nprov = prov_by5.get(code10[:5], "")
        nmuni = normalize_admin(name)
        idx[(nreg, nprov, nmuni)] = muni7
        idx_noprov[(nreg, nmuni)] = muni7
    return idx, idx_noprov


def build_brgy_index(brgys):
    """brgys: list of (code10, name) -> { (muni7, norm_brgy): code10 }."""
    out = {}
    for code10, name in brgys:
        out[(code10[:7], normalize_brgy(name))] = code10
    return out


def match_file(features, muni_idx, muni_idx_noprov, brgy_idx):
    """Match one faeldon municipality file's features to DB barangay ids.

    Returns (matched, unmatched):
      matched   -> list of (db_code10, geometry_dict)
      unmatched -> list of {reason, region, province, municipality, barangay}
    All features in a file share region/province/municipality, so resolve the
    municipality once, then match each barangay within its 7-digit prefix.
    """
    matched, unmatched = [], []
    if not features:
        return matched, unmatched

    p0 = features[0].get("properties", {})
    nreg = normalize_admin(p0.get("ADM1_EN", ""))
    nprov = normalize_admin(p0.get("ADM2_EN", ""))
    nmuni = normalize_admin(p0.get("ADM3_EN", ""))
    muni7 = muni_idx.get((nreg, nprov, nmuni)) or muni_idx_noprov.get((nreg, nmuni))

    if muni7 is None:
        unmatched.append({"reason": "municipality_not_found", "region": nreg,
                          "province": nprov, "municipality": nmuni, "barangay": None})
        return matched, unmatched

    for feat in features:
        props = feat.get("properties", {})
        geom = feat.get("geometry")
        nbrgy = normalize_brgy(props.get("ADM4_EN", ""))
        code10 = brgy_idx.get((muni7, nbrgy))
        if code10 and geom:
            matched.append((code10, geom))
        else:
            unmatched.append({"reason": "barangay_not_found", "region": nreg,
                              "province": nprov, "municipality": nmuni,
                              "barangay": props.get("ADM4_EN")})
    return matched, unmatched
