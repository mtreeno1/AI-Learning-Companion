# AI Learning Companion

An AI-powered learning companion application with real-time concentration monitoring using computer vision.

## Features

- **Real-time Focus Monitoring**: Uses AI to detect if the learner is focused by analyzing:
  - Phone detection (alerts when phone is visible)
  - Head pose estimation (tracks if user is looking at the screen)
  - Facial keypoint detection
- **Study Modes**:
  - Pomodoro Mode (25-minute focused sessions)
  - Manual Mode (custom duration)
- **Dashboard & History**: Track your focus statistics and study sessions
- **Modern UI**: Built with Next.js, React, and Tailwind CSS

## Architecture

The application consists of two main components:

1. **Frontend** (`ai-learning-companion-ui2/`): Next.js-based web application
2. **Backend** (`ai-engine/`): FastAPI service for AI-powered focus detection

## Prerequisites

- **Node.js** 18+ and pnpm
- **Python** 3.8+ and pip
- Webcam (for real-time monitoring)

## Setup

### Backend Setup

1. Navigate to the AI engine directory:
```bash
cd ai-engine
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Ensure YOLO models are in place:
   - `models/yolov8n.pt` - Object detection model
   - `models/yolov8n-pose.pt` - Pose estimation model
   
   These should already be included in the repository. If not, they will be downloaded automatically on first use.

5. Start the backend service:
```bash
python app.py
```

Or using uvicorn:
```bash
uvicorn app:app --host 0.0.0.0 --port 8080
```

The backend will be available at `http://localhost:8080`

### Frontend Setup

1. Navigate to the UI directory:
```bash
cd ai-learning-companion-ui2
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure the backend URL (optional):
   - Copy `.env.example` to `.env.local`
   - Update `NEXT_PUBLIC_API_URL` if your backend is running on a different host/port

```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
pnpm dev
```

The frontend will be available at `http://localhost:3000`

## Usage

1. **Start Both Services**:
   - Terminal 1: Start the backend (`cd ai-engine && python app.py`)
   - Terminal 2: Start the frontend (`cd ai-learning-companion-ui2 && pnpm dev`)

2. **Access the Application**:
   - Open your browser to `http://localhost:3000`

3. **Enable Camera**:
   - Click "Enable Camera" to start monitoring
   - Grant camera permissions when prompted

4. **Start a Study Session**:
   - Choose Pomodoro or Manual mode
   - Set your study duration
   - Click "Start" to begin

5. **Monitor Your Focus**:
   - The app will show real-time focus status
   - Green badge = Focused
   - Red badge = Not focused (with reason)

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

### Main Endpoints

- `GET /`: Service information
- `GET /health`: Health check
- `POST /analyze`: Analyze a single frame
- `WebSocket /ws/focus`: Real-time focus monitoring
- `POST /upload`: Batch process video file

## Focus Detection Logic

The AI determines focus based on:

1. **Phone Detection**: User is NOT focused if a phone is detected in the frame
2. **Head Pose**:
   - Horizontal turn (Yaw): Must be within ±25 degrees
   - Vertical tilt (Pitch): Must be within ±20 degrees
3. **Face Detection**: User must be visible in the frame

## Development

### Frontend Technologies
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI components

### Backend Technologies
- FastAPI
- YOLOv8 (Ultralytics)
- OpenCV
- WebSocket for real-time communication

## Building for Production

### Backend
```bash
cd ai-engine
pip install -r requirements.txt
# Run with production server
uvicorn app:app --host 0.0.0.0 --port 8080 --workers 4
```

### Frontend
```bash
cd ai-learning-companion-ui2
pnpm build
pnpm start
```

## Troubleshooting

### Backend Issues

**Models not found**
- Ensure `models/yolov8n.pt` and `models/yolov8n-pose.pt` exist
- They will be downloaded automatically on first use if missing

**Port already in use**
- Change the port: `uvicorn app:app --port 8081`
- Update frontend `.env.local` with new backend URL

**Camera access error**
- Check camera permissions in your browser
- Ensure no other application is using the camera

### Frontend Issues

**Cannot connect to backend**
- Verify backend is running: `curl http://localhost:8080/health`
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Check for CORS errors in browser console

**WebSocket connection failed**
- Ensure backend is running
- Check firewall settings
- Try using `http://` instead of `https://` for local development

## Project Structure

```
AI-Learning-Companion/
├── ai-engine/                 # Backend service
│   ├── app.py                # FastAPI application
│   ├── focus_detector.py     # Focus detection logic
│   ├── requirements.txt      # Python dependencies
│   ├── models/               # YOLO models
│   └── README.md            # Backend documentation
│
├── ai-learning-companion-ui2/ # Frontend application
│   ├── app/                  # Next.js app directory
│   ├── components/           # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and config
│   ├── package.json         # Node dependencies
│   └── .env.example         # Environment variables template
│
└── README.md                # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- YOLOv8 by Ultralytics for object detection and pose estimation
- FastAPI for the backend framework
- Next.js for the frontend framework
