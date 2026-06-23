"""
PDF Report Generation Endpoint

This module provides FastAPI endpoints for generating PDF hazard reports.
Uses ReportLab to create professional PDF documents with map screenshots,
hazard data tables, and metadata.

Module: RG-02 (Report Generation Backend)
Change: add-advanced-map-features (Phase 4)

Dependencies:
- reportlab: PDF generation
- Pillow (PIL): Image processing
- FastAPI: Web framework
- Pydantic: Data validation
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Tuple, Dict
from datetime import datetime, timedelta, timezone
from pathlib import Path
import tempfile
import io
import base64
import re
import csv
import json

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, 
    Paragraph, 
    Spacer, 
    Table, 
    TableStyle,
    Image as RLImage,
    PageBreak,
    KeepTogether
)
from reportlab.pdfgen import canvas
from PIL import Image
import os
import logging

from backend.python.middleware.rbac import (
    get_current_user_optional,
    require_validator,
    UserContext,
    UserRole,
    UserStatus,
    log_admin_action,
)
from backend.python.middleware.activity_logger import ActivityLogger
from backend.python.lib.supabase_client import supabase

logger = logging.getLogger(__name__)

# Router prefix: main.py adds /api/v1, so this becomes /api/v1/reports
router = APIRouter(prefix="/reports", tags=["reports"])
global_img_path = Path(__file__).parent / 'assets' / 'img' / 'AGAILA.svg'

# ============================================================================
# DATA MODELS
# ============================================================================

class HazardData(BaseModel):
    """Hazard information for PDF report"""
    id: str
    hazard_type: str
    severity: Optional[str] = None  # Severity may be NULL for some hazards
    location_name: Optional[str] = None
    admin_division: Optional[str] = None  # Geo-NER resolved province/city
    latitude: float
    longitude: float
    confidence_score: float
    source_type: str
    source_url: Optional[str] = None
    source_title: Optional[str] = None
    status: Optional[str] = None  # active / resolved / archived / pending / validated
    validated: Optional[bool] = None
    reporter_id: Optional[str] = None  # tracking_id (citizen) or user uuid (validator)
    created_at: str
    source_content: Optional[str] = None

class ReportMetadata(BaseModel):
    """Report metadata and configuration"""
    title: str = Field(default="AGAILA Hazard Report")
    generated_by: str = Field(default="AGAILA System")
    time_range: Optional[str] = None
    filter_summary: Optional[str] = None
    total_hazards: int = 0
    page_size: str = Field(default="letter", description="letter or A4")

class ReportRequest(BaseModel):
    """Request model for PDF generation"""
    hazards: List[HazardData]
    metadata: ReportMetadata
    map_screenshot_base64: Optional[str] = None

# ============================================================================
# PDF GENERATION FUNCTIONS
# ============================================================================

def create_header_footer(canvas_obj, doc):
    """
    Add header and footer to each page.

    The AGAILA logo PNG already contains the wordmark at ~2.5:1 aspect ratio,
    so we size it to match (no redundant "AGAILA" text) and render the
    tagline directly underneath.  This keeps the logo fully visible instead
    of being clipped into a tiny square.
    """
    canvas_obj.saveState()

    global global_img_path

    # Header geometry (bottom-left origin).  `top_y` is the top edge of the
    # printable area (the bottom of the top margin gutter is just below it).
    logo_width = 1.35 * inch
    logo_height = 0.54 * inch        # matches the ~2.5:1 aspect of GAIA.png
    logo_x = doc.leftMargin
    # Sit the logo flush with the top of the content area, then nudge up
    # slightly into the top margin so it reads as a proper page header.
    logo_y = doc.bottomMargin + doc.height + (doc.topMargin - logo_height) / 2

    drew_logo = False
    try:
        if global_img_path.exists():
            canvas_obj.drawImage(
                str(global_img_path),
                logo_x, logo_y,
                width=logo_width, height=logo_height,
                preserveAspectRatio=True, anchor='sw', mask='auto',
            )
            drew_logo = True
    except Exception as e:
        logger.warning(f"Header logo could not be drawn: {e}")

    # Tagline sits to the right of the logo (or flush left if no logo).
    tagline_x = (logo_x + logo_width + 0.18 * inch) if drew_logo else logo_x
    tagline_y_top = logo_y + logo_height * 0.60
    tagline_y_sub = logo_y + logo_height * 0.20

    if drew_logo:
        # Logo already shows the AGAILA wordmark; only add a small label & tagline.
        canvas_obj.setFont('Helvetica', 8.5)
        canvas_obj.setFillColor(colors.HexColor('#374151'))
        canvas_obj.drawString(tagline_x, tagline_y_top, "Hazard Intelligence Report")
    else:
        canvas_obj.setFont('Helvetica-Bold', 14)
        canvas_obj.setFillColor(colors.HexColor('#0a2a4d'))
        canvas_obj.drawString(tagline_x, tagline_y_top, "AGAILA")

    canvas_obj.setFont('Helvetica', 7.5)
    canvas_obj.setFillColor(colors.grey)
    canvas_obj.drawString(tagline_x, tagline_y_sub, "Geospatial AI-driven Assessment")

    # Thin header divider line
    divider_y = doc.bottomMargin + doc.height + 0.08 * inch
    canvas_obj.setStrokeColor(colors.HexColor('#e5e7eb'))
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(doc.leftMargin, divider_y,
                    doc.leftMargin + doc.width, divider_y)

    # Footer
    canvas_obj.setFont('Helvetica', 8)
    canvas_obj.setFillColor(colors.grey)
    page_num = canvas_obj.getPageNumber()
    footer_text = f"Page {page_num} | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    canvas_obj.drawRightString(
        doc.width + doc.leftMargin,
        0.4 * inch,
        footer_text,
    )

    canvas_obj.restoreState()

def decode_base64_image(base64_string: str) -> io.BytesIO:
    """
    Decode base64 image string to BytesIO object
    
    Args:
        base64_string: Base64 encoded image (with or without data URL prefix)
    
    Returns:
        BytesIO object containing image data
    """
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    # Decode base64
    image_data = base64.b64decode(base64_string)
    return io.BytesIO(image_data)

# ----------------------------------------------------------------------------
# URGENCY / GEO-NER HELPERS
# ----------------------------------------------------------------------------

# Urgency color palette.  Each tuple = (accent, bg_tint, label)
URGENCY_PALETTE = {
    'critical': (colors.HexColor('#b91c1c'), colors.HexColor('#fee2e2'), 'CRITICAL'),
    'high':     (colors.HexColor('#ea580c'), colors.HexColor('#ffedd5'), 'HIGH'),
    'medium':   (colors.HexColor('#ca8a04'), colors.HexColor('#fef9c3'), 'MEDIUM'),
    'low':      (colors.HexColor('#16a34a'), colors.HexColor('#dcfce7'), 'LOW'),
    'info':     (colors.HexColor('#6b7280'), colors.HexColor('#f3f4f6'), 'INFO'),
}

# Hazard-type based baseline urgency (used when severity is NULL)
HIGH_RISK_TYPES = {
    'earthquake', 'tsunami', 'volcanic_eruption', 'storm_surge', 'typhoon'
}
MEDIUM_RISK_TYPES = {
    'flood', 'flooding', 'landslide', 'fire', 'heavy_rain'
}


def classify_urgency(hazard: HazardData) -> str:
    """
    Decide an urgency bucket for a hazard.

    Precedence:
      1. severity (critical / severe|high / moderate|medium / minor|low)
      2. confidence_score thresholds
      3. hazard_type baseline risk
    Returns one of URGENCY_PALETTE keys.
    """
    sev = (hazard.severity or '').strip().lower()
    if sev in ('critical', 'catastrophic'):
        return 'critical'
    if sev in ('severe', 'high', 'major'):
        return 'high'
    if sev in ('moderate', 'medium'):
        return 'medium'
    if sev in ('minor', 'low'):
        return 'low'

    # Use confidence + hazard type as fallback
    htype = (hazard.hazard_type or '').strip().lower()
    conf = hazard.confidence_score or 0.0

    if htype in HIGH_RISK_TYPES and conf >= 0.70:
        return 'critical' if conf >= 0.85 else 'high'
    if htype in MEDIUM_RISK_TYPES and conf >= 0.70:
        return 'high' if conf >= 0.85 else 'medium'

    if conf >= 0.85:
        return 'high'
    if conf >= 0.70:
        return 'medium'
    if conf >= 0.50:
        return 'low'
    return 'info'


def format_geo_ner_location(hazard: HazardData) -> str:
    """
    Produce a human-readable, Geo-NER-first location string.

    Prefers the specific extracted place (Barangay / City) and augments
    with the resolved admin division (province / region) when available.
    Falls back to raw coordinates as a last resort.
    """
    name = (hazard.location_name or '').strip()
    admin = (hazard.admin_division or '').strip()

    parts: List[str] = []
    if name:
        parts.append(name)
    if admin and admin.lower() != name.lower() and admin.lower() not in name.lower():
        parts.append(admin)

    if parts:
        return ', '.join(parts)
    return f"{hazard.latitude:.4f}, {hazard.longitude:.4f}"


def _parse_iso(ts: str) -> Optional[datetime]:
    """Best-effort ISO-8601 parser that always returns an aware datetime (UTC)."""
    if not ts:
        return None
    try:
        dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except Exception:
        try:
            dt = datetime.strptime(ts[:19], '%Y-%m-%dT%H:%M:%S')
        except Exception:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _escape(text: Optional[str]) -> str:
    """Escape text for safe inclusion in ReportLab Paragraph markup."""
    if text is None:
        return ''
    s = str(text)
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return s


def _short_id(value: Optional[str], length: int = 10) -> str:
    if not value:
        return '—'
    value = str(value).strip()
    if len(value) <= length:
        return value
    return value[:length] + '…'


# ----------------------------------------------------------------------------
# TWO-COLUMN HAZARD CARDS
# ----------------------------------------------------------------------------

def create_hazard_cards(hazards: List[HazardData], styles) -> List:
    """
    Render each hazard as an analytical two-column card:
        LEFT  = hazard details (type, Geo-NER location, urgency, confidence, snippet)
        RIGHT = metadata (source link, status, reporter ID, date, validation)
    Cards are color-coded by urgency (severity first, then confidence fallback).
    Returns a list of flowables ready to be appended to the story.
    """
    flowables: List = []

    detail_style = ParagraphStyle(
        'HazardDetail', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=colors.HexColor('#111827'),
    )
    meta_style = ParagraphStyle(
        'HazardMeta', parent=styles['Normal'],
        fontSize=8.5, leading=11.5, textColor=colors.HexColor('#1f2937'),
    )
    meta_label_style = ParagraphStyle(
        'HazardMetaLabel', parent=styles['Normal'],
        fontSize=7.5, leading=10, textColor=colors.HexColor('#6b7280'),
        fontName='Helvetica-Bold', spaceAfter=1,
    )

    for idx, hazard in enumerate(hazards, start=1):
        urgency_key = classify_urgency(hazard)
        accent, bg_tint, urgency_label = URGENCY_PALETTE[urgency_key]

        # ----- LEFT CELL: hazard details -----
        hazard_type = _escape(hazard.hazard_type.replace('_', ' ').title())
        severity_value = (hazard.severity or '').strip()
        severity_text = ''
        if severity_value and severity_value.lower() not in ('unknown', 'n/a', 'none'):
            severity_text = _escape(severity_value.upper())
        geo_text = _escape(format_geo_ner_location(hazard))
        confidence_pct = int(round((hazard.confidence_score or 0.0) * 100))

        accent_hex = _hex(accent)
        severity_segment = (
            f'<b>Severity:</b> {severity_text} &nbsp;&middot;&nbsp; '
            if severity_text
            else ''
        )
        left_html = (
            f'<font size="11" color="{accent_hex}">'
            f'<b>#{idx:02d} &middot; {hazard_type}</b></font><br/>'
            f'<font size="8" color="#374151"><b>Location (Geo-NER):</b> {geo_text}</font><br/>'
            f'<font size="8" color="#374151">{severity_segment}'
            f'<b>Confidence:</b> {confidence_pct}% '
            f'&nbsp;&middot;&nbsp; <b>Urgency:</b> '
            f'<font color="{accent_hex}"><b>{urgency_label}</b></font></font><br/>'
            f'<font size="7.5" color="#6b7280"><b>Coordinates:</b> '
            f'{hazard.latitude:.4f}, {hazard.longitude:.4f}</font>'
        )

        snippet = (hazard.source_content or '').strip()
        if snippet:
            if len(snippet) > 260:
                snippet = snippet[:260].rstrip() + '…'
            left_html += (
                f'<br/><font size="8" color="#4b5563"><i>&ldquo;{_escape(snippet)}&rdquo;</i></font>'
            )

        left_cell = Paragraph(left_html, detail_style)

        # ----- RIGHT CELL: metadata (stacked label/value rows) -----
        dt = _parse_iso(hazard.created_at)
        date_str = dt.strftime('%Y-%m-%d %H:%M UTC') if dt else _escape(hazard.created_at[:16])

        source_pretty = _escape(hazard.source_type.replace('_', ' ').title())
        if hazard.source_url:
            link_href = _escape(hazard.source_url)
            link_label = _escape(hazard.source_title) if hazard.source_title else link_href
            # Truncate long URLs so the card doesn't overflow
            display = link_label if len(link_label) <= 60 else link_label[:57] + '…'
            source_value = (
                f'{source_pretty}<br/>'
                f'<link href="{link_href}"><font color="#1d4ed8"><u>{display}</u></font></link>'
            )
        else:
            source_value = source_pretty

        status_raw = (hazard.status or 'active').lower()
        status_color = {
            'active': '#b91c1c', 'pending': '#ca8a04',
            'validated': '#15803d', 'resolved': '#15803d',
            'archived': '#6b7280', 'rejected': '#6b7280',
        }.get(status_raw, '#374151')
        validated_badge = ''
        if hazard.validated:
            validated_badge = ' <font color="#15803d">&#10003; verified</font>'
        status_value = (
            f'<font color="{status_color}"><b>{_escape(status_raw.upper())}</b></font>{validated_badge}'
        )

        reporter_value = _escape(_short_id(hazard.reporter_id))
        hazard_id_value = _escape(_short_id(hazard.id, length=12))

        def _row(label: str, value_html: str):
            return [
                Paragraph(f'{label}', meta_label_style),
                Paragraph(value_html, meta_style),
            ]

        meta_table = Table(
            [
                _row('SOURCE', source_value),
                _row('STATUS', status_value),
                _row('REPORTER ID', reporter_value),
                _row('HAZARD ID', hazard_id_value),
                _row('DETECTED', _escape(date_str)),
            ],
            colWidths=[0.85 * inch, 1.75 * inch],
            hAlign='LEFT',
        )
        meta_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 1),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))

        # ----- Outer two-column card -----
        card = Table(
            [[left_cell, meta_table]],
            colWidths=[3.85 * inch, 2.75 * inch],
        )
        card.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 0), (-1, -1), bg_tint),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
            # Left urgency bar
            ('LINEBEFORE', (0, 0), (0, 0), 4, accent),
            # Soft vertical divider between left/right columns
            ('LINEAFTER', (0, 0), (0, 0), 0.25, colors.HexColor('#e5e7eb')),
            ('LEFTPADDING', (0, 0), (0, 0), 10),
            ('RIGHTPADDING', (0, 0), (0, 0), 8),
            ('LEFTPADDING', (1, 0), (1, 0), 8),
            ('RIGHTPADDING', (1, 0), (1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))

        flowables.append(KeepTogether(card))
        flowables.append(Spacer(1, 0.12 * inch))

    return flowables


def _hex(c) -> str:
    """ReportLab color -> #rrggbb hex string (for Paragraph markup)."""
    try:
        r = int(round(c.red * 255))
        g = int(round(c.green * 255))
        b = int(round(c.blue * 255))
        return f'#{r:02x}{g:02x}{b:02x}'
    except Exception:
        return '#000000'


def create_urgency_legend(styles) -> Table:
    """Small legend explaining the urgency color coding."""
    header_style = ParagraphStyle(
        'LegendHeader', parent=styles['Normal'],
        fontSize=8.5, textColor=colors.HexColor('#111827'),
        fontName='Helvetica-Bold',
    )
    item_style = ParagraphStyle(
        'LegendItem', parent=styles['Normal'],
        fontSize=7.5, textColor=colors.HexColor('#374151'),
    )

    cells = [Paragraph('<b>Urgency legend:</b>', header_style)]
    descriptions = {
        'critical': 'Severity = critical, or high-risk hazard type at ≥0.85 confidence.',
        'high':     'Severity = severe/high, or ≥0.85 AI confidence.',
        'medium':   'Severity = moderate, or 0.70-0.85 confidence.',
        'low':      'Severity = minor, or 0.50-0.70 confidence.',
        'info':     'Low-confidence / unclassified hazard (<0.50).',
    }
    for key in ('critical', 'high', 'medium', 'low', 'info'):
        accent, bg_tint, label = URGENCY_PALETTE[key]
        swatch_html = (
            f'<font backcolor="{_hex(bg_tint)}" color="{_hex(accent)}"><b>&nbsp;{label}&nbsp;</b></font> '
            f'{descriptions[key]}'
        )
        cells.append(Paragraph(swatch_html, item_style))

    tbl = Table([[c] for c in cells], colWidths=[6.6 * inch])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return tbl


# ----------------------------------------------------------------------------
# WEEK-OVER-WEEK TREND ANALYSIS
# ----------------------------------------------------------------------------

def compute_weekly_trend(hazards: List[HazardData]) -> Dict:
    """
    Compare this-week vs previous-week report volumes.

    "this week"     = now → now - 7d
    "previous week" = now - 7d → now - 14d

    Returns a dict with totals, per-type breakdown and deltas.  Based on the
    hazards that were included in the report payload (i.e. already scoped by
    the user's active filters).
    """
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    this_week_total = 0
    prev_week_total = 0
    by_type_this: Dict[str, int] = {}
    by_type_prev: Dict[str, int] = {}

    for h in hazards:
        dt = _parse_iso(h.created_at)
        if dt is None:
            continue
        htype = (h.hazard_type or 'other').replace('_', ' ').title()
        if dt >= week_ago and dt <= now:
            this_week_total += 1
            by_type_this[htype] = by_type_this.get(htype, 0) + 1
        elif dt >= two_weeks_ago and dt < week_ago:
            prev_week_total += 1
            by_type_prev[htype] = by_type_prev.get(htype, 0) + 1

    delta = this_week_total - prev_week_total
    if prev_week_total > 0:
        pct = (delta / prev_week_total) * 100.0
    elif this_week_total > 0:
        pct = 100.0
    else:
        pct = 0.0

    all_types = sorted(set(by_type_this) | set(by_type_prev))

    return {
        'now': now,
        'week_ago': week_ago,
        'two_weeks_ago': two_weeks_ago,
        'this_week_total': this_week_total,
        'prev_week_total': prev_week_total,
        'delta': delta,
        'percent_change': pct,
        'by_type': [
            {
                'type': t,
                'this_week': by_type_this.get(t, 0),
                'prev_week': by_type_prev.get(t, 0),
                'delta': by_type_this.get(t, 0) - by_type_prev.get(t, 0),
            }
            for t in all_types
        ],
    }


def create_trend_section(hazards: List[HazardData], styles) -> List:
    """Return flowables visualising the weekly trend analysis."""
    trend = compute_weekly_trend(hazards)

    headline_style = ParagraphStyle(
        'TrendHeadline', parent=styles['Normal'],
        fontSize=11, leading=15, textColor=colors.HexColor('#111827'),
    )
    sub_style = ParagraphStyle(
        'TrendSub', parent=styles['Normal'],
        fontSize=8.5, leading=11, textColor=colors.HexColor('#6b7280'),
    )

    delta = trend['delta']
    pct = trend['percent_change']
    if delta > 0:
        direction, arrow, color_hex = 'increase', '▲', '#b91c1c'
    elif delta < 0:
        direction, arrow, color_hex = 'decrease', '▼', '#15803d'
    else:
        direction, arrow, color_hex = 'no change', '■', '#6b7280'

    window = (
        f"{trend['week_ago'].strftime('%b %d')} – {trend['now'].strftime('%b %d, %Y')}"
    )
    prev_window = (
        f"{trend['two_weeks_ago'].strftime('%b %d')} – {trend['week_ago'].strftime('%b %d, %Y')}"
    )

    headline = Paragraph(
        f"<b>This week ({window}):</b> {trend['this_week_total']} reports &nbsp;&middot;&nbsp; "
        f"<b>Previous week ({prev_window}):</b> {trend['prev_week_total']} reports "
        f"&nbsp;&nbsp; <font color='{color_hex}'><b>{arrow} {abs(delta)} "
        f"({pct:+.1f}% {direction})</b></font>",
        headline_style,
    )

    sub = Paragraph(
        'Trend is computed from the hazards included in this report '
        '(scope reflects the active dashboard filters).',
        sub_style,
    )

    # Per-type comparison table with mini ASCII bars
    header_style = ParagraphStyle(
        'TrendTableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white,
        alignment=1,
    )
    header_row = [
        Paragraph('<b>Hazard Type</b>', header_style),
        Paragraph('<b>Prev Week</b>', header_style),
        Paragraph('<b>This Week</b>', header_style),
        Paragraph('<b>Δ</b>', header_style),
        Paragraph('<b>Trend</b>', header_style),
    ]
    rows = [header_row]

    max_count = max(
        [row['this_week'] for row in trend['by_type']] +
        [row['prev_week'] for row in trend['by_type']] +
        [1]
    )

    for row in trend['by_type']:
        d = row['delta']
        if d > 0:
            arrow_cell = f"<font color='#b91c1c'>▲ +{d}</font>"
        elif d < 0:
            arrow_cell = f"<font color='#15803d'>▼ {d}</font>"
        else:
            arrow_cell = "<font color='#6b7280'>■ 0</font>"

        bar_len = max(1, int(round(20 * row['this_week'] / max_count))) if row['this_week'] else 0
        prev_bar_len = max(1, int(round(20 * row['prev_week'] / max_count))) if row['prev_week'] else 0
        bar_html = (
            f"<font color='#cbd5e1'>{'█' * prev_bar_len}</font><br/>"
            f"<font color='#1d4ed8'>{'█' * bar_len}</font>"
        )

        rows.append([
            Paragraph(_escape(row['type']), styles['Normal']),
            Paragraph(str(row['prev_week']), styles['Normal']),
            Paragraph(str(row['this_week']), styles['Normal']),
            Paragraph(arrow_cell, styles['Normal']),
            Paragraph(bar_html, styles['Normal']),
        ])

    if len(rows) == 1:
        rows.append([
            Paragraph('<i>No reports dated within the last 14 days in this report\'s scope.</i>',
                      styles['Italic']),
            Paragraph('', styles['Normal']),
            Paragraph('', styles['Normal']),
            Paragraph('', styles['Normal']),
            Paragraph('', styles['Normal']),
        ])

    trend_table = Table(
        rows,
        colWidths=[2.0 * inch, 0.9 * inch, 0.9 * inch, 0.8 * inch, 2.0 * inch],
        hAlign='LEFT',
    )
    trend_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0a2a4d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),

        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1),
            [colors.white, colors.HexColor('#f3f4f6')]),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#d1d5db')),
        ('ALIGN', (1, 1), (3, -1), 'CENTER'),
    ]))

    return [headline, Spacer(1, 0.08 * inch), sub, Spacer(1, 0.18 * inch), trend_table]

def generate_pdf_report(
    report_request: ReportRequest,
    output_path: Path
) -> None:
    """
    Generate PDF report with hazard data and map screenshot
    
    Args:
        report_request: Report configuration and data
        output_path: Where to save the PDF file
    """
    
    # Determine page size
    page_size = A4 if report_request.metadata.page_size.lower() == 'a4' else letter
    
    # Create PDF document
    # Populate the PDF's internal /Title, /Author, /Subject and /Creator
    # metadata so viewers (Chrome/Edge/Acrobat) show a proper document title
    # in the tab instead of "(anonymous)".
    pdf_title = (report_request.metadata.title or "AGAILA Hazard Report").strip()
    pdf_author = (report_request.metadata.generated_by or "AGAILA System").strip()
    pdf_subject_parts = ["AGAILA Hazard Intelligence Report"]
    if report_request.metadata.time_range:
        pdf_subject_parts.append(report_request.metadata.time_range)
    pdf_subject_parts.append(
        f"{report_request.metadata.total_hazards} hazards"
    )
    pdf_subject = " — ".join(pdf_subject_parts)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=page_size,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=inch,
        bottomMargin=0.75*inch,
        title=pdf_title,
        author=pdf_author,
        subject=pdf_subject,
        creator="AGAILA Report Generator",
        keywords="AGAILA, hazard, Philippines, Geo-NER, Climate-NLI",
    )
    
    # Container for PDF elements
    story = []
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0a2a4d'),
        spaceAfter=12,
        alignment=1,  # Center
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#0a2a4d'),
        spaceAfter=12,
    )
    
    # ========================================================================
    # TITLE PAGE
    # ========================================================================
    
    # Add GAIA logo at top
    global global_img_path

    story.append(Spacer(1, 0.5*inch))
    if global_img_path.exists():
        try:
            # Center the logo
            logo = RLImage(str(global_img_path), width=1.5*inch, height=1.5*inch, kind='proportional')
            logo.hAlign = 'CENTER'
            story.append(logo)
            story.append(Spacer(1, 0.3*inch))
        except Exception as e:
            print(f"Warning: Could not load logo: {e}")
            print(f"Logo path attempted: {global_img_path}")
            story.append(Spacer(1, 0.5*inch))
    else:
        print(f"Logo file not found at: {global_img_path}")
        story.append(Spacer(1, 0.5*inch))
    
    story.append(Paragraph(report_request.metadata.title, title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Metadata with better formatting
    metadata_style = ParagraphStyle(
        'Metadata',
        parent=styles['Normal'],
        fontSize=11,
        alignment=1,  # Center
        spaceAfter=6,
    )
    story.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", metadata_style))
    story.append(Paragraph(f"<b>Generated by:</b> {report_request.metadata.generated_by}", metadata_style))
    story.append(Paragraph(f"<b>Total Hazards:</b> {report_request.metadata.total_hazards}", metadata_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Filter summary if provided
    if report_request.metadata.filter_summary:
        story.append(Paragraph("<b>Active Filters:</b>", styles['Normal']))
        story.append(Paragraph(report_request.metadata.filter_summary, styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
    
    # Time range if provided
    if report_request.metadata.time_range:
        story.append(Paragraph(f"<b>Time Range:</b> {report_request.metadata.time_range}", styles['Normal']))
    
    story.append(PageBreak())
    
    # ========================================================================
    # MAP SCREENSHOT
    # ========================================================================
    
    if report_request.map_screenshot_base64:
        story.append(Spacer(1, 0.3*inch))  
        story.append(Paragraph("Map Overview", heading_style))
        story.append(Spacer(1, 0.3*inch))  
        
        try:
            # Decode base64 image
            image_io = decode_base64_image(report_request.map_screenshot_base64)
            
            # Open with PIL to get dimensions
            pil_image = Image.open(image_io)
            img_width, img_height = pil_image.size
            
            # Calculate scaled dimensions to fit page
            max_width = doc.width
            max_height = 5*inch
            aspect = img_height / float(img_width)
            
            if img_width > max_width:
                img_width = max_width
                img_height = img_width * aspect
            
            if img_height > max_height:
                img_height = max_height
                img_width = img_height / aspect
            
            # Reset BytesIO position
            image_io.seek(0)
            
            # Add image to PDF
            rl_image = RLImage(image_io, width=img_width, height=img_height)
            story.append(rl_image)
            story.append(Spacer(1, 0.3*inch))
            
        except Exception as e:
            print(f"Failed to add map screenshot: {e}")
            story.append(Paragraph(
                "<i>Map screenshot could not be included</i>", 
                styles['Italic']
            ))
    
    story.append(PageBreak())
    
    # ========================================================================
    # TREND ANALYSIS (Week-over-Week)
    # ========================================================================
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("Trend Analysis &mdash; Week over Week", heading_style))
    story.append(Spacer(1, 0.1 * inch))
    trend_flowables = create_trend_section(report_request.hazards, styles)
    for flowable in trend_flowables:
        story.append(flowable)
    story.append(Spacer(1, 0.3 * inch))

    # ========================================================================
    # HAZARD DETAILS (two-column, urgency color-coded cards)
    # ========================================================================
    story.append(PageBreak())
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("Hazard Details", heading_style))
    story.append(Spacer(1, 0.08 * inch))
    story.append(create_urgency_legend(styles))
    story.append(Spacer(1, 0.18 * inch))

    if report_request.hazards:
        for flowable in create_hazard_cards(report_request.hazards, styles):
            story.append(flowable)
    else:
        story.append(Paragraph("<i>No hazards to display</i>", styles['Italic']))

    story.append(Spacer(1, 0.3 * inch))
    
    # ========================================================================
    # SUMMARY STATISTICS
    # ========================================================================
    
    if report_request.hazards:
        story.append(PageBreak())
        story.append(Spacer(1, 0.3*inch))  
        story.append(Paragraph("Summary Statistics", heading_style))
        story.append(Spacer(1, 0.2*inch))
        
        type_counts: Dict[str, int] = {}
        severity_counts: Dict[str, int] = {}
        source_counts: Dict[str, int] = {}
        urgency_counts: Dict[str, int] = {}
        
        for hazard in report_request.hazards:
            hazard_type = hazard.hazard_type.replace('_', ' ').title()
            type_counts[hazard_type] = type_counts.get(hazard_type, 0) + 1

            severity = hazard.severity.upper() if hazard.severity else 'UNKNOWN'
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

            source = hazard.source_type.replace('_', ' ').title()
            source_counts[source] = source_counts.get(source, 0) + 1

            urgency_key = classify_urgency(hazard)
            urgency_label = URGENCY_PALETTE[urgency_key][2]
            urgency_counts[urgency_label] = urgency_counts.get(urgency_label, 0) + 1

        summary_text = "<b>By Urgency:</b><br/>"
        # Preserve a meaningful order: CRITICAL → HIGH → MEDIUM → LOW → INFO
        order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
        for label in order:
            if label in urgency_counts:
                summary_text += f"• {label}: {urgency_counts[label]}<br/>"

        summary_text += "<br/><b>By Hazard Type:</b><br/>"
        for hazard_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
            summary_text += f"• {hazard_type}: {count}<br/>"

        summary_text += "<br/><b>By Severity:</b><br/>"
        for severity, count in sorted(severity_counts.items()):
            summary_text += f"• {severity}: {count}<br/>"

        summary_text += "<br/><b>By Source:</b><br/>"
        for source, count in sorted(source_counts.items()):
            summary_text += f"• {source}: {count}<br/>"
        
        story.append(Paragraph(summary_text, styles['Normal']))
    
    # ========================================================================
    # BUILD PDF
    # ========================================================================
    
    doc.build(story, onFirstPage=create_header_footer, onLaterPages=create_header_footer)

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/generate", response_class=FileResponse)
async def generate_report(
    report_request: ReportRequest,
    request: Request,
    current_user: Optional[UserContext] = Depends(get_current_user_optional),
):
    """
    Generate PDF hazard report
    
    Request body should contain:
    - hazards: List of hazard data
    - metadata: Report configuration
    - map_screenshot_base64: Optional base64-encoded map screenshot
    
    Returns:
        FileResponse with generated PDF
    """
    try:
        # Create temporary file for PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            output_path = Path(tmp_file.name)
        
        # Generate PDF
        generate_pdf_report(report_request, output_path)
        
        # Log activity: who generated/printed the report (FP-04 Activity Monitor)
        try:
            await ActivityLogger.log_activity(
                user_context=current_user,
                action="PRINT_REPORT",
                request=request,
                resource_type="report",
                resource_id=None,
                details={
                    "title": report_request.metadata.title,
                    "generated_by": report_request.metadata.generated_by,
                    "total_hazards": report_request.metadata.total_hazards,
                    "filename": f"agaila_hazard_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                },
            )
        except Exception as log_error:
            logger.warning(f"Failed to log report generation activity: {log_error}")

        # Log to audit_logs for Audit Logs viewer (AC-01)
        try:
            audit_user = current_user or UserContext(
                user_id="00000000-0000-0000-0000-000000000000",
                email="anonymous",
                role=UserRole.CITIZEN,
                status=UserStatus.ACTIVE,
            )
            await log_admin_action(
                user=audit_user,
                action="report_printed",
                action_description=f"Generated PDF report: {report_request.metadata.title} ({report_request.metadata.total_hazards} hazards)",
                resource_type="reports",
                resource_id=None,
                old_values={},
                new_values={
                    "title": report_request.metadata.title,
                    "generated_by": report_request.metadata.generated_by,
                    "total_hazards": report_request.metadata.total_hazards,
                },
                request=request,
                event_type="REPORT_PRINTED",
            )
        except Exception as log_error:
            logger.warning(f"Failed to log audit: {log_error}")
        
        # Return PDF file
        filename = f"agaila_hazard_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return FileResponse(
            path=str(output_path),
            media_type='application/pdf',
            filename=filename,
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"'
            }
        )
        
    except Exception as e:
        print(f"PDF generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF report: {str(e)}"
        )

# ============================================================================
# COMPLIANCE EXPORT (RG-01): GeoJSON + CSV
#
# Provides machine-readable, interoperable exports of the currently filtered
# hazards for integration with external geospatial / data-management systems.
#
# Standards:
#   - RFC 7946 (GeoJSON) — coordinates are [longitude, latitude] in WGS 84.
#   - PMP ISO 19115:2014 metadata header (aligned with PNSDI/NAMRIA, PhilSA).
#   - UNDP "Build the Future of Crisis Mapping" must-have: structured export
#     in standard interoperable formats (CSV / GeoJSON).
#
# Access: Admin-only (master_admin or validator) per RA 10173 — citizen
# report descriptions and unverified details must not be publicly exportable.
# PII (IP hashes, user agents, EXIF, captcha scores, reporter identity) is
# never emitted.
# ============================================================================

# CC BY 4.0 keeps outputs reusable by other non-profits (UNDP open-source intent).
EXPORT_DATA_LICENSE = "Creative Commons Attribution 4.0 International (CC BY 4.0)"
EXPORT_STANDARD_COMPLIANCE = "PMP-ISO-19115:2014, RFC 7946"
EXPORT_SPATIAL_REFERENCE = "EPSG:4326 (WGS 84)"


class GeoJSONExportRequest(BaseModel):
    """Request model for compliance exports (GeoJSON / CSV).

    Accepts the same filtered hazard list the UI already holds so the export
    matches the on-screen filtered state exactly.
    """
    hazards: List[HazardData]
    metadata: Optional[ReportMetadata] = None


def _fetch_undp_assessments(hazard_ids: List[str]) -> Dict[str, dict]:
    """Fetch UNDP damage-assessment fields for citizen-report hazards.

    Citizen reports link to their promoted hazard via
    ``gaia.citizen_reports.promoted_to_hazard_id``. Returns a map of
    ``hazard_id -> {undp fields}``. Fails soft (returns what it can) so a
    logging/DB hiccup never blocks the export.
    """
    if not hazard_ids or supabase is None:
        return {}

    undp_fields = [
        "promoted_to_hazard_id",
        "infrastructure_types",
        "infrastructure_details",
        "crisis_categories",
        "debris_status",
        "damage_severity",
    ]
    result_map: Dict[str, dict] = {}
    try:
        response = (
            supabase.schema("gaia")
            .from_("citizen_reports")
            .select(",".join(undp_fields))
            .in_("promoted_to_hazard_id", hazard_ids)
            .execute()
        )
        for row in (response.data or []):
            haz_id = row.get("promoted_to_hazard_id")
            if not haz_id:
                continue
            result_map[str(haz_id)] = {
                "infrastructure_types": row.get("infrastructure_types"),
                "infrastructure_details": row.get("infrastructure_details"),
                "crisis_categories": row.get("crisis_categories"),
                "debris_status": row.get("debris_status"),
                "damage_severity": row.get("damage_severity"),
            }
    except Exception as fetch_error:  # noqa: BLE001 - export must not hard-fail
        logger.warning(f"Failed to fetch UNDP assessments for export: {fetch_error}")
    return result_map


_PSGC_LEVELS = (
    ("region", "region_name", "region_psgc"),
    ("province", "province_name", "province_psgc"),
    ("city_municipality", "city_municipality_name", "city_municipality_psgc"),
    ("barangay", "barangay_name", "barangay_psgc"),
)


def _row_to_georef(row: dict) -> Optional[dict]:
    """Convert a gaia.get_psgc_hierarchy_batch row into a nested ``ph_georef``
    dict (only the levels that resolved), or None when nothing resolved."""
    georef: Dict[str, dict] = {}
    for key, name_col, psgc_col in _PSGC_LEVELS:
        name, psgc = row.get(name_col), row.get(psgc_col)
        if name or psgc:
            georef[key] = {"name": name, "psgc": psgc}
    return georef or None


def _build_psgc_map(hazards: List[HazardData]) -> Dict[tuple, Optional[dict]]:
    """Resolve the PSGC hierarchy for every DISTINCT coordinate in a SINGLE
    batched RPC (gaia.get_psgc_hierarchy_batch) — one point-in-polygon join for
    all points, instead of one round-trip per hazard (the old N+1). Fails soft so
    the export never breaks."""
    cache: Dict[tuple, Optional[dict]] = {}
    if supabase is None:
        return cache

    # Deduplicate coordinates; `keys` preserves order so the RPC's 0-based idx
    # maps straight back to a coordinate.
    keys: List[tuple] = []
    for h in hazards:
        key = (round(h.latitude, 6), round(h.longitude, 6))
        if key not in cache:
            cache[key] = None
            keys.append(key)
    if not keys:
        return cache

    # ST_MakePoint expects (lng, lat).
    points = [[lng, lat] for (lat, lng) in keys]
    try:
        resp = (
            supabase.schema("gaia")
            .rpc("get_psgc_hierarchy_batch", {"p_points": points})
            .execute()
        )
        for row in (resp.data or []):
            idx = row.get("idx")
            if isinstance(idx, int) and 0 <= idx < len(keys):
                cache[keys[idx]] = _row_to_georef(row)
    except Exception as psgc_error:  # noqa: BLE001 - export must not hard-fail
        logger.warning(f"Batch PSGC resolution failed: {psgc_error}")
    return cache


def _build_metadata_header(generated_by: str, total: int) -> dict:
    """PMP ISO 19115 / RFC 7946 compliant metadata block for the FeatureCollection."""
    return {
        "agency_source": "AGAILA",
        "generated_by": generated_by,
        "export_timestamp": datetime.now(timezone.utc).isoformat(),
        "spatial_reference": EXPORT_SPATIAL_REFERENCE,
        "data_license": EXPORT_DATA_LICENSE,
        "standard_compliance": EXPORT_STANDARD_COMPLIANCE,
        "feature_count": total,
        "geographic_scope": "Philippines",
    }


def _hazard_to_feature(h: HazardData, undp: Optional[dict], ph_georef: Optional[dict] = None) -> dict:
    """Convert a hazard into a PII-scrubbed RFC 7946 Feature."""
    properties: Dict[str, object] = {
        "id": h.id,
        "hazard_type": h.hazard_type,
        "severity": h.severity,
        "confidence_score": round(h.confidence_score, 4),
        "source_type": h.source_type,
        "status": h.status,
        "validated": h.validated,
        "location_name": h.location_name,
        "admin_division": h.admin_division,
        "created_at": h.created_at,
        "source_title": h.source_title,
        "source_url": h.source_url,
    }
    # Official PSGC hierarchy (PhilSA/NAMRIA interoperability) when resolvable.
    if ph_georef:
        properties["ph_georef"] = ph_georef
    # Nest UNDP damage-assessment fields for citizen reports (when promoted).
    if undp and any(v is not None for v in undp.values()):
        properties["undp_damage_assessment"] = undp

    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            # RFC 7946: [longitude, latitude]
            "coordinates": [round(h.longitude, 6), round(h.latitude, 6)],
        },
        "properties": properties,
    }


def _build_geojson(hazards: List[HazardData], generated_by: str) -> dict:
    """Build an RFC 7946 FeatureCollection with PMP ISO 19115 metadata."""
    citizen_ids = [h.id for h in hazards if h.source_type == "citizen_report"]
    undp_map = _fetch_undp_assessments(citizen_ids)
    psgc_map = _build_psgc_map(hazards)
    features = [
        _hazard_to_feature(
            h,
            undp_map.get(h.id),
            psgc_map.get((round(h.latitude, 6), round(h.longitude, 6))),
        )
        for h in hazards
    ]
    return {
        "type": "FeatureCollection",
        "metadata": _build_metadata_header(generated_by, len(features)),
        "features": features,
    }


# CSV column order — flat, GIS/spreadsheet-friendly.
_CSV_COLUMNS = [
    "id", "hazard_type", "severity", "confidence_score", "source_type",
    "status", "validated", "latitude", "longitude", "location_name",
    "admin_division", "created_at", "source_title", "source_url",
    "ph_region", "ph_region_psgc", "ph_province", "ph_province_psgc",
    "ph_city_municipality", "ph_city_municipality_psgc", "ph_barangay", "ph_barangay_psgc",
    "undp_infrastructure_types", "undp_infrastructure_details",
    "undp_debris_status", "undp_damage_severity", "undp_crisis_categories",
]


def _build_csv(hazards: List[HazardData], generated_by: str) -> str:
    """Build a flat CSV string with the same data as the GeoJSON export."""
    citizen_ids = [h.id for h in hazards if h.source_type == "citizen_report"]
    undp_map = _fetch_undp_assessments(citizen_ids)
    psgc_map = _build_psgc_map(hazards)

    buffer = io.StringIO()
    # Provenance comment line (ignored by most parsers, useful for traceability).
    buffer.write(
        f"# AGAILA hazard export | {EXPORT_SPATIAL_REFERENCE} | "
        f"{EXPORT_DATA_LICENSE} | generated_by={generated_by} | "
        f"timestamp={datetime.now(timezone.utc).isoformat()}\n"
    )
    writer = csv.DictWriter(buffer, fieldnames=_CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for h in hazards:
        undp = undp_map.get(h.id) or {}
        infra = undp.get("infrastructure_types")
        crisis = undp.get("crisis_categories")
        georef = psgc_map.get((round(h.latitude, 6), round(h.longitude, 6))) or {}

        def _g(level: str, field: str) -> str:
            return (georef.get(level) or {}).get(field) or ""

        writer.writerow({
            "id": h.id,
            "hazard_type": h.hazard_type,
            "severity": h.severity,
            "confidence_score": round(h.confidence_score, 4),
            "source_type": h.source_type,
            "status": h.status,
            "validated": h.validated,
            "latitude": round(h.latitude, 6),
            "longitude": round(h.longitude, 6),
            "location_name": h.location_name,
            "admin_division": h.admin_division,
            "created_at": h.created_at,
            "source_title": h.source_title,
            "source_url": h.source_url,
            "ph_region": _g("region", "name"),
            "ph_region_psgc": _g("region", "psgc"),
            "ph_province": _g("province", "name"),
            "ph_province_psgc": _g("province", "psgc"),
            "ph_city_municipality": _g("city_municipality", "name"),
            "ph_city_municipality_psgc": _g("city_municipality", "psgc"),
            "ph_barangay": _g("barangay", "name"),
            "ph_barangay_psgc": _g("barangay", "psgc"),
            "undp_infrastructure_types": json.dumps(infra) if infra is not None else "",
            "undp_infrastructure_details": undp.get("infrastructure_details") or "",
            "undp_debris_status": undp.get("debris_status") or "",
            "undp_damage_severity": undp.get("damage_severity") or "",
            "undp_crisis_categories": json.dumps(crisis) if crisis is not None else "",
        })
    return buffer.getvalue()


async def _log_export(
    user: UserContext,
    request: Request,
    export_format: str,
    total: int,
):
    """Audit + activity logging for a compliance export (data_exported)."""
    try:
        await ActivityLogger.log_activity(
            user_context=user,
            action="DATA_EXPORTED",
            request=request,
            resource_type="report",
            resource_id=None,
            details={"format": export_format, "total_hazards": total},
        )
    except Exception as log_error:  # noqa: BLE001
        logger.warning(f"Failed to log export activity: {log_error}")
    try:
        await log_admin_action(
            user=user,
            action="data_exported",
            action_description=f"Exported {total} hazards as {export_format.upper()}",
            resource_type="reports",
            resource_id=None,
            old_values={},
            new_values={"format": export_format, "total_hazards": total},
            request=request,
            event_type="DATA_EXPORTED",
        )
    except Exception as log_error:  # noqa: BLE001
        logger.warning(f"Failed to log export audit: {log_error}")


@router.post("/export/geojson", response_class=FileResponse)
async def export_geojson(
    export_request: GeoJSONExportRequest,
    request: Request,
    current_user: UserContext = Depends(require_validator),
):
    """Export the filtered hazards as a compliant RFC 7946 GeoJSON file.

    Admin-only (master_admin / validator). Includes a PMP ISO 19115 metadata
    header and PII-scrubbed properties; citizen reports carry a nested
    ``undp_damage_assessment`` block.
    """
    try:
        generated_by = (
            export_request.metadata.generated_by
            if export_request.metadata else current_user.email
        )
        feature_collection = _build_geojson(export_request.hazards, generated_by)

        with tempfile.NamedTemporaryFile(
            delete=False, suffix=".geojson", mode="w", encoding="utf-8"
        ) as tmp_file:
            json.dump(feature_collection, tmp_file, ensure_ascii=False, indent=2)
            output_path = Path(tmp_file.name)

        await _log_export(current_user, request, "geojson", len(export_request.hazards))

        filename = f"agaila_hazard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.geojson"
        return FileResponse(
            path=str(output_path),
            media_type="application/geo+json",
            filename=filename,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"GeoJSON export error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export GeoJSON: {str(e)}")


@router.post("/export/csv", response_class=FileResponse)
async def export_csv(
    export_request: GeoJSONExportRequest,
    request: Request,
    current_user: UserContext = Depends(require_validator),
):
    """Export the filtered hazards as a flat CSV file (spreadsheet/GIS import).

    Admin-only (master_admin / validator), PII-scrubbed.
    """
    try:
        generated_by = (
            export_request.metadata.generated_by
            if export_request.metadata else current_user.email
        )
        csv_content = _build_csv(export_request.hazards, generated_by)

        with tempfile.NamedTemporaryFile(
            delete=False, suffix=".csv", mode="w", encoding="utf-8-sig", newline=""
        ) as tmp_file:
            tmp_file.write(csv_content)
            output_path = Path(tmp_file.name)

        await _log_export(current_user, request, "csv", len(export_request.hazards))

        filename = f"agaila_hazard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return FileResponse(
            path=str(output_path),
            media_type="text/csv",
            filename=filename,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"CSV export error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export CSV: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Health check endpoint for report generation service
    """
    return {
        "status": "healthy",
        "service": "PDF Report Generation",
        "timestamp": datetime.now().isoformat()
    }
