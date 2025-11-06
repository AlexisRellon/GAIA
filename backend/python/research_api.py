"""
Research & Validation API for GAIA
Provides endpoints for officer validation, ground truth management,
algorithm metrics, and model comparison for thesis research.

Adapted from GeoAware's research_routes.py for FastAPI + Supabase.
"""

import os
import logging
import sys
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, validator

# Add parent directory to path for lib imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.supabase_client import supabase

logger = logging.getLogger(__name__)

# Supabase client imported from centralized configuration

# Create router
router = APIRouter(
    prefix="/research",
    tags=["Research & Validation"],
    responses={404: {"description": "Not found"}},
)


# ============================================================================
# Pydantic Models
# ============================================================================

class ValidationRequest(BaseModel):
    """Request body for validating a hazard classification"""
    officer_classification: Optional[str] = Field(
        None,
        description="Corrected hazard type if AI was wrong"
    )
    officer_location_lat: Optional[float] = Field(
        None,
        ge=-90,
        le=90,
        description="Corrected latitude if Geo-NER was wrong"
    )
    officer_location_lng: Optional[float] = Field(
        None,
        ge=-180,
        le=180,
        description="Corrected longitude if Geo-NER was wrong"
    )
    validation_notes: Optional[str] = Field(
        None,
        max_length=1000,
        description="Officer's comments or reasoning"
    )
    is_correct: bool = Field(
        ...,
        description="TRUE if AI classification was correct"
    )
    validation_action: str = Field(
        ...,
        description="approved, corrected, or dismissed"
    )
    
    @validator('validation_action')
    def validate_action(cls, v):
        if v not in ['approved', 'corrected', 'dismissed']:
            raise ValueError('validation_action must be approved, corrected, or dismissed')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "officer_classification": "Flood",
                "validation_notes": "Confirmed flood event in Marikina area",
                "is_correct": True,
                "validation_action": "approved"
            }
        }


class ValidationResponse(BaseModel):
    """Response after creating a validation"""
    id: str
    hazard_id: str
    validator_id: str
    validation_action: str
    is_correct: bool
    created_at: str
    message: str = "Validation recorded successfully"


class GroundTruthQuery(BaseModel):
    """Query parameters for ground truth dataset"""
    status: Optional[str] = None
    validation_action: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    export_format: str = Field(default="json", regex="^(json|csv)$")


class GroundTruthRecord(BaseModel):
    """Single ground truth record with AI prediction and officer validation"""
    hazard_id: str
    source_title: Optional[str]
    source_url: Optional[str]
    
    # AI predictions
    ai_classification: str
    ai_confidence: float
    ai_model: Optional[str]
    tta_seconds: Optional[int]
    
    # Ground truth
    ground_truth_classification: Optional[str]
    ai_was_correct: bool
    validation_action: str
    validation_notes: Optional[str]
    
    # Validator info
    validator_email: Optional[str]
    validated_at: str
    
    # Location
    latitude: float
    longitude: float
    location_name: Optional[str]


class AlgorithmMetrics(BaseModel):
    """Algorithm performance metrics"""
    total_validations: int
    correct_classifications: int
    incorrect_classifications: int
    false_positives: int
    false_negatives: int
    
    # Core metrics
    accuracy_percent: float
    precision_percent: float
    recall_percent: float
    f1_score: float
    
    # Statistics
    avg_confidence: float
    avg_processing_time_ms: float
    
    class Config:
        schema_extra = {
            "example": {
                "total_validations": 150,
                "correct_classifications": 135,
                "incorrect_classifications": 15,
                "false_positives": 10,
                "false_negatives": 5,
                "accuracy_percent": 90.0,
                "precision_percent": 93.1,
                "recall_percent": 96.4,
                "f1_score": 94.7,
                "avg_confidence": 0.8543,
                "avg_processing_time_ms": 1250.5
            }
        }


class ConfusionMatrixEntry(BaseModel):
    """Single entry in confusion matrix"""
    ai_predicted: str
    officer_confirmed: str
    count: int


class ConfusionMatrixResponse(BaseModel):
    """Confusion matrix showing classification patterns"""
    matrix: List[ConfusionMatrixEntry]
    total_validations: int


class ModelComparisonRequest(BaseModel):
    """Request for comparing multiple models"""
    text: str = Field(..., min_length=10, max_length=5000)
    models: List[str] = Field(
        default=['climatenli', 'bart-mnli'],
        description="List of model identifiers to compare"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "text": "Heavy flooding reported in Marikina City due to continuous rainfall",
                "models": ["climatenli", "bart-mnli", "xlm-roberta-xnli"]
            }
        }


class ModelComparisonResult(BaseModel):
    """Result of model comparison"""
    model: str
    predicted_class: str
    confidence: float
    processing_time_ms: float


class DatasetExportRequest(BaseModel):
    """Request for dataset export"""
    format: str = Field(default="json", regex="^(json|csv)$")
    include_raw_text: bool = Field(
        default=False,
        description="Include full article text in export"
    )
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class UnvalidatedHazard(BaseModel):
    """Hazard requiring validation"""
    hazard_id: str
    hazard_type: str
    confidence_score: float
    source_title: Optional[str]
    location_name: Optional[str]
    detected_at: str


# ============================================================================
# Dependency: Require Researcher Role
# ============================================================================

async def require_researcher_role(user_id: str = Query(..., description="User ID from JWT")):
    """
    Dependency to check if user has researcher, validator, or admin role.
    In production, this would extract user_id from JWT token.
    """
    # Query user role from Supabase
    try:
        response = supabase.auth.admin.get_user_by_id(user_id)
        user_role = response.user.user_metadata.get('role')
        
        if user_role not in ['researcher', 'master_admin', 'validator']:
            raise HTTPException(
                status_code=403,
                detail="Researcher, validator, or admin role required"
            )
        
        return user_id
        
    except Exception as e:
        logger.error(f"Error checking user role: {str(e)}")
        raise HTTPException(status_code=401, detail="Unauthorized")


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/validate/{hazard_id}", response_model=ValidationResponse, status_code=201)
async def validate_hazard(
    hazard_id: UUID,
    request: ValidationRequest,
    validator_id: str = Depends(require_researcher_role)
):
    """
    Officer validation of AI classification (creates ground truth).
    
    **RESEARCH CRITICAL:** This creates the ground truth dataset for
    algorithm accuracy validation.
    
    **Validation Actions**:
    - `approved`: AI classification was correct
    - `corrected`: AI classification was wrong, officer provided correct type
    - `dismissed`: False positive, not actually a hazard
    """
    try:
        # Prepare validation data
        validation_data = {
            'hazard_id': str(hazard_id),
            'validator_id': validator_id,
            'officer_classification': request.officer_classification,
            'validation_notes': request.validation_notes,
            'is_correct': request.is_correct,
            'validation_action': request.validation_action
        }
        
        # Add location correction if provided
        if request.officer_location_lat and request.officer_location_lng:
            validation_data['officer_location_correction'] = f'POINT({request.officer_location_lng} {request.officer_location_lat})'
        
        # Insert validation
        response = supabase.table('hazard_validations').insert(validation_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create validation")
        
        validation = response.data[0]
        
        logger.info(f"Hazard {hazard_id} validated by {validator_id}: {request.validation_action}")
        
        return ValidationResponse(
            id=validation['id'],
            hazard_id=validation['hazard_id'],
            validator_id=validation['validator_id'],
            validation_action=validation['validation_action'],
            is_correct=validation['is_correct'],
            created_at=validation['created_at']
        )
        
    except Exception as e:
        logger.error(f"Error validating hazard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ground-truth", response_model=List[GroundTruthRecord])
async def get_ground_truth(
    status: Optional[str] = Query(None, description="Filter by hazard status"),
    validation_action: Optional[str] = Query(None, description="Filter by validation action"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    validator_id: str = Depends(require_researcher_role)
):
    """
    Get ground truth dataset (validated incidents) for research analysis.
    
    **RESEARCH CRITICAL:** This provides the validated dataset for
    calculating precision, recall, F1-score, etc.
    
    **Filters**:
    - `status`: Filter by hazard status (validated, corrected, dismissed)
    - `validation_action`: Filter by validation action (approved, corrected, dismissed)
    - `start_date`, `end_date`: Date range filter
    """
    try:
        # Query ground truth view
        query = supabase.table('ground_truth').select('*')
        
        if status:
            query = query.eq('status', status)
        if validation_action:
            query = query.eq('validation_action', validation_action)
        if start_date:
            query = query.gte('validated_at', start_date.isoformat())
        if end_date:
            query = query.lte('validated_at', end_date.isoformat())
        
        response = query.execute()
        
        return [GroundTruthRecord(**record) for record in response.data]
        
    except Exception as e:
        logger.error(f"Error fetching ground truth: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics", response_model=AlgorithmMetrics)
async def get_algorithm_metrics(
    start_date: Optional[datetime] = Query(None, description="Start date for metrics calculation"),
    end_date: Optional[datetime] = Query(None, description="End date for metrics calculation"),
    validator_id: str = Depends(require_researcher_role)
):
    """
    Calculate algorithm performance metrics for research validation.
    
    **RESEARCH CRITICAL:** Provides accuracy, precision, recall, F1-score
    for zero-shot classification and Geo-NER.
    
    **Metrics Returned**:
    - **Accuracy**: Overall correctness percentage
    - **Precision**: True Positives / (True Positives + False Positives)
    - **Recall**: True Positives / (True Positives + False Negatives)
    - **F1-Score**: Harmonic mean of Precision and Recall
    - **Confidence Distribution**: Average confidence scores
    - **Processing Time Statistics**: Average processing time
    """
    try:
        # Call PostgreSQL function to calculate metrics
        response = supabase.rpc(
            'calculate_algorithm_metrics',
            {
                'start_date': start_date.isoformat() if start_date else None,
                'end_date': end_date.isoformat() if end_date else None
            }
        ).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="No validation data available")
        
        metrics = response.data[0]
        
        return AlgorithmMetrics(**metrics)
        
    except Exception as e:
        logger.error(f"Error calculating metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/confusion-matrix", response_model=ConfusionMatrixResponse)
async def get_confusion_matrix(
    validator_id: str = Depends(require_researcher_role)
):
    """
    Get detailed confusion matrix for classification research.
    
    **RESEARCH CRITICAL:** Shows which categories are confused with each other.
    
    Returns per-category accuracy breakdown showing which hazard types
    are misclassified as which other types.
    """
    try:
        # Call PostgreSQL function
        response = supabase.rpc('get_confusion_matrix').execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No validation data available")
        
        matrix_entries = [ConfusionMatrixEntry(**entry) for entry in response.data]
        total = sum(entry.count for entry in matrix_entries)
        
        return ConfusionMatrixResponse(
            matrix=matrix_entries,
            total_validations=total
        )
        
    except Exception as e:
        logger.error(f"Error generating confusion matrix: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/model-comparison", response_model=List[ModelComparisonResult])
async def compare_models(
    request: ModelComparisonRequest,
    validator_id: str = Depends(require_researcher_role)
):
    """
    Compare multiple zero-shot models for research analysis.
    
    **RESEARCH CRITICAL:** Allows comparison of ClimateNLI vs baseline models
    (BART-MNLI, XLM-RoBERTa) for thesis validation.
    
    **Available Models**:
    - `climatenli`: Climate-NLI (primary model)
    - `bart-mnli`: Facebook BART-MNLI (baseline)
    - `xlm-roberta-xnli`: XLM-RoBERTa (multilingual baseline)
    """
    try:
        # Import classifier
        from backend.python.models.classifier import classifier
        
        results = []
        
        for model_name in request.models:
            # Load model and classify
            # TODO: Implement multi-model support in classifier
            start_time = datetime.now()
            classification = classifier.classify(request.text)
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            results.append(ModelComparisonResult(
                model=model_name,
                predicted_class=classification.get('hazard_type', 'Unknown'),
                confidence=classification.get('score', 0.0),
                processing_time_ms=processing_time
            ))
        
        return results
        
    except Exception as e:
        logger.error(f"Error comparing models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unvalidated-hazards", response_model=List[UnvalidatedHazard])
async def get_unvalidated_hazards(
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
    max_confidence: float = Query(1.0, ge=0.0, le=1.0),
    limit: int = Query(50, ge=1, le=200),
    validator_id: str = Depends(require_researcher_role)
):
    """
    Get hazards requiring validation, prioritizing low confidence scores.
    
    **Use Case**: Populate validation queue for officers to review.
    """
    try:
        response = supabase.rpc(
            'get_unvalidated_hazards',
            {
                'min_confidence': min_confidence,
                'max_confidence': max_confidence,
                'limit_count': limit
            }
        ).execute()
        
        return [UnvalidatedHazard(**record) for record in response.data]
        
    except Exception as e:
        logger.error(f"Error fetching unvalidated hazards: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export-dataset")
async def export_research_dataset(
    request: DatasetExportRequest,
    validator_id: str = Depends(require_researcher_role)
):
    """
    Export complete research dataset with all metrics for thesis analysis.
    
    **RESEARCH CRITICAL:** Exports comprehensive dataset including:
    - All classifications with confidence scores
    - All validations (ground truth)
    - Processing times
    - Location extractions
    - Source metadata
    
    **Format Options**: JSON or CSV
    """
    try:
        # Query ground truth with optional date range
        query = supabase.table('ground_truth').select('*')
        
        if request.start_date:
            query = query.gte('validated_at', request.start_date.isoformat())
        if request.end_date:
            query = query.lte('validated_at', request.end_date.isoformat())
        
        response = query.execute()
        
        export_data = {
            'export_date': datetime.utcnow().isoformat(),
            'total_records': len(response.data),
            'exported_by': validator_id,
            'format': request.format,
            'data': response.data
        }
        
        # TODO: Implement CSV export if requested
        if request.format == 'csv':
            # Convert to CSV format
            pass
        
        return export_data
        
    except Exception as e:
        logger.error(f"Error exporting dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health")
async def research_health_check():
    """Health check for research API"""
    return {
        "status": "healthy",
        "service": "research-api",
        "endpoints": 8
    }
