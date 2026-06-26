"""
Analytics API for GAIA Dashboard
Provides real-time analytics, statistics, and trends for hazard data.

Supports: CD-01 (Dashboard Analytics), AAM-01 (Trend Analysis), AAM-02 (KPI Dashboard)
New AI/ML Metrics: Confidence by Type, False Positive Rate, Source Accuracy, Processing Rate, Duplicates, System Health
"""

import os
import logging
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

# Add parent directory to path for lib imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.supabase_client import supabase

# Import Redis caching for performance
from backend.python.middleware.redis_cache import (
    cache_response, 
    get_or_set, 
    generate_cache_key,
    CACHE_TTLS
)

logger = logging.getLogger(__name__)

# RBAC dependency for admin/validator access
from backend.python.middleware.rbac import (
    require_admin,
    get_current_user_optional,
    UserContext,
)

# Supabase client imported from centralized configuration

# Create router
router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


# ============================================================================
# Pydantic Models
# ============================================================================

class HazardStats(BaseModel):
    """Overall hazard statistics"""
    total_hazards: int
    active_hazards: int
    resolved_hazards: int
    unverified_reports: int
    avg_confidence: float
    avg_time_to_action: Optional[float]  # In minutes


class HazardTrend(BaseModel):
    """Time-series data for hazard trends - supports all hazard types dynamically"""
    date: str
    volcanic_eruption: int = 0
    earthquake: int = 0
    flood: int = 0
    landslide: int = 0
    fire: int = 0
    storm_surge: int = 0
    typhoon: int = 0
    tsunami: int = 0
    drought: int = 0
    tornado: int = 0
    coastal_erosion: int = 0
    other: int = 0
    total: int = 0
    
    class Config:
        extra = 'allow'  # Allow additional hazard types


class RegionStats(BaseModel):
    """Hazard statistics by region"""
    region: str
    total_count: int
    active_count: int
    resolved_count: int


class HazardTypeDistribution(BaseModel):
    """Distribution of hazards by type"""
    hazard_type: str
    count: int
    percentage: float


class SourceBreakdown(BaseModel):
    """Distribution of hazards by source type"""
    source_type: str
    count: int
    percentage: float


class RecentAlert(BaseModel):
    """Recent hazard alert"""
    id: str
    hazard_type: str
    severity: Optional[str]  # Can be NULL in database
    location_name: Optional[str]  # Can be NULL
    admin_division: Optional[str]  # Can be NULL
    confidence_score: float
    detected_at: str
    status: str


# ============================================================================
# AI/ML Quality Metrics Models (New)
# ============================================================================

class ConfidenceByTypeMetric(BaseModel):
    """Average confidence score by hazard type"""
    hazard_type: str
    avg_confidence: float
    count: int
    min_confidence: float
    max_confidence: float


class FalsePositiveRateMetric(BaseModel):
    """False positive rate calculation"""
    fpr_percentage: float
    rejected_count: int
    total_verified: int
    total_rejected: int
    trend: str  # "up", "down", "stable"
    previous_period_fpr: Optional[float]


class SourceAccuracyMetric(BaseModel):
    """Accuracy comparison between RSS and citizen reports"""
    rss_verified_count: int
    rss_rejected_count: int
    rss_accuracy_percentage: float
    citizen_verified_count: int
    citizen_rejected_count: int
    citizen_accuracy_percentage: float
    overall_accuracy_percentage: float


class ProcessingRateMetric(BaseModel):
    """Hazard processing rate metrics"""
    hourly_average: float
    daily_average: float
    last_24h_total: int
    last_hour_count: int
    trend: str
    highest_hour: Optional[str]
    highest_hour_count: int


class DuplicateDetectionMetric(BaseModel):
    """Duplicate detection effectiveness"""
    duplicate_percentage: float
    duplicate_count: int
    total_hazards: int
    duplicate_detection_enabled: bool
    trend: str


class SystemHealthMetric(BaseModel):
    """System performance and health metrics"""
    health_score: int  # 0-100
    status: str  # "healthy", "warning", "critical"
    avg_response_time_ms: Optional[float]  # None until request timing instrumentation available
    error_rate_percentage: float
    uptime_percentage: Optional[float]  # None until monitoring service integration
    metrics_timestamp: str


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/stats", response_model=HazardStats)
async def get_hazard_stats():
    """
    Get overall hazard statistics (cached for 30s)
    """
    cache_key = generate_cache_key("analytics:stats")
    
    async def fetch_stats():
        # Get total hazards
        total_response = supabase.schema("gaia").from_('hazards').select('id', count='exact').execute()
        total_hazards = total_response.count or 0
        
        # Get active hazards
        active_response = supabase.schema("gaia").from_('hazards').select('id', count='exact').eq('status', 'active').execute()
        active_hazards = active_response.count or 0
        
        # Get resolved hazards
        resolved_response = supabase.schema("gaia").from_('hazards').select('id', count='exact').eq('status', 'resolved').execute()
        resolved_hazards = resolved_response.count or 0
        
        # Get unverified reports (confidence < 0.7)
        unverified_response = supabase.schema("gaia").from_('hazards').select('id', count='exact').lt('confidence_score', 0.7).eq('validated', False).execute()
        unverified_reports = unverified_response.count or 0
        
        # Get average confidence score (direct query instead of RPC)
        all_hazards_response = supabase.schema('gaia').from_('hazards').select('confidence_score').execute()
        if all_hazards_response.data:
            confidence_scores = [h['confidence_score'] for h in all_hazards_response.data if h.get('confidence_score') is not None]
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
        else:
            avg_confidence = 0.0
        
        avg_time_to_action = None
        
        return {
            "total_hazards": total_hazards,
            "active_hazards": active_hazards,
            "resolved_hazards": resolved_hazards,
            "unverified_reports": unverified_reports,
            "avg_confidence": round(avg_confidence, 2),
            "avg_time_to_action": round(avg_time_to_action / 60, 2) if avg_time_to_action else None
        }
    
    try:
        data = await get_or_set(cache_key, fetch_stats, ttl=CACHE_TTLS.get("analytics:stats", 30))
        return HazardStats(**data)
        
    except Exception as e:
        logger.exception("Error fetching hazard statistics")
        raise HTTPException(status_code=500, detail="Internal server error while fetching hazard statistics")


@router.get("/trends", response_model=List[HazardTrend])
async def get_hazard_trends(
    days: int = Query(30, ge=7, le=90, description="Number of days to retrieve (7-90)")
):
    """
    Get hazard trends over time (cached for 2 minutes)
    """
    cache_key = generate_cache_key("analytics:trends", days=days)
    
    async def fetch_trends():
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days - 1)
        
        response = supabase.schema('gaia').from_('hazards') \
            .select('hazard_type,detected_at') \
            .gte('detected_at', start_date.isoformat()) \
            .lte('detected_at', end_date.isoformat()) \
            .execute()
        
        date_data = {}
        all_hazard_types = [
            'volcanic_eruption', 'earthquake', 'flood', 'landslide', 'fire',
            'storm_surge', 'typhoon', 'tsunami', 'drought', 'tornado',
            'coastal_erosion', 'other'
        ]
        
        for i in range(days):
            date_str = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
            date_data[date_str] = {'date': date_str, 'total': 0}
            for hazard_type in all_hazard_types:
                date_data[date_str][hazard_type] = 0
        
        if response.data:
            for item in response.data:
                detected = datetime.fromisoformat(item['detected_at'].replace('Z', '+00:00'))
                date_str = detected.strftime('%Y-%m-%d')
                if date_str in date_data:
                    hazard_type = item['hazard_type']
                    if hazard_type in date_data[date_str]:
                        date_data[date_str][hazard_type] += 1
                    date_data[date_str]['total'] += 1
        
        return sorted(list(date_data.values()), key=lambda x: x['date'])
    
    try:
        data = await get_or_set(cache_key, fetch_trends, ttl=CACHE_TTLS.get("analytics:trends", 120))
        return [HazardTrend(**item) for item in data]
        
    except Exception as e:
        logger.exception("Error fetching hazard trends")
        raise HTTPException(status_code=500, detail="Internal server error while fetching hazard trends")


@router.get("/regions", response_model=List[RegionStats])
async def get_region_stats():
    """
    Get hazard statistics by region (cached for 3 minutes)
    """
    cache_key = generate_cache_key("analytics:regions")
    
    async def fetch_regions():
        from backend.python.philippine_regions import (
            get_region_from_location,
            PROVINCE_TO_REGION,
            PHILIPPINE_ADMIN_MAPPING,
        )

        response = supabase.schema('gaia').from_('hazards') \
            .select('admin_division,location_name,status') \
            .execute()
        
        if not response.data:
            return []
        
        known_regions = {v['region'] for v in PROVINCE_TO_REGION.values()}
        known_regions.update({'NCR', 'CAR', 'BARMM'})

        city_lookup = {k.lower(): v for k, v in PHILIPPINE_ADMIN_MAPPING.items()}
        province_lookup = {k.lower(): v for k, v in PROVINCE_TO_REGION.items()}

        def _try_resolve(text: str) -> Optional[str]:
            """Try to resolve a single text fragment to a region code."""
            if not text:
                return None
            clean = text.strip()
            if not clean or clean.lower() == 'philippines':
                return None

            if clean in known_regions:
                return clean

            result = get_region_from_location(city=clean)
            if result:
                return result['region']
            result = get_region_from_location(province=clean)
            if result:
                return result['region']

            words = clean.split()
            if len(words) > 1:
                without_suffix = ' '.join(words[:-1])
                result = get_region_from_location(city=without_suffix)
                if result:
                    return result['region']

            lower = clean.lower()
            for city_key, data in city_lookup.items():
                if city_key in lower or lower in city_key:
                    return data['region']
            for prov_key, data in province_lookup.items():
                if prov_key in lower or lower in prov_key:
                    return data['region']

            return None

        def resolve_region(admin_div: str, location_name: str) -> str:
            """Resolve admin_division + location_name to a standardized region code."""
            for candidate in [admin_div, location_name]:
                if not candidate or not candidate.strip():
                    continue

                hit = _try_resolve(candidate)
                if hit:
                    return hit

                parts = [p.strip() for p in candidate.split(',') if p.strip()]
                for part in parts:
                    hit = _try_resolve(part)
                    if hit:
                        return hit

            return 'Unknown'

        region_data: Dict[str, Dict] = {}
        for item in response.data:
            raw_admin = item.get('admin_division') or ''
            loc_name = item.get('location_name') or ''
            region = resolve_region(raw_admin, loc_name)

            if region not in region_data:
                region_data[region] = {
                    'region': region,
                    'total_count': 0,
                    'active_count': 0,
                    'resolved_count': 0
                }
            
            region_data[region]['total_count'] += 1
            if item.get('status') == 'active':
                region_data[region]['active_count'] += 1
            elif item.get('status') == 'resolved':
                region_data[region]['resolved_count'] += 1
        
        return sorted(list(region_data.values()), key=lambda x: x['total_count'], reverse=True)
    
    try:
        data = await get_or_set(cache_key, fetch_regions, ttl=CACHE_TTLS.get("analytics:regions", 180))
        return [RegionStats(**item) for item in data]
        
    except Exception as e:
        logger.exception("Error fetching region statistics")
        raise HTTPException(status_code=500, detail="Internal server error while fetching region statistics")


@router.get("/distribution", response_model=List[HazardTypeDistribution])
async def get_hazard_distribution():
    """
    Get distribution of hazards by type (cached for 2 minutes)
    """
    cache_key = generate_cache_key("analytics:distribution")
    
    async def fetch_distribution():
        total_response = supabase.schema("gaia").from_('hazards').select('id', count='exact').execute()
        total = total_response.count or 0
        
        if total == 0:
            return []
        
        response = supabase.schema("gaia").from_('hazards') \
            .select('hazard_type') \
            .execute()
        
        type_counts = {}
        for item in response.data:
            hazard_type = item['hazard_type']
            type_counts[hazard_type] = type_counts.get(hazard_type, 0) + 1
        
        distribution = []
        for hazard_type, count in type_counts.items():
            percentage = (count / total) * 100
            distribution.append({
                "hazard_type": hazard_type,
                "count": count,
                "percentage": round(percentage, 1)
            })
        
        distribution.sort(key=lambda x: x["count"], reverse=True)
        return distribution
    
    try:
        data = await get_or_set(cache_key, fetch_distribution, ttl=CACHE_TTLS.get("analytics:distribution", 120))
        return [HazardTypeDistribution(**item) for item in data]
        
    except Exception as e:
        logger.exception("Error fetching hazard distribution")
        raise HTTPException(status_code=500, detail="Internal server error while fetching hazard distribution")


@router.get("/source-breakdown", response_model=List[SourceBreakdown])
async def get_source_breakdown():
    """
    Get distribution of hazards by source type (cached for 2 minutes)
    """
    cache_key = generate_cache_key("analytics:source-breakdown")

    def _is_rpc_unavailable_error(rpc_error: Exception) -> bool:
        """Return True only for known RPC-unavailable signatures (e.g., PGRST202)."""
        payload = rpc_error.args[0] if getattr(rpc_error, "args", None) else None

        if isinstance(payload, dict):
            code = str(payload.get("code") or "")
            message = str(payload.get("message") or "")
            details = str(payload.get("details") or "")
        else:
            code = str(getattr(rpc_error, "code", "") or "")
            message = str(getattr(rpc_error, "message", "") or "")
            details = str(getattr(rpc_error, "details", "") or "")

        combined = f"{code} {message} {details} {rpc_error}".lower()
        return (
            "pgrst202" in combined
            or "could not find the function" in combined
            or "schema cache" in combined
            or "rpc unavailable" in combined
        )

    async def fetch_source_breakdown():
        source_rows = []

        try:
            # Preferred path: server-side aggregation via RPC
            response = supabase.schema("gaia").rpc('get_source_breakdown', {}).execute()
            source_rows = response.data or []
        except Exception as rpc_error:
            if not _is_rpc_unavailable_error(rpc_error):
                logger.error(f"get_source_breakdown RPC failed with non-recoverable error: {rpc_error}")
                raise

            logger.warning(f"get_source_breakdown RPC unavailable, using fallback aggregation: {rpc_error}")
            # Fallback path: read source_type values and aggregate in Python
            fallback_response = supabase.schema("gaia").from_('hazards').select('source_type').execute()
            fallback_counts = {}
            for item in fallback_response.data or []:
                source_type = (item.get('source_type') or 'unknown').strip().lower()
                fallback_counts[source_type] = fallback_counts.get(source_type, 0) + 1
            source_rows = [
                {"source_type": source_type, "count": count}
                for source_type, count in fallback_counts.items()
            ]

        if not source_rows:
            return []

        # Normalize source_type first, then compute totals from normalized buckets.
        # This keeps percentages consistent when RPC rows differ only by case/whitespace.
        aggregated_counts = {}
        for item in source_rows:
            source_type = (item.get('source_type') or 'unknown').strip().lower()
            count = item.get('count', 0)
            aggregated_counts[source_type] = aggregated_counts.get(source_type, 0) + count

        total = sum(aggregated_counts.values())

        if total == 0:
            return []

        breakdown = []
        for source_type, count in aggregated_counts.items():
            percentage = (count / total) * 100 if total > 0 else 0
            breakdown.append({
                "source_type": source_type,
                "count": count,
                "percentage": round(percentage, 1)
            })

        breakdown.sort(key=lambda x: x["count"], reverse=True)
        return breakdown

    try:
        data = await get_or_set(cache_key, fetch_source_breakdown, ttl=CACHE_TTLS.get("analytics:source-breakdown", 120))
        return [SourceBreakdown(**item) for item in data]

    except Exception as e:
        logger.exception("Error fetching source breakdown")
        raise HTTPException(status_code=500, detail="Internal server error while fetching source breakdown")


@router.get("/recent-alerts", response_model=List[RecentAlert])
async def get_recent_alerts(
    limit: int = Query(10, ge=1, le=50, description="Number of recent alerts to retrieve")
):
    """
    Get most recent hazard alerts (cached for 15 seconds)
    """
    cache_key = generate_cache_key("analytics:alerts", limit=limit)
    
    async def fetch_alerts():
        response = supabase.schema("gaia").from_('hazards') \
            .select('id, hazard_type, severity, location_name, admin_division, confidence_score, detected_at, status') \
            .order('detected_at', desc=True) \
            .limit(limit) \
            .execute()
        
        return response.data or []
    
    try:
        data = await get_or_set(cache_key, fetch_alerts, ttl=CACHE_TTLS.get("analytics:alerts", 15))
        return [RecentAlert(**item) for item in data]
        
    except Exception as e:
        logger.exception("Error fetching recent alerts")
        raise HTTPException(status_code=500, detail="Internal server error while fetching recent alerts")


# ============================================================================
# AI/ML Quality Metrics Endpoints (New - AAM-03, AAM-04, AAM-05, AAM-06)
# ============================================================================

@router.get("/confidence-by-type", response_model=List[ConfidenceByTypeMetric])
async def get_confidence_by_type(current_user: UserContext = Depends(require_admin)):
    """
    Get average confidence score by hazard type (cached for 3 minutes)
    
    AI/ML Quality Metric: Shows which hazard types have better model confidence
    Supports: AAM-03 (AI/ML Confidence Analysis)
    """
    cache_key = generate_cache_key("analytics:confidence-by-type")
    
    async def fetch_confidence_by_type():
        response = supabase.schema("gaia").from_('hazards') \
            .select('hazard_type, confidence_score') \
            .execute()
        
        if not response.data:
            return []
        
        type_stats: Dict[str, Dict] = {}
        for item in response.data:
            hazard_type = item.get('hazard_type', 'unknown')
            confidence = item.get('confidence_score')
            
            # Skip entries with missing or null confidence scores
            if confidence is None:
                continue
            
            if hazard_type not in type_stats:
                type_stats[hazard_type] = {
                    'scores': [],
                    'count': 0
                }
            
            type_stats[hazard_type]['scores'].append(confidence)
            type_stats[hazard_type]['count'] += 1
        
        result = []
        for hazard_type, stats in type_stats.items():
            scores = stats['scores']
            avg_confidence = sum(scores) / len(scores) if scores else 0.0
            min_confidence = min(scores) if scores else 0.0
            max_confidence = max(scores) if scores else 0.0
            
            result.append({
                'hazard_type': hazard_type,
                'avg_confidence': round(avg_confidence, 3),
                'count': stats['count'],
                'min_confidence': round(min_confidence, 3),
                'max_confidence': round(max_confidence, 3)
            })
        
        # Sort by avg_confidence descending
        result.sort(key=lambda x: x['avg_confidence'], reverse=True)
        return result
    
    try:
        data = await get_or_set(cache_key, fetch_confidence_by_type, ttl=CACHE_TTLS.get("analytics:confidence-by-type", 180))
        return [ConfidenceByTypeMetric(**item) for item in data]
        
    except Exception as e:
        logger.exception("Error fetching confidence by type")
        raise HTTPException(status_code=500, detail="Internal server error while fetching confidence metrics")


@router.get("/false-positive-rate", response_model=FalsePositiveRateMetric)
async def get_false_positive_rate(current_user: UserContext = Depends(require_admin)):
    """
    Get false positive rate from citizen reports (cached for 5 minutes)
    
    AI/ML Quality Metric: Measures validation quality - ratio of rejected to verified reports
    Lower FPR indicates better model reliability
    Supports: AAM-04 (False Positive Analysis)
    """
    async def fetch_fpr():
        def classify_validation_outcome(row: Dict[str, Any]) -> Optional[str]:
            """Classify citizen report outcome for FPR denominator ('verified'/'rejected'/None)."""
            status = (row.get('status') or '').strip().lower()
            validated = row.get('validated')
            promoted = row.get('promoted_to_hazard_id')
            validated_by = row.get('validated_by')

            verified_statuses = {'verified', 'approved', 'validated'}
            rejected_statuses = {'rejected', 'invalid', 'denied'}

            # Explicit status takes precedence over inferred flags.
            if status in rejected_statuses:
                return 'rejected'
            if status in verified_statuses:
                return 'verified'

            # Fallback heuristics for legacy/incomplete status values.
            if validated is True or promoted:
                return 'verified'
            if validated is False and validated_by:
                return 'rejected'

            # Unverified/pending/unknown rows are excluded from FPR denominator.
            return None

        # Calculate FPR over current 7-day window for like-for-like comparison
        now = datetime.now()
        cur_start = now - timedelta(days=7)
        cur_end = now
        prev_start = now - timedelta(days=14)
        prev_end = now - timedelta(days=7)
        
        # Fetch citizen_reports rows in the window and compute counts in Python
        cur_rows_response = supabase.schema("gaia").from_('citizen_reports') \
            .select('id, status, validated, validated_by, promoted_to_hazard_id, validated_at') \
            .gte('validated_at', cur_start.isoformat()) \
            .lte('validated_at', cur_end.isoformat()) \
            .execute()
        cur_rows = cur_rows_response.data or []

        rejected_count = 0
        verified_count = 0
        for r in cur_rows:
            outcome = classify_validation_outcome(r)
            if outcome == 'verified':
                verified_count += 1
            elif outcome == 'rejected':
                rejected_count += 1

        total_verified = verified_count + rejected_count
        fpr_percentage = (rejected_count / total_verified * 100) if total_verified > 0 else 0.0

        # Previous window
        prev_rows_response = supabase.schema("gaia").from_('citizen_reports') \
            .select('id, status, validated, validated_by, promoted_to_hazard_id, validated_at') \
            .gte('validated_at', prev_start.isoformat()) \
            .lte('validated_at', prev_end.isoformat()) \
            .execute()
        prev_rows = prev_rows_response.data or []

        prev_rejected_count = 0
        prev_verified_count = 0
        for r in prev_rows:
            outcome = classify_validation_outcome(r)
            if outcome == 'verified':
                prev_verified_count += 1
            elif outcome == 'rejected':
                prev_rejected_count += 1

        prev_total = prev_verified_count + prev_rejected_count
        previous_fpr = (prev_rejected_count / prev_total * 100) if prev_total > 0 else None
        
        # Determine trend
        if previous_fpr is None:
            trend = "stable"
        elif fpr_percentage < previous_fpr:
            trend = "down"  # Lower FPR is better
        elif fpr_percentage > previous_fpr:
            trend = "up"
        else:
            trend = "stable"
        
        return {
            'fpr_percentage': round(fpr_percentage, 2),
            'rejected_count': rejected_count,
            'total_verified': verified_count,
            'total_rejected': rejected_count,
            'trend': trend,
            'previous_period_fpr': round(previous_fpr, 2) if previous_fpr is not None else None
        }
    
    try:
        # Use live computation (no Redis cache) so triage updates are reflected immediately.
        data = await fetch_fpr()
        return FalsePositiveRateMetric(**data)
        
    except Exception as e:
        logger.exception("Error fetching false positive rate")
        raise HTTPException(status_code=500, detail="Internal server error while fetching false positive rate")


@router.get("/source-accuracy", response_model=SourceAccuracyMetric)
async def get_source_accuracy(current_user: UserContext = Depends(require_admin)):
    """
    Compare accuracy between RSS feeds and citizen reports (cached for 5 minutes)
    
    AI/ML Quality Metric: Shows which source type has better reliability
    Supports: AAM-05 (Source Reliability Analysis)
    """
    cache_key = generate_cache_key("analytics:source-accuracy")
    
    async def fetch_source_accuracy():
        # Get citizen data from citizen_reports 
        citizen_verified = supabase.schema("gaia").from_('citizen_reports') \
            .select('id', count='exact') \
            .eq('status', 'verified') \
            .execute()
        citizen_verified_count = citizen_verified.count or 0
        
        citizen_rejected = supabase.schema("gaia").from_('citizen_reports') \
            .select('id', count='exact') \
            .eq('status', 'rejected') \
            .execute()
        citizen_rejected_count = citizen_rejected.count or 0

        # Only validated outcomes should be included in accuracy denominator
        citizen_total = citizen_verified_count + citizen_rejected_count
        citizen_accuracy = (citizen_verified_count / citizen_total * 100) if citizen_total > 0 else 0.0

        # Get RSS data from hazards (RSS reports only - filter by source_type)
        rss_verified = supabase.schema("gaia").from_('hazards') \
            .select('id', count='exact') \
            .eq('validated', True) \
            .eq('source_type', 'rss') \
            .execute()
        rss_verified_count = rss_verified.count or 0
        
        rss_rejected = supabase.schema("gaia").from_('hazards') \
            .select('id', count='exact') \
            .eq('validated', False) \
            .eq('source_type', 'rss') \
            .execute()
        rss_rejected_count = rss_rejected.count or 0

        rss_total = rss_verified_count + rss_rejected_count
        rss_accuracy = (rss_verified_count / rss_total * 100) if rss_total > 0 else 0.0
        
        # Overall accuracy
        overall_verified = rss_verified_count + citizen_verified_count
        overall_total = rss_total + citizen_total
        overall_accuracy = (overall_verified / overall_total * 100) if overall_total > 0 else 0.0
        
        return {
            'rss_verified_count': rss_verified_count,
            'rss_rejected_count': rss_rejected_count,
            'rss_accuracy_percentage': round(rss_accuracy, 2),
            'citizen_verified_count': citizen_verified_count,
            'citizen_rejected_count': citizen_rejected_count,
            'citizen_accuracy_percentage': round(citizen_accuracy, 2),
            'overall_accuracy_percentage': round(overall_accuracy, 2)
        }
    
    try:
        data = await get_or_set(cache_key, fetch_source_accuracy, ttl=CACHE_TTLS.get("analytics:source-accuracy", 300))
        return SourceAccuracyMetric(**data)
        
    except Exception as e:
        logger.exception("Error fetching source accuracy")
        raise HTTPException(status_code=500, detail="Internal server error while fetching source accuracy")


@router.get("/processing-rate", response_model=ProcessingRateMetric)
async def get_processing_rate(current_user: UserContext = Depends(require_admin)):
    """
    Get hazard processing/detection rate (cached for 1 minute)
    
    Performance Metric: Shows system throughput - hazards detected per hour
    Supports: AAM-06 (Processing Rate Analysis)
    """
    cache_key = generate_cache_key("analytics:processing-rate")
    
    async def fetch_processing_rate():
        now = datetime.now()
        last_24h = now - timedelta(hours=24)
        last_hour = now - timedelta(hours=1)
        
        # Get last 24h data
        last_24h_response = supabase.schema("gaia").from_('hazards') \
            .select('detected_at') \
            .gte('detected_at', last_24h.isoformat()) \
            .execute()
        last_24h_count = len(last_24h_response.data or [])
        
        # Get last hour data
        last_hour_response = supabase.schema("gaia").from_('hazards') \
            .select('detected_at') \
            .gte('detected_at', last_hour.isoformat()) \
            .execute()
        last_hour_count = len(last_hour_response.data or [])
        
        # Calculate hourly and daily averages
        hourly_average = last_24h_count / 24.0
        daily_average = last_24h_count / 1.0  # Already in 24h window
        
        # Find highest hour
        hourly_counts: Dict[str, int] = {}
        if last_24h_response.data:
            for item in last_24h_response.data:
                detected_at = item.get('detected_at', '')
                if detected_at:
                    try:
                        hour_key = datetime.fromisoformat(detected_at.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:00')
                        hourly_counts[hour_key] = hourly_counts.get(hour_key, 0) + 1
                    except:
                        pass
        
        highest_hour = max(hourly_counts.items(), key=lambda x: x[1]) if hourly_counts else (None, 0)
        
        # Determine trend (compare to previous 24h)
        prev_24h_start = last_24h - timedelta(hours=24)
        prev_24h_response = supabase.schema("gaia").from_('hazards') \
            .select('id', count='exact') \
            .gte('detected_at', prev_24h_start.isoformat()) \
            .lt('detected_at', last_24h.isoformat()) \
            .execute()
        prev_24h_count = prev_24h_response.count or 0
        
        trend = "stable"
        if last_24h_count > prev_24h_count:
            trend = "up"
        elif last_24h_count < prev_24h_count:
            trend = "down"
        
        return {
            'hourly_average': round(hourly_average, 2),
            'daily_average': round(daily_average, 2),
            'last_24h_total': last_24h_count,
            'last_hour_count': last_hour_count,
            'trend': trend,
            'highest_hour': highest_hour[0],
            'highest_hour_count': highest_hour[1]
        }
    
    try:
        data = await get_or_set(cache_key, fetch_processing_rate, ttl=CACHE_TTLS.get("analytics:processing-rate", 60))
        return ProcessingRateMetric(**data)
        
    except Exception as e:
        logger.exception("Error fetching processing rate")
        raise HTTPException(status_code=500, detail="Internal server error while fetching processing rate")


@router.get("/duplicate-rate", response_model=DuplicateDetectionMetric)
async def get_duplicate_rate(current_user: UserContext = Depends(require_admin)):
    """
    Get duplicate detection rate (cached for 5 minutes)
    
    Data Quality Metric: Shows effectiveness of duplicate detection
    Supports: AAM-07 (Duplicate Detection Analysis)
    """
    cache_key = generate_cache_key("analytics:duplicate-rate")
    
    async def fetch_duplicate_rate():
        # Match RSS admin statistics: aggregate duplicate detection from rss_processing_logs
        # using the same fields and the same all-time calculation basis.
        all_logs = supabase.schema('gaia').from_('rss_processing_logs') \
            .select('items_processed, duplicates_detected') \
            .execute()

        all_data = all_logs.data or []
        total_processed = 0
        total_duplicates = 0
        for row in all_data:
            try:
                total_processed += int(row.get('items_processed') or 0)
            except (ValueError, TypeError):
                pass
            try:
                total_duplicates += int(row.get('duplicates_detected') or 0)
            except (ValueError, TypeError):
                pass

        duplicate_percentage = (total_duplicates / total_processed * 100) if total_processed > 0 else 0.0

        trend = 'stable'

        return {
            'duplicate_percentage': round(duplicate_percentage, 2),
            'duplicate_count': total_duplicates,
            'total_hazards': total_processed,
            'duplicate_detection_enabled': True,
            'trend': trend
        }
    
    try:
        data = await get_or_set(cache_key, fetch_duplicate_rate, ttl=CACHE_TTLS.get("analytics:duplicate-rate", 300))
        return DuplicateDetectionMetric(**data)
        
    except Exception as e:
        logger.exception("Error fetching duplicate rate")
        raise HTTPException(status_code=500, detail="Internal server error while fetching duplicate detection rate")


@router.get("/system-health", response_model=SystemHealthMetric)
async def get_system_health(current_user: UserContext = Depends(require_admin)):
    """
    Get system health and performance metrics (cached for 30 seconds)
    
    System Health Metric: Overall system status including response time and reliability
    Supports: AAM-08 (System Health Monitoring)
    """
    cache_key = generate_cache_key("analytics:system-health")
    
    async def fetch_system_health():
        # Get error count from audit logs (last 24h)
        now = datetime.now()
        last_24h = now - timedelta(hours=24)
        
        error_response = supabase.schema("gaia").from_('audit_logs') \
            .select('id', count='exact') \
            .gte('created_at', last_24h.isoformat()) \
            .eq('user_role', 'system')   \
            .eq('severity', 'CRITICAL') \
            .execute()
        error_count = error_response.count or 0
        
        # Get total requests (audit logs with user_role='system' in last 24h)
        total_response = supabase.schema("gaia").from_('audit_logs') \
            .select('id', count='exact') \
            .gte('created_at', last_24h.isoformat()) \
            .eq('user_role', 'system') \
            .execute()
        total_count = total_response.count or 1  # Avoid division by zero
        
        error_rate = (error_count / total_count * 100) if total_count > 0 else 0.0
        
        # Calculate health score (0-100)
        # Base score: 100
        # Deduct for error rate: -1 per 1% error (capped at -30)
        # Deduct for high duplicate rate: -1 per 1% above 5% (capped at -20)
        # Deduct for low confidence: -1 per 1% below 80% (capped at -20)
        
        health_score = 100
        
        # Penalize error rate
        error_penalty = min(error_rate, 30)
        health_score -= error_penalty
        
        # Get duplicate rate penalty
        duplicate_response = supabase.schema("gaia").from_('hazards') \
            .select('id', count='exact') \
            .eq('is_duplicate', True) \
            .execute()
        duplicate_count = duplicate_response.count or 0
        
        total_hazards_response = supabase.schema("gaia").from_('hazards') \
            .select('id', count='exact') \
            .execute()
        total_hazards = total_hazards_response.count or 1
        
        duplicate_rate = (duplicate_count / total_hazards * 100) if total_hazards > 0 else 0.0
        if duplicate_rate > 5:
            dup_penalty = min((duplicate_rate - 5) * 2, 20)
            health_score -= dup_penalty
        
        # Get confidence score penalty
        confidence_response = supabase.schema("gaia").from_('hazards') \
            .select('confidence_score') \
            .execute()
        if confidence_response.data:
            scores = [h['confidence_score'] for h in confidence_response.data if h.get('confidence_score') is not None]
            avg_confidence = sum(scores) / len(scores) if scores else 0.5
            avg_confidence_pct = avg_confidence * 100
            if avg_confidence_pct < 80:
                conf_penalty = min((80 - avg_confidence_pct) * 0.25, 20)
                health_score -= conf_penalty
        
        health_score = max(0, min(100, health_score))  # Clamp 0-100
        
        # Determine status
        if health_score >= 90:
            status = "healthy"
        elif health_score >= 70:
            status = "warning"
        else:
            status = "critical"
        
        # TODO: Integrate real metrics from request timing instrumentation and monitoring service
        return {
            'health_score': int(health_score),
            'status': status,
            'avg_response_time_ms': None,  # Real value: requires request timing instrumentation
            'error_rate_percentage': round(error_rate, 2),
            'uptime_percentage': None,  # Real value: requires monitoring service integration
            'metrics_timestamp': now.isoformat()
        }
    
    try:
        data = await get_or_set(cache_key, fetch_system_health, ttl=CACHE_TTLS.get("analytics:system-health", 30))
        return SystemHealthMetric(**data)
        
    except Exception as e:
        logger.exception("Error fetching system health")
        raise HTTPException(status_code=500, detail="Internal server error while fetching system health")



@router.get("/service-health")
async def get_service_health(
    days: int = Query(30, ge=7, le=90, description="Number of days to retrieve (7-90)"),
    current_user: Optional[UserContext] = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Return time-series service health metrics for the last `days` days.

    Response shape:
    {
      "uptime": [{"date": "YYYY-MM-DD", "uptime_percent": 99.9, "avg_response_ms": 45.0}, ...],
      "response_time": [{"date": "YYYY-MM-DD", "uptime_percent": 99.9, "avg_response_ms": 45.0}, ...]
    }
    Cached for 30 seconds.
    Accessible to dashboard callers even when auth headers are temporarily unavailable.
    """
    cache_key = generate_cache_key("analytics:service-health", days=days)

    async def fetch_service_health():
        # Aggregate daily in Postgres via gaia.service_health_daily(p_days): one row
        # per day over the window (incl. no-data gaps), computed in UTC. This avoids
        # the PostgREST 1000-row cap that silently truncated raw-row fetches to the
        # earliest ~1000 checks (~5 days), and is far cheaper than shipping every raw
        # check across the network to bucket in Python.
        resp = supabase.schema('gaia').rpc('service_health_daily', {'p_days': days}).execute()
        series = resp.data or []

        # PostgREST serializes numeric as a JSON string to preserve precision; the
        # frontend expects number | null, so coerce uptime/response to float.
        def _num(value: Any) -> Optional[float]:
            if value is None:
                return None
            try:
                return float(value)
            except (TypeError, ValueError):
                return None

        points = [
            {
                "date": r.get("date"),
                "uptime_percent": _num(r.get("uptime_percent")),
                "avg_response_ms": _num(r.get("avg_response_ms")),
                "status": r.get("status"),
            }
            for r in series
        ]

        # Per-service response sparklines from recent checks' metadata. Intraday
        # raw points (last ~24 checks) so the per-service trends populate within
        # ~15 min instead of needing multiple days of daily aggregates. Bounded
        # row count, so the PostgREST 1000-row cap is irrelevant here.
        sparklines: Dict[str, List[Optional[float]]] = {}
        try:
            spark_resp = supabase.schema('gaia').from_('service_health_checks') \
                .select('response_time_ms, metadata') \
                .eq('service_name', 'system') \
                .order('checked_at', desc=True).limit(24).execute()
            for row in reversed(spark_resp.data or []):
                meta = row.get('metadata') if isinstance(row.get('metadata'), dict) else {}
                svc_map = meta.get('services') if isinstance(meta.get('services'), dict) else {}
                for name, rt in svc_map.items():
                    sparklines.setdefault(name, []).append(_num(rt))
                sparklines.setdefault('System', []).append(_num(row.get('response_time_ms')))
        except Exception:
            logger.exception("Service-health sparkline fetch failed; returning empty sparklines")

        return {"uptime": points, "response_time": [dict(p) for p in points], "sparklines": sparklines}

    try:
        data = await get_or_set(cache_key, fetch_service_health, ttl=CACHE_TTLS.get("analytics:service-health", 30))
        return data
    except Exception as e:
        logger.exception("Error fetching service health")
        raise HTTPException(status_code=500, detail="Internal server error while fetching service health")