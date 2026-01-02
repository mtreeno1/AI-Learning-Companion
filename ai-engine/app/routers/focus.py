"""
Focus Detection Router
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import base64
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.learning_session import LearningSession
from app.schemas.focus import SessionCreate, SessionResponse, SessionEnd, DetectionEvent  # ✅ Updated imports
from app.services.focus_service import get_focus_service

router = APIRouter()


@router.get("/model/info")
async def get_model_info():
    """Get AI model information"""
    try:
        service = get_focus_service()
        return service.get_model_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model:  {str(e)}")


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate,  # ✅ Updated
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new learning session"""
    
    session = LearningSession(
        user_id=current_user.user_id,
        session_name=session_data.session_name,
        subject=session_data.subject,
        initial_score=session_data.initial_score
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session


@router.get("/sessions", response_model=List[SessionResponse])
async def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get user's learning sessions"""
    
    sessions = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.user_id
    ).order_by(LearningSession. started_at.desc()).limit(limit).all()
    
    return sessions


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get session details"""
    
    session = db.query(LearningSession).filter(
        LearningSession.session_id == session_id,
        LearningSession.user_id == current_user.user_id
    ).first()
    
    if not session: 
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


@router.post("/sessions/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    end_data: SessionEnd,  # ✅ Updated
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End learning session"""
    
    session = db.query(LearningSession).filter(
        LearningSession.session_id == session_id,
        LearningSession.user_id == current_user.user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.ended_at = datetime.utcnow()
    session.status = end_data.status
    
    if end_data.final_score:
        session.final_score = end_data.final_score
    
    # Calculate duration
    if session.started_at and session.ended_at:
        duration = (session.ended_at - session.started_at).total_seconds()
        session.duration_seconds = int(duration)
    
    db.commit()
    db.refresh(session)
    
    return session


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket for real-time AI focus detection
    """
    await websocket.accept()
    
    # Get session
    session = db. query(LearningSession).filter(
        LearningSession. session_id == session_id
    ).first()
    
    if not session:
        await websocket.close(code=1008, reason="Session not found")
        return
    
    # Get AI service
    focus_service = get_focus_service()
    
    print(f"🔌 WebSocket connected for session {session_id}")
    
    try:
        while True:
            # Receive frame
            data = await websocket.receive_text()
            
            # Decode frame
            try:
                if ',' in data:
                    frame_data = base64.b64decode(data. split(',')[1])
                else:
                    frame_data = base64.b64decode(data)
            except Exception as e:
                await websocket.send_json({"error": f"Failed to decode frame: {str(e)}"})
                continue
            
            # Run AI detection
            try:
                result, _ = focus_service.process_webcam_frame(frame_data)
            except Exception as e:
                await websocket.send_json({"error": f"Detection failed: {str(e)}"})
                continue
            
            # Update session stats
            if result. get("metrics", {}).get("phone_detected"):
                session.phone_detected_count += 1
                session.total_violations += 1
            
            if not result.get("metrics", {}).get("person_detected"):
                session.left_seat_count += 1
                session.total_violations += 1
            
            if result.get("alert_type"):
                session.total_alerts += 1
                if result["alert_type"] == "gentle": 
                    session.gentle_alerts += 1
                elif result["alert_type"] == "urgent": 
                    session.urgent_alerts += 1
            
            db.commit()
            
            # Calculate duration
            duration = (datetime.utcnow() - session.started_at).seconds
            
            # Send response
            response = {
                "session_id": str(session.session_id),
                "timestamp": datetime.utcnow().isoformat(),
                
                # Detection results
                "is_focused": result.get("is_focused", False),
                "person_detected":  result.get("metrics", {}).get("person_detected", False),
                "phone_detected": result.get("metrics", {}).get("phone_detected", False),
                "confidence": result.get("confidence", 0.0),
                
                # Alert
                "message": result.get("message", ""),
                "alert_type":  result.get("alert_type"),
                
                # Stats
                "stats": {
                    "session_id": str(session.session_id),
                    "duration_seconds": duration,
                    "current_score": float(session.initial_score),  # TODO: Calculate dynamic score
                    "total_violations": session.total_violations,
                    "phone_detected_count": session.phone_detected_count,
                    "left_seat_count": session.left_seat_count,
                    "total_alerts": session.total_alerts,
                    "focus_percentage": 0.0  # TODO: Calculate
                }
            }
            
            await websocket.send_json(response)
            
    except WebSocketDisconnect:
        print(f"🔌 WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"❌ WebSocket error:  {e}")
        await websocket.close(code=1011, reason=str(e))