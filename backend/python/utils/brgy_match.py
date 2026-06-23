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


_ROMAN = {
    "i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5", "vi": "6", "vii": "7",
    "viii": "8", "ix": "9", "x": "10", "xi": "11", "xii": "12", "xiii": "13",
    "xiv": "14", "xv": "15", "xvi": "16", "xvii": "17", "xviii": "18", "xix": "19",
    "xx": "20",
}


def _roman_to_arabic_tail(s: str) -> str:
    """Convert a trailing standalone Roman-numeral token to Arabic
    ('aniban i' -> 'aniban 1'), so faeldon 'Aniban I' matches DB 'Aniban 1'.
    Applied to both sides, so names already using Arabic are unaffected."""
    parts = s.rsplit(" ", 1)
    if len(parts) == 2 and parts[1] in _ROMAN:
        return f"{parts[0]} {_ROMAN[parts[1]]}"
    return s


def normalize_brgy(name: str) -> str:
    """Normalize a barangay name (no city/municipality affix stripping)."""
    return _roman_to_arabic_tail(_core(name))


# Region names changed between faeldon's 2019 vintage and the DB's 2024 PSGC
# (MIMAROPA was "Region IV-B"; ARMM became BARMM; NIR was re-created). So region
# is NOT used as the primary match key — (province, municipality) is, because
# province names are globally unique and stable across that reorg. Region is only
# a fallback for province-less LGUs (NCR); these aliases keep that path robust.
_REGION_ALIASES = {
    "region iv b": "mimaropa",
    "mimaropa region": "mimaropa",
    "autonomous region in muslim mindanao": "armm",
    "bangsamoro autonomous region in muslim mindanao": "armm",
}


def canon_region(norm_region: str) -> str:
    """Collapse known region-name variants to a stable token (fallback path only)."""
    return _REGION_ALIASES.get(norm_region, norm_region)


def build_muni_index(regions, provinces, munis):
    """Return (idx_prov, idx_reg):
      idx_prov[(norm_province, norm_muni)]             -> muni 7-digit prefix (primary)
      idx_reg[(canon_region(norm_region), norm_muni)]  -> muni 7-digit prefix (fallback)
    Args are lists of (code10, name). (province, municipality) is the primary key
    because province names survive the 2019<->2024 reorg; idx_reg covers
    province-less LGUs (e.g. NCR), where region names DO match.
    """
    region_by2 = {c[:2]: canon_region(normalize_admin(n)) for c, n in regions}
    prov_by5 = {c[:5]: normalize_admin(n) for c, n in provinces}
    idx_prov, idx_reg = {}, {}
    for code10, name in munis:
        muni7 = code10[:7]
        nreg = region_by2.get(code10[:2], "")
        nprov = prov_by5.get(code10[:5], "")
        nmuni = normalize_admin(name)
        if nprov:
            idx_prov[(nprov, nmuni)] = muni7
        idx_reg[(nreg, nmuni)] = muni7
    return idx_prov, idx_reg


# City of Manila is split into districts by faeldon (ADM3), but the DB codes all
# of its ~897 "Barangay N" rows under one city — across district prefixes
# 1380601-1380614, which all share the 6-digit "138060". Bucket them under the
# city so faeldon's district-split files resolve to a single Manila barangay set.
MANILA_PREFIX6 = "138060"
MANILA_MUNI7 = "1380600"


def build_brgy_index(brgys):
    """brgys: list of (code10, name) -> { (muni7, norm_brgy): code10 }.
    Manila barangays (prefix 138060*) are bucketed under MANILA_MUNI7."""
    out = {}
    for code10, name in brgys:
        muni7 = MANILA_MUNI7 if code10[:6] == MANILA_PREFIX6 else code10[:7]
        out[(muni7, normalize_brgy(name))] = code10
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
    nreg = canon_region(normalize_admin(p0.get("ADM1_EN", "")))
    nprov = normalize_admin(p0.get("ADM2_EN", ""))
    nmuni = normalize_admin(p0.get("ADM3_EN", ""))
    if "city of manila" in nprov:
        # faeldon splits Manila into per-district files (ADM3); the DB codes all
        # of Manila's "Barangay N" under one city. Resolve straight to it.
        muni7 = MANILA_MUNI7
    else:
        # Primary key is (province, municipality) — province names are stable
        # across the 2019<->2024 PSGC reorg; region is a fallback for NCR.
        muni7 = muni_idx.get((nprov, nmuni)) or muni_idx_noprov.get((nreg, nmuni))

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
