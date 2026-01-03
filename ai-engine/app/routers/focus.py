import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Dict, Optional
import base64
from uuid import UUID
import gc  # For memory management

from app.database import get_db
from app.models.learning_session import LearningSession
from app.models.user import User
from app.schemas.focus import (
    SessionCreate, 
    SessionUpdate, 
    SessionResponse, 
    SessionListResponse,
    DetectionResult,
    SessionStats
)
from app.services.focus_service import get_focus_service
from app.dependencies import get_current_user
from utils.datetime_utils import now_utc, calculate_duration, make_aware

router = APIRouter(prefix="/api/focus", tags=["Focus Detection"])

# Track session data in memory
session_data: Dict[str, dict] = {}  # {session_id: {"total_frames": 0, "focused_frames": 0, "last_score": 100.0}}


# ==================== REST Endpoints ====================

@router.post("/sessions", response_model=SessionResponse, status_code=201)
async def create_session(
    session_create: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new learning session. 
    
    - **session_name**: Name of the learning session
    - **subject**: Subject being studied
    - **initial_score**: Starting score (default: 100.0)
    """
    session = LearningSession(
        user_id=current_user. id,
        session_name=session_create.session_name,
        subject=session_create. subject,
        initial_score=session_create.initial_score,
        current_score=session_create.initial_score,
        started_at=now_utc(),
        created_at=now_utc(),
        duration_seconds=0,
        total_violations=0,
        phone_detected_count=0,
        left_seat_count=0,
        total_alerts=0,
        gentle_alerts=0,
        urgent_alerts=0,
        focus_percentage=100.0,
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    print(f"✅ Created session: {session.session_id} for user {current_user.email}")
    
    return session


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """
    Get list of user's learning sessions with pagination.
    
    - **page**: Page number (starts at 1)
    - **page_size**: Number of items per page (max 100)
    - **status**: Filter by status (optional)
    """
    query = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id
    )
    
    # Apply status filter if provided
    if status:
        query = query.filter(LearningSession.status == status)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    sessions = query.order_by(
        LearningSession.started_at.desc()
    ).offset(offset).limit(page_size).all()
    
    return {
        "sessions": sessions,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific learning session."""
    session = db.query(LearningSession).filter(
        LearningSession.session_id == session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


@router.post("/sessions/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: UUID,
    session_update: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    End a learning session and calculate final metrics.
    
    - **status**: Final status (completed, cancelled, etc.)
    """
    session = db.query(LearningSession).filter(
        LearningSession.session_id == session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Set ended_at with timezone-aware datetime
    session. ended_at = now_utc()
    
    # Calculate final duration safely
    if session.started_at:
        session.duration_seconds = calculate_duration(
            session.started_at,
            session.ended_at
        )
    
    # Calculate final metrics
    if session.duration_seconds > 0:
        session. final_score = session.current_score
        session.average_score = (session.initial_score + session.current_score) / 2
        session.min_score = min(session.current_score, session.initial_score)
        session.max_score = max(session.current_score, session.initial_score)
    
    session.updated_at = now_utc()
    
    db.commit()
    db.refresh(session)
    
    # Cleanup session tracking data
    session_id_str = str(session_id)
    if session_id_str in session_data:
        del session_data[session_id_str]
    
    print(f"✅ Session ended: {session_id}")
    print(f"   Duration: {session.duration_seconds}s")
    print(f"   Final score: {session.final_score}")
    print(f"   Focus: {session.focus_percentage}%")
    
    return session


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a learning session."""
    session = db.query(LearningSession).filter(
        LearningSession.session_id == session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    if not session: 
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    print(f"✅ Session deleted: {session_id}")
    
    return None


# ==================== WebSocket Endpoint ====================

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    db:  Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time AI focus detection.
    
    Receives video frames and sends back detection results with session stats.
    
    Features:
    - Real-time frame processing
    - Dynamic score calculation
    - Violation tracking
    - Alert system
    - Keepalive ping/pong
    - Batch database commits for performance
    """
    await websocket.accept()
    
    # Validate session ID format
    try:
        session_uuid = UUID(session_id)
    except ValueError:
        await websocket.close(code=1008, reason="Invalid session ID format")
        return
    
    # Get session from database
    session = db.query(LearningSession).filter(
        LearningSession.session_id == session_uuid
    ).first()
    
    if not session:
        await websocket.close(code=1008, reason="Session not found")
        return
    
    # Load AI service
    try:
        focus_service = get_focus_service()
    except Exception as e: 
        print(f"❌ Failed to load AI service: {e}")
        await websocket.close(code=1011, reason="AI service unavailable")
        return
    
    # Initialize session tracking
    if session_id not in session_data:
        session_data[session_id] = {
            "total_frames": 0,
            "focused_frames": 0,
            "last_score": float(session.initial_score),
            "consecutive_violations": 0,  # Track consecutive violations for escalating alerts
        }
    
    print(f"🔌 WebSocket connected for session {session_id}")
    
    # Batch database commits counter
    frame_count = 0
    commit_interval = 10  # Commit every 10 frames for better performance
    
    try:
        while True:
            # Receive data from client
            data = await websocket.receive_text()
            
            # ✅ Handle keepalive ping
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket. send_json({"type": "pong", "timestamp": now_utc().isoformat()})
                    continue
            except json.JSONDecodeError:
                pass  # Not JSON, treat as frame data
            
            # ✅ Decode frame
            try:
                if ',' in data:
                    # Data URL format:  data:image/jpeg;base64,<base64data>
                    frame_data = base64.b64decode(data.split(',')[1])
                else: 
                    frame_data = base64.b64decode(data)
            except Exception as e:
                await websocket.send_json({
                    "error": f"Failed to decode frame: {str(e)}",
                    "timestamp": now_utc().isoformat()
                })
                continue
            
            # ✅ Run AI detection (without annotation to save memory)
            try:
                result, _ = focus_service.process_webcam_frame(frame_data, annotate=False)
            except Exception as e:
                print(f"❌ AI detection error: {e}")
                await websocket.send_json({
                    "error": f"Detection failed: {str(e)}",
                    "timestamp": now_utc().isoformat()
                })
                # Clean up on error
                del frame_data
                continue
            
            # ✅ Update frame counters
            session_data[session_id]["total_frames"] += 1
            frame_count += 1
            
            is_focused = result.get("is_focused", False)
            if is_focused:
                session_data[session_id]["focused_frames"] += 1
            
            # ✅ Extract metrics
            metrics = result.get("metrics", {})
            person_detected = metrics.get("person_detected", False)
            person_confidence = metrics.get("person_confidence", 0.0)
            phone_detected = metrics.get("phone_detected", False)
            
            # ✅ Update session violations with improved detection
            violation_occurred = False
            violation_type = None
            
            # Phone detection
            if phone_detected:
                session. phone_detected_count += 1
                session.total_violations += 1
                violation_occurred = True
                violation_type = "phone"
                
                # Override alert message
                result["message"] = "📱 Điện thoại phát hiện!  Hãy tập trung vào học tập."
                result["alert_type"] = "urgent"
            
            # Person detection - check for leaving seat
            # Consider left seat if: no person OR very low confidence
            if not person_detected or person_confidence < 0.25:  # Lowered threshold for better detection
                session.left_seat_count += 1
                session.total_violations += 1
                violation_occurred = True
                violation_type = "left_seat"
                
                # Override alert message
                if not person_detected:
                    result["message"] = "⚠️ Không phát hiện người! Vui lòng quay lại ghế."
                else:
                    result["message"] = "⚠️ Có vẻ bạn đang rời khỏi ghế. Hãy ngồi thẳng!"
                result["alert_type"] = "urgent"
            
            # ✅ Track consecutive violations for escalating alerts
            if violation_occurred:
                session_data[session_id]["consecutive_violations"] += 1
                
                # Escalate alert if too many consecutive violations - reduced threshold for faster response
                if session_data[session_id]["consecutive_violations"] >= 2:
                    result["alert_type"] = "critical"
                    result["message"] = "🚨 CẢNH BÁO: Nhiều vi phạm liên tiếp! Hãy tập trung!"
            else:
                session_data[session_id]["consecutive_violations"] = 0
            
            # ✅ Update alerts
            alert_type = result.get("alert_type")
            if alert_type:
                session.total_alerts += 1
                if alert_type == "gentle":
                    session.gentle_alerts += 1
                elif alert_type == "urgent":
                    session. urgent_alerts += 1
            
            # ✅ Calculate dynamic score
            current_score = session_data[session_id]["last_score"]
            
            if violation_occurred:
                # Decrease score based on violation severity - reduced penalties for smoother experience
                penalty = 2.0 if violation_type == "phone" else 1.5
                current_score = max(0.0, current_score - penalty)
            else:
                # Faster recovery score (0.2 per focused frame)
                if is_focused:
                    current_score = min(100.0, current_score + 0.2)
            
            session_data[session_id]["last_score"] = current_score
            session.current_score = current_score
            
            # ✅ Calculate focus percentage
            total_frames = session_data[session_id]["total_frames"]
            focused_frames = session_data[session_id]["focused_frames"]
            focus_percentage = (focused_frames / total_frames * 100) if total_frames > 0 else 100.0
            session. focus_percentage = focus_percentage
            
            # ✅ Calculate duration safely (handle timezone)
            current_time = now_utc()
            started_at = make_aware(session.started_at)
            duration_seconds = calculate_duration(started_at, current_time)
            session.duration_seconds = duration_seconds
            
            # ✅ Update timestamp
            session.updated_at = current_time
            
            # ✅ Batch commit to database (every N frames)
            if frame_count % commit_interval == 0:
                try:
                    db.commit()
                    # Periodic garbage collection to free memory
                    gc.collect()
                except Exception as e:
                    print(f"❌ Failed to commit session update: {e}")
                    db.rollback()
            
            # ✅ Prepare response
            response = {
                "session_id": str(session.session_id),
                "timestamp": current_time.isoformat(),
                
                # Detection results
                "is_focused":  is_focused,
                "person_detected": person_detected,
                "person_confidence": round(person_confidence, 2),
                "phone_detected":  phone_detected,
                "confidence": round(result.get("confidence", 0.0), 2),
                
                # Alert
                "message": result.get("message", ""),
                "alert_type": alert_type,
                
                # Additional info
                "violation_type": violation_type,
                "consecutive_violations": session_data[session_id]["consecutive_violations"],
                
                # Stats
                "stats":  {
                    "session_id": str(session.session_id),
                    "duration_seconds": duration_seconds,
                    "current_score": round(current_score, 1),
                    "total_violations": session. total_violations,
                    "phone_detected_count": session. phone_detected_count,
                    "left_seat_count":  session.left_seat_count,
                    "total_alerts":  session.total_alerts,
                    "gentle_alerts": session. gentle_alerts,
                    "urgent_alerts": session.urgent_alerts,
                    "focus_percentage": round(focus_percentage, 1),
                    "total_frames": total_frames,
                    "focused_frames": focused_frames,
                }
            }
            
            # ✅ Send response immediately
            await websocket.send_json(response)
            
            # ✅ Cleanup frame data to free memory
            del frame_data
            del result
    
    except WebSocketDisconnect:
        print(f"🔌 WebSocket disconnected for session {session_id}")
        
        # Final commit before cleanup
        try:
            db.commit()
            print(f"✅ Final state saved for session {session_id}")
        except Exception as e:
            print(f"❌ Failed to save final state: {e}")
            db.rollback()
        
        # Cleanup session data
        if session_id in session_data:
            final_stats = session_data[session_id]
            print(f"📊 Session {session_id} stats:")
            print(f"   Total frames: {final_stats['total_frames']}")
            print(f"   Focused frames:  {final_stats['focused_frames']}")
            print(f"   Final score: {final_stats['last_score']:. 1f}")
            del session_data[session_id]
    
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        import traceback
        traceback.print_exc()
        
        # Try to send error to client
        try:
            await websocket.send_json({
                "error":  f"Server error: {str(e)}",
                "timestamp": now_utc().isoformat()
            })
        except:
            pass
        
        # Try to close gracefully
        try:
            await websocket.close(code=1011, reason=str(e)[: 100])  # Limit reason length
        except:
            pass
        
        # Final commit attempt
        try:
            db. commit()
        except: 
            db.rollback()
        
        # Cleanup session data
        if session_id in session_data: 
            del session_data[session_id]