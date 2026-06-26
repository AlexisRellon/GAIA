"""
Boundaries API - Serve Philippine administrative boundaries by location.

Resolves a single administrative boundary (region / province / city /
municipality / barangay) to a GeoJSON FeatureCollection for the map's boundary
overlay (GV-01).

Backed by PostGIS (`gaia.get_boundary_geojson`) rather than parsing multi-MB
GeoJSON files on every request:
  * Optimization — one indexed row + DB-side geometry simplification, instead of
    reading + JSON-parsing whole boundary files per request.
  * Security (OWASP / FASTAPI-INJECT-001) — the lookup is a parameterized RPC
    (`p_name` is a bound parameter), so the user-supplied name can never be
    interpolated into SQL. Input is validated (FASTAPI-VALID-001) and errors are
    generic (no internal detail leakage).
"""

import logging
import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse

from backend.python.lib.supabase_client import supabase
from backend.python.middleware.rate_limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/boundaries", tags=["boundaries"])

# Boundaries change rarely — allow browser/CDN caching to cut load.
_CACHE_CONTROL = "public, max-age=3600"

# Defense-in-depth input validation (the DB call is already parameterized).
# Allow letters (incl. Unicode/ñ/accents via \w), digits, a literal space and
# the punctuation that appears in PSGC place names. A literal space (not \s)
# keeps newlines/tabs/control whitespace out. Reject everything else.
_MAX_NAME_LEN = 100
_VALID_NAME_RE = re.compile(r"^[\w \-'.,()&/]+$", re.UNICODE)


def _validate_location_name(raw: str) -> str:
    """Validate + normalize the user-supplied location name, or raise 400."""
    clean = (raw or "").strip()
    if not clean or len(clean) > _MAX_NAME_LEN or not _VALID_NAME_RE.match(clean):
        # Generic message — do not echo attacker input back verbatim.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid location name")
    return clean


@router.get("/health")
@limiter.limit("60/minute")
async def health_check(request: Request) -> dict:
    """Health check — reports whether the boundary data source is configured.
    
    This endpoint remains public to support open dashboard map visualization
    and system status checks without requiring authentication.
    """
    return {
        "status": "healthy" if supabase is not None else "degraded",
        "source": "postgis:gaia.get_boundary_geojson",
    }


@router.get("/{location_name:path}")
@limiter.limit("30/minute")
async def get_location_boundary(location_name: str, request: Request) -> dict:
    """Return the GeoJSON boundary for a location name (any admin level).

    Resolution prefers an exact larger-unit match (e.g. "Cavite" -> province,
    "Quezon City" -> city), bridges affix differences ("Imus" -> "City of
    Imus"), and falls back to barangay only when nothing larger matches.
    
    This endpoint remains public to support the open dashboard map visualization
    without requiring an active session.
    """
    clean = _validate_location_name(location_name)

    if supabase is None:
        # Fail closed with a generic error; never expose configuration details.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Boundary service unavailable",
        )

    try:
        # Parameterized RPC: `p_name` is bound, not concatenated into SQL.
        response = supabase.schema("gaia").rpc(
            "get_boundary_geojson", {"p_name": clean}
        ).execute()
    except Exception as exc:  # noqa: BLE001
        # Log internally; return a generic message to the client.
        logger.error("Boundary lookup failed for %r: %s", clean, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Boundary lookup failed",
        ) from exc

    feature: Optional[dict] = response.data if isinstance(response.data, dict) else None
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Boundary not found for '{clean}'",
        )

    props = feature.get("properties") or {}
    content = {
        "type": "FeatureCollection",
        "features": [feature],
        "metadata": {
            "location": clean,
            "name": props.get("name"),
            "psgc_code": props.get("psgc_code"),
            "boundary_level": props.get("boundary_level"),
        },
    }
    return JSONResponse(content=content, headers={"Cache-Control": _CACHE_CONTROL})
