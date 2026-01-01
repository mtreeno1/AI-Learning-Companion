# AI Engine - Focus Monitoring Service

This service provides real-time concentration monitoring using computer vision and deep learning. It uses YOLOv8 models to detect phones and estimate head pose to determine if a user is focused during study sessions.

## Features

- **Phone Detection**: Detects if a cell phone is present in the video frame
- **Head Pose Estimation**: Calculates yaw and pitch angles to determine if user is looking at the screen
- **Real-time Analysis**: WebSocket support for low-latency real-time monitoring
- **REST API**: HTTP endpoints for single frame analysis and batch video processing
- **CORS Enabled**: Ready for frontend integration

## Prerequisites

- Python 3.8 or higher
- Webcam (for real-time monitoring)
- YOLO model files (placed in `models/` directory)

## Installation

1. Navigate to the ai-engine directory:
```bash
cd ai-engine
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Ensure YOLO models are in place:
   - `models/yolov8n.pt` - Object detection model
   - `models/yolov8n-pose.pt` - Pose estimation model

## Running the Service

### Start the API Server

```bash
python app.py
```

Or using uvicorn directly:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The service will be available at `http://localhost:8000`

### API Documentation

Once the service is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### GET `/`
Returns service information and available endpoints.

### GET `/health`
Health check endpoint to verify service status.

### POST `/analyze`
Analyze a single video frame for focus detection.

**Request Body:**
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "focused": true,
    "phone_detected": false,
    "phone_info": null,
    "head_pose": {
      "yaw": 5.2,
      "pitch": -3.1
    },
    "keypoints": [[x1, y1], [x2, y2], ...],
    "focus_reasons": ["User is focused"]
  }
}
```

### WebSocket `/ws/focus`
Real-time focus monitoring via WebSocket connection.

**Client sends:**
```json
{
  "image": "base64_encoded_frame"
}
```

**Server responds:**
```json
{
  "success": true,
  "data": {
    "focused": true,
    ...
  }
}
```

### POST `/upload`
Upload a video file for batch processing.

**Form Data:**
- `file`: Video file

**Response:**
```json
{
  "success": true,
  "data": {
    "total_frames": 1000,
    "analyzed_frames": 100,
    "focused_frames": 85,
    "focus_percentage": 85.0
  }
}
```

## Focus Detection Logic

The service determines focus based on:

1. **Phone Detection**: User is NOT focused if a phone is detected
2. **Head Pose**:
   - Yaw (horizontal): Must be within ±25 degrees
   - Pitch (vertical): Must be within ±20 degrees
3. **Face Detection**: User must be visible in the frame

## Testing with Webcam

A standalone test script is available:

```bash
python test_webcam.py
```

This will open a window showing:
- Real-time video feed
- Phone detection boxes
- Head pose keypoints
- Focus status indicator

Press 'q' to quit.

## Configuration

Default thresholds can be customized when initializing `FocusDetector`:

```python
from focus_detector import FocusDetector

detector = FocusDetector(
    phone_conf_threshold=0.5,  # Phone detection confidence
    yaw_threshold=25.0,         # Max yaw angle in degrees
    pitch_threshold=20.0        # Max pitch angle in degrees
)
```

## Integration with Frontend

The frontend can connect to this service using:

1. **REST API** for single frame analysis
2. **WebSocket** for real-time streaming (recommended for live monitoring)

Example WebSocket connection from JavaScript:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/focus');

ws.onopen = () => {
  // Send frame
  ws.send(JSON.stringify({ image: base64Frame }));
};

ws.onmessage = (event) => {
  const result = JSON.parse(event.data);
  console.log('Focus status:', result.data.focused);
};
```

## Troubleshooting

### Models not found
Ensure the YOLO model files are in the `models/` directory:
- Download from: https://github.com/ultralytics/assets/releases

### Camera access issues
- Check camera permissions
- Ensure no other application is using the camera
- Try a different camera index in `test_webcam.py` (change `VideoCapture(0)` to `VideoCapture(1)`)

### CORS errors
If you encounter CORS issues, update the `allow_origins` list in `app.py` to include your frontend URL.

## License

Part of the AI Learning Companion project.
