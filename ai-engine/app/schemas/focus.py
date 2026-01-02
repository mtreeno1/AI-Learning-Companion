"""
Focus Detection Schemas
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal


# ==================== SESSION SCHEMAS ====================

class SessionCreate(BaseModel):
    """Request to create new learning session"""
    session_name: Optional[str] = Field(None, max_length=255, description="Session name (e.g., 'Học Toán buổi sáng')")
    subject: Optional[str] = Field(None, max_length=100, description="Subject (Math, Physics, English, etc.)")
    initial_score: Decimal = Field(Decimal("100.00"), ge=0, le=100, description="Initial score")


class SessionUpdate(BaseModel):
    """Update session details"""
    session_name:  Optional[str] = Field(None, max_length=255)
    subject: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, pattern="^(active|completed|cancelled)$")


class SessionEnd(BaseModel):
    """End session request"""
    final_score:  Optional[Decimal] = Field(None, ge=0, le=100)
    status: str = Field("completed", pattern="^(completed|cancelled)$")


class SessionResponse(BaseModel):
    """Learning session response"""
    session_id: UUID
    user_id: UUID
    session_name: Optional[str]
    subject: Optional[str]
    
    # Timestamps
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]
    
    # Scores
    initial_score: Decimal
    final_score: Optional[Decimal]
    average_score: Optional[Decimal]
    min_score: Optional[Decimal]
    max_score: Optional[Decimal]
    
    # Violations
    total_violations: int
    phone_detected_count:  int
    left_seat_count: int
    
    # Alerts
    total_alerts: int
    gentle_alerts: int
    urgent_alerts: int
    
    # Status
    status:  str
    
    # Metadata
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config: 
        from_attributes = True


class SessionStats(BaseModel):
    """Real-time session statistics"""
    session_id: UUID
    duration_seconds: int
    current_score: Decimal
    total_violations: int
    phone_detected_count: int
    left_seat_count: int
    total_alerts: int
    focus_percentage: float


class SessionListResponse(BaseModel):
    """List of sessions with pagination"""
    sessions: List[SessionResponse]
    total: int
    page: int
    per_page: int


# ==================== DETECTION SCHEMAS ====================

class DetectionEvent(BaseModel):
    """Real-time detection event from WebSocket"""
    session_id: UUID
    timestamp: datetime
    
    # Detection Results
    is_focused: bool
    person_detected: bool
    phone_detected:  bool
    confidence: float
    
    # Alert Info
    message: str
    alert_type:  Optional[str] = Field(None, description="gentle, urgent, or None")
    
    # Current Stats
    stats: SessionStats


class DetectionResult(BaseModel):
    """AI Detection result"""
    is_focused: bool
    confidence: float
    message: str
    alert_type:  Optional[str] = None
    detections: List[Dict[str, Any]] = []
    metrics: Dict[str, Any] = {}


class ObjectDetection(BaseModel):
    """Single object detection"""
    class_name: str = Field(..., alias="class")
    confidence: float = Field(..., ge=0, le=1)
    bbox: List[float] = Field(... , description="[x1, y1, x2, y2]")
    
    class Config:
        populate_by_name = True


class DetectionMetrics(BaseModel):
    """Detection metrics"""
    person_detected: bool
    phone_detected: bool
    person_confidence: float
    phone_confidence:  float
    no_person_duration: Optional[float] = None
    consecutive_phone_frames: Optional[int] = None


# ==================== VIOLATION SCHEMAS ====================

class ViolationCreate(BaseModel):
    """Log a violation"""
    violation_type:  str = Field(... , pattern="^(phone_detected|left_seat)$")
    confidence: float = Field(..., ge=0, le=1)
    score_penalty:  Decimal = Field(..., ge=0, le=100, description="Score deducted")
    
    @field_validator('violation_type')
    @classmethod
    def validate_violation_type(cls, v):
        allowed = ['phone_detected', 'left_seat']
        if v not in allowed:
            raise ValueError(f"violation_type must be one of {allowed}")
        return v


class ViolationResponse(BaseModel):
    """Violation record response"""
    violation_id: UUID
    session_id: UUID
    violation_type: str
    detected_at: datetime
    confidence: float
    score_penalty:  Decimal
    resolved: bool
    
    class Config:
        from_attributes = True


# ==================== ALERT SCHEMAS ====================

class AlertCreate(BaseModel):
    """Create an alert"""
    alert_type: str = Field(..., pattern="^(gentle|urgent)$")
    message: str = Field(..., max_length=500)
    triggered_by: Optional[str] = Field(None, description="What triggered the alert")


class AlertResponse(BaseModel):
    """Alert record response"""
    alert_id:  UUID
    session_id: UUID
    alert_type: str
    message: str
    triggered_at: datetime
    acknowledged: bool
    
    class Config:
        from_attributes = True


# ==================== MODEL INFO SCHEMAS ====================

class ModelInfo(BaseModel):
    """AI Model information"""
    model_type: str
    classes: List[str]
    num_classes: int
    focus_classes: List[str]
    thresholds: Dict[str, Any]


class ModelThresholds(BaseModel):
    """Detection thresholds"""
    person_confidence: float = Field(..., ge=0, le=1)
    phone_confidence: float = Field(..., ge=0, le=1)
    alert_cooldown: int = Field(..., ge=0, description="Seconds between alerts")
    no_person_timeout: int = Field(..., ge=0, description="Seconds before no-person alert")


# ==================== STATISTICS SCHEMAS ====================

class SessionStatistics(BaseModel):
    """Detailed session statistics"""
    session_id: UUID
    
    # Time
    duration_seconds: int
    started_at: datetime
    ended_at: Optional[datetime]
    
    # Scores
    initial_score: Decimal
    final_score: Optional[Decimal]
    score_change: Optional[Decimal]
    
    # Performance
    focus_percentage: float
    distraction_percentage: float
    
    # Violations
    total_violations: int
    phone_violations: int
    left_seat_violations: int
    violations_per_minute: float
    
    # Alerts
    total_alerts: int
    gentle_alerts:  int
    urgent_alerts: int
    alerts_per_minute: float
    
    # Quality
    average_confidence: float
    max_confidence:  float
    min_confidence: float


class UserStatistics(BaseModel):
    """User overall statistics"""
    user_id:  UUID
    
    # Sessions
    total_sessions: int
    completed_sessions: int
    active_sessions: int
    cancelled_sessions: int
    
    # Time
    total_study_time_seconds: int
    average_session_duration: int
    
    # Performance
    average_focus_percentage: float
    best_focus_percentage: float
    worst_focus_percentage: float
    
    # Scores
    average_initial_score: Decimal
    average_final_score: Decimal
    average_score_change:  Decimal
    
    # Violations
    total_violations: int
    average_violations_per_session: float
    phone_violation_rate: float
    left_seat_violation_rate: float
    
    # Improvement
    focus_trend: str = Field(... , description="improving, stable, declining")
    violation_trend: str


# ==================== WEBSOCKET MESSAGES ====================

class WSMessage(BaseModel):
    """WebSocket message base"""
    type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class WSFrameMessage(WSMessage):
    """Client sends frame to server"""
    type: str = "frame"
    data: str = Field(... , description="Base64 encoded image")


class WSDetectionMessage(WSMessage):
    """Server sends detection result to client"""
    type: str = "detection"
    session_id: UUID
    is_focused: bool
    person_detected: bool
    phone_detected: bool
    confidence: float
    message: str
    alert_type:  Optional[str]
    stats: SessionStats


class WSErrorMessage(WSMessage):
    """Error message"""
    type: str = "error"
    error:  str
    detail: Optional[str] = None


class WSStatusMessage(WSMessage):
    """Status update"""
    type: str = "status"
    status: str
    message: str