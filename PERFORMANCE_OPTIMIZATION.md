# 🚀 Performance Optimization Guide - AI Focus Tracking

## Problem Statement

**Current Issues:**
1. ⚠️ **40-second delay** between frontend and backend
2. ⚠️ **WebSocket auto-closing** during detection
3. ⚠️ Browser overload with continuous frame sending
4. ⚠️ Backend cannot keep up with 5 FPS frame rate

## Root Causes Analysis

### 1. Frame Queue Backlog (40s Delay)

**What's happening:**
```
Frontend sends: 5 frames/second (200ms interval)
Backend processes: ~0.5-1 frames/second (1-2s per frame with YOLO)

Result: Queue builds up
- After 10 seconds: 50 frames sent, ~7 processed = 43 frame backlog
- After 40 seconds: 200 frames sent, ~25 processed = 175 frame backlog
- Delay = 175 frames ÷ 0.7 fps = ~250 seconds of lag!
```

**Why so slow:**
- YOLO inference on CPU: 500ms - 2000ms per frame
- No GPU acceleration
- Full resolution processing (1280x720)
- No frame skipping on backend

### 2. WebSocket Closing

**Causes:**
- Message queue overflow (too many frames buffered)
- Backend taking too long to respond
- Browser timeout waiting for acknowledgment
- No back-pressure mechanism

### 3. Browser Overload

**Issues:**
- Continuously encoding frames to base64
- No feedback loop from backend
- Canvas operations blocking main thread
- No adaptive frame rate

## Solutions

### Solution 1: Adaptive Frame Rate with Back-Pressure ⭐ RECOMMENDED

**Concept:** Only send next frame after receiving previous result.

**Benefits:**
- ✅ Eliminates queue backlog
- ✅ Maintains sync between frontend/backend  
- ✅ Prevents WebSocket overflow
- ✅ Browser doesn't overload

**Implementation:**
- Change from interval-based to response-based sending
- Frontend waits for backend response before sending next frame
- Automatic adaptation to backend speed

### Solution 2: Frame Skipping on Backend

**Concept:** Backend drops frames if processing can't keep up.

**Benefits:**
- ✅ Prevents memory overflow
- ✅ Keeps system responsive
- ✅ Reduces delay

**Drawbacks:**
- ⚠️ May miss important events
- ⚠️ Less smooth tracking

### Solution 3: Reduce Processing Load

**Optimizations:**
- Lower input resolution (640x480 or 320x240)
- Reduce YOLO inference size (imgsz=320 instead of 640)
- Process every Nth frame only
- Use faster model (yolov8n is smallest, but could use yolov5n)

### Solution 4: Add GPU Acceleration

**If possible:**
- NVIDIA GPU with CUDA
- 10-50x faster inference
- Can handle real-time 30 FPS

## Implementation Guide

### Fix 1: Adaptive Frame Rate (Frontend)

**Current Code (camera-preview.tsx):**
```typescript
// ❌ BAD: Sends frames every 200ms regardless
const startSendingFrames = () => {
  frameIntervalRef.current = setInterval(() => {
    sendFrame()
  }, 200) // Fixed 5 FPS
}
```

**Fixed Code:**
```typescript
// ✅ GOOD: Sends next frame only after receiving response
const [isProcessing, setIsProcessing] = useState(false)

const sendFrame = async () => {
  if (isProcessing) return // Skip if still processing previous frame
  if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

  const video = mode === "camera" ? videoRef.current : uploadedVideoRef.current
  const canvas = canvasRef.current

  if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Reduce resolution for faster processing
    canvas.width = 640  // ✅ Lower resolution
    canvas.height = 480
    ctx.drawImage(video, 0, 0, 640, 480)

    try {
      setIsProcessing(true) // Mark as processing
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7) // ✅ Lower quality
      wsRef.current.send(dataUrl)
      // Response handler will set isProcessing(false)
    } catch (err) {
      console.error("Failed to send frame:", err)
      setIsProcessing(false)
    }
  }
}

// WebSocket message handler
ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data)
    
    if (data.type === "pong") {
      console.log("🏓 Pong received")
      return
    }
    
    if (data.error) {
      console.error("AI Error:", data.error)
      setError(data.error)
      setIsProcessing(false) // ✅ Reset on error
      return
    }
    
    // Handle detection result
    const result: DetectionResult = data
    setDetection(result)
    
    // ✅ Allow next frame to be sent
    setIsProcessing(false)
    
    // ✅ Automatically send next frame
    requestAnimationFrame(() => {
      sendFrame()
    })
    
    // Play alert if needed
    if (result.alert_type === "urgent" || result.alert_type === "critical") {
      playAlert(result.alert_type === "critical")
    }
  } catch (err) {
    console.error("Failed to parse WebSocket message:", err)
    setIsProcessing(false)
  }
}

// Start sending frames (no interval needed)
const startSendingFrames = () => {
  setIsProcessing(false)
  sendFrame() // Send first frame, then chain continues via onmessage
}
```

### Fix 2: Backend Frame Skip (focus.py)

**Add frame dropping logic:**
```python
# Track processing state per session
session_processing = {}  # {session_id: {"is_processing": bool, "last_frame_time": datetime}}

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(...):
    # Initialize processing state
    session_processing[session_id] = {
        "is_processing": False,
        "last_frame_time": datetime.now(),
        "frames_dropped": 0
    }
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # ✅ Check if currently processing
            if session_processing[session_id]["is_processing"]:
                # Drop frame if already processing
                session_processing[session_id]["frames_dropped"] += 1
                continue
            
            # Mark as processing
            session_processing[session_id]["is_processing"] = True
            
            try:
                # Process frame (existing code)
                result, _ = focus_service.process_webcam_frame(frame_data)
                
                # Send response
                await websocket.send_json(response)
                
            finally:
                # Mark as done processing
                session_processing[session_id]["is_processing"] = False
                session_processing[session_id]["last_frame_time"] = datetime.now()
    
    finally:
        # Cleanup
        if session_id in session_processing:
            dropped = session_processing[session_id]["frames_dropped"]
            if dropped > 0:
                print(f"⚠️ Session {session_id} dropped {dropped} frames")
            del session_processing[session_id]
```

### Fix 3: Optimize YOLO Processing (focus_service.py)

**Current:**
```python
def detect_frame(self, frame: np.ndarray) -> Dict:
    # Run YOLO detection
    results = self.model(frame, verbose=False)  # Full resolution
```

**Optimized:**
```python
def detect_frame(self, frame: np.ndarray) -> Dict:
    """
    Detect objects with optimized settings for real-time processing
    """
    # ✅ Resize frame for faster inference
    target_size = 320  # Smaller = faster (was 640 default)
    h, w = frame.shape[:2]
    if max(h, w) > target_size:
        scale = target_size / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        frame = cv2.resize(frame, (new_w, new_h))
    
    # ✅ Run YOLO with optimized settings
    results = self.model(
        frame,
        imgsz=320,      # Lower inference size
        conf=0.25,      # Lower confidence = faster
        iou=0.45,       # Standard IOU
        verbose=False,
        half=False,     # FP16 if GPU available
        device='cpu'    # or 'cuda' if GPU
    )
```

### Fix 4: Add Performance Monitoring

**Backend (focus.py):**
```python
import time

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(...):
    # Performance tracking
    performance_stats = {
        "total_frames": 0,
        "total_processing_time": 0.0,
        "max_processing_time": 0.0,
        "dropped_frames": 0
    }
    
    try:
        while True:
            # ... receive frame ...
            
            # ✅ Measure processing time
            start_time = time.time()
            
            try:
                result, _ = focus_service.process_webcam_frame(frame_data)
                
                processing_time = time.time() - start_time
                performance_stats["total_frames"] += 1
                performance_stats["total_processing_time"] += processing_time
                performance_stats["max_processing_time"] = max(
                    performance_stats["max_processing_time"],
                    processing_time
                )
                
                # ✅ Add performance info to response
                response["performance"] = {
                    "processing_time_ms": round(processing_time * 1000, 1),
                    "avg_fps": round(
                        performance_stats["total_frames"] / 
                        performance_stats["total_processing_time"],
                        2
                    ) if performance_stats["total_processing_time"] > 0 else 0
                }
                
                await websocket.send_json(response)
                
                # ✅ Log if slow
                if processing_time > 1.0:
                    print(f"⚠️ Slow frame: {processing_time:.2f}s")
                    
            except Exception as e:
                print(f"❌ Processing error: {e}")
                continue
                
    finally:
        # Print final stats
        if performance_stats["total_frames"] > 0:
            avg_time = performance_stats["total_processing_time"] / performance_stats["total_frames"]
            print(f"📊 Session {session_id} performance:")
            print(f"   Total frames: {performance_stats['total_frames']}")
            print(f"   Avg processing time: {avg_time:.3f}s")
            print(f"   Max processing time: {performance_stats['max_processing_time']:.3f}s")
            print(f"   Avg FPS: {performance_stats['total_frames'] / performance_stats['total_processing_time']:.2f}")
```

### Fix 5: WebSocket Keepalive Improvements

**Current keepalive:** 30 seconds (good)

**Improvements:**
```typescript
// Add timeout detection
const RESPONSE_TIMEOUT = 5000 // 5 seconds

let responseTimeoutId: NodeJS.Timeout | null = null

const sendFrame = () => {
  // ... existing code ...
  
  // Set timeout for response
  responseTimeoutId = setTimeout(() => {
    console.warn("⚠️ No response from server for 5 seconds")
    setIsProcessing(false) // Allow retry
    // Could trigger reconnect here
  }, RESPONSE_TIMEOUT)
}

ws.onmessage = (event) => {
  // Clear timeout
  if (responseTimeoutId) {
    clearTimeout(responseTimeoutId)
    responseTimeoutId = null
  }
  
  // ... rest of handler ...
}
```

## Performance Targets

### After Optimization:

| Metric | Before | Target | How |
|--------|--------|--------|-----|
| **Latency** | 40s | <1s | Adaptive frame rate |
| **Frame Rate** | 5 FPS sent | 1-3 FPS actual | Match backend speed |
| **Processing Time** | 1-2s/frame | 0.3-0.5s/frame | Lower resolution + imgsz |
| **WebSocket Stability** | Closes | Stable | Back-pressure |
| **Browser CPU** | High | Low | Send less |

### Realistic Expectations:

**With CPU-only (no GPU):**
- Real-time lag: 0.5-1 second (acceptable)
- Effective FPS: 1-2 FPS (enough for focus tracking)
- Processing time: 300-800ms per frame

**With GPU:**
- Real-time lag: <200ms (excellent)
- Effective FPS: 5-10 FPS (smooth)
- Processing time: 20-100ms per frame

## Quick Fix Summary

### Priority 1 (Critical): Adaptive Frame Rate
**File:** `camera-preview.tsx`
- Remove fixed interval
- Send frame only after receiving response
- Add `isProcessing` state

### Priority 2 (Important): Backend Frame Drop
**File:** `focus.py`
- Add processing flag per session
- Drop incoming frames if busy
- Log dropped frames

### Priority 3 (Important): Optimize YOLO
**File:** `focus_service.py`
- Resize to 320x320 before inference
- Use imgsz=320
- Lower confidence threshold

### Priority 4 (Nice): Performance Monitoring
- Add timing measurements
- Log slow frames
- Display FPS in UI

### Priority 5 (Optional): GPU
- Install CUDA toolkit
- Install GPU-enabled PyTorch
- Change device='cuda' in YOLO

## Testing Performance

### 1. Check Processing Time
```bash
# Backend logs should show:
📊 Session xxx performance:
   Avg processing time: 0.450s  # Target: <0.5s
   Max processing time: 0.850s
   Avg FPS: 2.2  # Target: >1.5
```

### 2. Check Latency
```typescript
// Frontend: Add timestamp to frames
const sendFrame = () => {
  const timestamp = Date.now()
  const dataWithTimestamp = {
    frame: dataUrl,
    timestamp: timestamp
  }
  wsRef.current.send(JSON.stringify(dataWithTimestamp))
}

// On response:
ws.onmessage = (event) => {
  const latency = Date.now() - data.clientTimestamp
  console.log(`Latency: ${latency}ms`) // Target: <1000ms
}
```

### 3. Monitor Frame Drops
```bash
# Should see in backend logs:
⚠️ Session xxx dropped N frames  # Target: <10% drop rate
```

## Troubleshooting

### Still 40s delay?
1. Check if adaptive frame rate is active (should see ~1-2 FPS)
2. Verify backend is not queuing frames
3. Check processing time in logs
4. Consider reducing resolution further (320x240)

### WebSocket still closing?
1. Verify keepalive is working (should see pong logs)
2. Check for memory leaks (restart backend)
3. Increase WebSocket timeout if possible
4. Check network stability

### Browser still overloaded?
1. Reduce canvas operations (use lower resolution)
2. Check if multiple tabs running
3. Profile with Chrome DevTools
4. Disable unnecessary UI updates

## Summary

**Root Cause:** Frontend sending frames faster than backend can process.

**Main Fix:** Adaptive frame rate - send next frame only after receiving previous response.

**Result:** 
- ✅ Sync frontend/backend
- ✅ Eliminate 40s delay
- ✅ Stable WebSocket
- ✅ Responsive browser

**Implementation Time:** ~2 hours for all fixes

**Expected Improvement:**
- Latency: 40s → <1s (40x better)
- Stability: Frequent disconnects → Stable
- Browser: Overloaded → Responsive
