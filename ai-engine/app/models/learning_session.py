from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base
from decimal import Decimal


class LearningSession(Base):
    __tablename__ = "learning_sessions"
    
    # Primary Key
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("app_users.user_id"), nullable=False)
    
    # Session Info
    session_name = Column(String(255), nullable=True)
    subject = Column(String(100), nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Scores (using Numeric for Decimal)
    initial_score = Column(Numeric(5, 2), default=100.00)
    final_score = Column(Numeric(5, 2), nullable=True)
    average_score = Column(Numeric(5, 2), nullable=True)
    min_score = Column(Numeric(5, 2), nullable=True)
    max_score = Column(Numeric(5, 2), nullable=True)
    
    # Violations
    total_violations = Column(Integer, default=0)
    phone_detected_count = Column(Integer, default=0)
    left_seat_count = Column(Integer, default=0)
    
    # Alerts
    total_alerts = Column(Integer, default=0)
    gentle_alerts = Column(Integer, default=0)
    urgent_alerts = Column(Integer, default=0)
    
    # Status
    status = Column(String(20), default="active")  # active, completed, cancelled
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<LearningSession {self.session_id} - {self.session_name}>"