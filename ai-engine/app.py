"""
Focus Monitoring Service API
FastAPI service for real-time concentration monitoring using computer vision.
"""
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import base64
from typing import Dict, Any
import logging
from focus_detector import FocusDetector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Focus Monitoring Service",
    description="AI-powered concentration monitoring service for learning companion",
    version="1.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize focus detector
focus_detector = FocusDetector()


def decode_image(image_data: str) -> np.ndarray:
    """
    Decode base64 image data to numpy array.
    
    Args:
        image_data: Base64 encoded image string
        
    Returns:
        Decoded image as numpy array
    """
    # Remove data URL prefix if present
    if "base64," in image_data:
        image_data = image_data.split("base64,")[1]
    
    # Decode base64 to bytes
    img_bytes = base64.b64decode(image_data)
    
    # Convert to numpy array
    nparr = np.frombuffer(img_bytes, np.uint8)
    
    # Decode image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Failed to decode image")
    
    return img


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Focus Monitoring Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "/analyze": "POST - Analyze a single frame for focus detection",
            "/ws/focus": "WebSocket - Real-time focus monitoring stream",
            "/health": "GET - Health check endpoint"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "models_loaded": True
    }


@app.post("/analyze")
async def analyze_frame(data: Dict[str, Any]) -> JSONResponse:
    """
    Analyze a single video frame for focus detection.
    
    Request body should contain:
    - image: Base64 encoded image data
    
    Returns:
        JSON response with focus analysis results
    """
    try:
        if "image" not in data:
            raise HTTPException(status_code=400, detail="Missing 'image' field in request")
        
        # Decode image
        frame = decode_image(data["image"])
        
        # Analyze frame
        result = focus_detector.analyze_frame(frame)
        
        return JSONResponse(content={
            "success": True,
            "data": result
        })
    
    except ValueError as e:
        logger.error(f"Image decoding error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.websocket("/ws/focus")
async def websocket_focus_monitoring(websocket: WebSocket):
    """
    WebSocket endpoint for real-time focus monitoring.
    
    Client should send base64 encoded video frames.
    Server responds with focus analysis results.
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            # Receive frame data
            data = await websocket.receive_json()
            
            if "image" not in data:
                await websocket.send_json({
                    "success": False,
                    "error": "Missing 'image' field"
                })
                continue
            
            try:
                # Decode and analyze frame
                frame = decode_image(data["image"])
                result = focus_detector.analyze_frame(frame)
                
                # Send results back to client
                await websocket.send_json({
                    "success": True,
                    "data": result
                })
            
            except ValueError as e:
                logger.error(f"Frame processing error: {e}")
                await websocket.send_json({
                    "success": False,
                    "error": f"Invalid frame data: {str(e)}"
                })
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                await websocket.send_json({
                    "success": False,
                    "error": "Internal server error"
                })
    
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")


@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file for batch processing.
    
    Args:
        file: Video file to process
        
    Returns:
        JSON response with analysis summary
    """
    try:
        # Read video file
        contents = await file.read()
        
        # Save temporarily
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        # Process video
        cap = cv2.VideoCapture(temp_path)
        
        total_frames = 0
        focused_frames = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            total_frames += 1
            
            # Analyze every 10th frame to speed up processing
            if total_frames % 10 == 0:
                result = focus_detector.analyze_frame(frame)
                if result["focused"]:
                    focused_frames += 1
        
        cap.release()
        
        # Calculate focus percentage
        analyzed_frames = total_frames // 10
        focus_percentage = (focused_frames / analyzed_frames * 100) if analyzed_frames > 0 else 0
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "total_frames": total_frames,
                "analyzed_frames": analyzed_frames,
                "focused_frames": focused_frames,
                "focus_percentage": round(focus_percentage, 2)
            }
        })
    
    except Exception as e:
        logger.error(f"Video upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Video processing failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
