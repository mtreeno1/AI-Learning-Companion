# 🚀 Aggressive Performance Tuning Guide

## Current Issue: 2-3 Second Response Time

If you're still experiencing 2-3 second delays after the optimizations, here are additional aggressive tuning options.

## Root Cause: CPU-Bound YOLO Inference

**The Problem:**
- YOLO inference on CPU is inherently slow
- Even with optimizations, CPU processing takes 0.5-2 seconds per frame
- This is the bottleneck, not the network or frontend

**Current Optimizations Applied:**
- ✅ Frame resolution: 320x240 (very low)
- ✅ JPEG quality: 0.5 (very compressed)
- ✅ YOLO imgsz: 320 (smallest practical size)
- ✅ Class filtering: Only person + phone
- ✅ max_det: 10 (limit detections)
- ✅ Adaptive frame rate (no queue buildup)

**If still experiencing 2-3s delays, try these options:**

---

## Option 1: Skip Every Nth Frame (Backend)

**Concept:** Process only every 2nd or 3rd frame, skip the rest

**Implementation (focus.py):**

```python
# Add frame skip counter
frame_skip_counter = {}  # {session_id: counter}

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(...):
    # Initialize
    frame_skip_counter[session_id] = 0
    SKIP_RATE = 2  # Process every 2nd frame (1 = no skip, 2 = every other, 3 = every third)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # ... handle ping ...
            
            # ✅ Skip frame logic
            frame_skip_counter[session_id] += 1
            if frame_skip_counter[session_id] % SKIP_RATE != 0:
                # Skip this frame - send last known result
                if detection:  # Use last detection result
                    await websocket.send_json(response)
                continue
            
            # Process frame normally
            # ... existing code ...
    finally:
        if session_id in frame_skip_counter:
            del frame_skip_counter[session_id]
```

**Result:** 2x-3x faster effective FPS, but may miss rapid events

---

## Option 2: Use Even Smaller YOLO Model

**Current:** YOLOv8n (n = nano, smallest v8)

**Try:** YOLOv5n or YOLOv5s (older but faster on CPU)

**Installation:**
```bash
pip install ultralytics==8.0.0  # Ensure latest
```

**Change focus_service.py:**
```python
def __init__(self, model_path: str = "yolov5n.pt"):  # Changed from yolov8n
    print(f"🤖 Loading YOLO model: {model_path}")
    self.model = YOLO(model_path)
    # ... rest of code ...
```

**YOLOv5n is typically 20-30% faster than YOLOv8n on CPU**

---

## Option 3: Reduce Image Resolution Even Further

**Current:** 320x240

**Try:** 224x224 or 160x120

**Frontend (camera-preview.tsx):**
```typescript
canvas.width = 224   // or 160
canvas.height = 224  // or 120
ctx.drawImage(video, 0, 0, 224, 224)

const dataUrl = canvas.toDataURL("image/jpeg", 0.4)  // Even lower quality
```

**Backend (focus_service.py):**
```python
target_size = 224  # or 160 (from 320)

results = self.model(
    frame,
    imgsz=224,  # Match target_size
    # ... rest ...
)
```

**Warning:** Very low resolution may reduce detection accuracy

---

## Option 4: Batch Processing with Caching

**Concept:** Cache last N detection results, process new frame only occasionally

**Implementation:**
```python
# In focus.py
detection_cache = {}  # {session_id: {"result": ..., "timestamp": ..., "ttl": 2}}

async def websocket_endpoint(...):
    detection_cache[session_id] = {"result": None, "timestamp": time.time(), "ttl": 1.0}
    
    while True:
        data = await websocket.receive_text()
        
        # Check cache
        cache = detection_cache[session_id]
        current_time = time.time()
        
        if cache["result"] and (current_time - cache["timestamp"]) < cache["ttl"]:
            # Use cached result
            await websocket.send_json(cache["result"])
            continue
        
        # Process new frame
        result, _ = focus_service.process_webcam_frame(frame_data)
        
        # Update cache
        cache["result"] = response
        cache["timestamp"] = current_time
        
        await websocket.send_json(response)
```

**Result:** Reduces processing load by reusing results

---

## Option 5: Add GPU Support (RECOMMENDED)

**This is the BEST solution for real-time performance**

### Prerequisites:
- NVIDIA GPU (GTX 1050 or better)
- CUDA Toolkit installed
- GPU-enabled PyTorch

### Installation:

**1. Install CUDA Toolkit:**
```bash
# Check GPU
nvidia-smi

# Install CUDA 11.8 or 12.1 (depends on your GPU)
# Visit: https://developer.nvidia.com/cuda-downloads
```

**2. Install GPU PyTorch:**
```bash
cd ai-engine
pip uninstall torch torchvision  # Remove CPU version
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**3. Verify GPU:**
```python
import torch
print(torch.cuda.is_available())  # Should be True
print(torch.cuda.get_device_name(0))  # Your GPU name
```

**4. Update focus_service.py:**
```python
import torch

def __init__(self, model_path: str = "yolov8n.pt"):
    print(f"🤖 Loading YOLO model: {model_path}")
    
    # ✅ Auto-detect device
    self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"🔧 Using device: {self.device}")
    
    self.model = YOLO(model_path)
    # ... rest ...

def detect_frame(self, frame: np.ndarray) -> Dict:
    # ... resize code ...
    
    results = self.model(
        frame,
        imgsz=320,
        conf=0.20,
        # ... other params ...
        half=True if self.device == 'cuda' else False,  # ✅ FP16 on GPU
        device=self.device  # ✅ Use GPU if available
    )
```

**Expected Performance with GPU:**
- Processing time: 20-100ms per frame (vs 500-2000ms on CPU)
- Real-time: <200ms latency
- Effective FPS: 10-30 FPS

---

## Option 6: Preprocessing Optimization

**Reduce decoding overhead:**

**Backend (focus.py):**
```python
# Keep decoded frame in memory
frame_cache = {}  # {session_id: cv2 frame}

async def websocket_endpoint(...):
    try:
        while True:
            # ... receive data ...
            
            # ✅ Decode once, cache
            if session_id not in frame_cache:
                nparr = np.frombuffer(frame_data, np.uint8)
                frame_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                frame_cache[session_id] = frame_img
            else:
                frame_img = frame_cache[session_id]
                # Update cache every 5 frames
                if frame_count % 5 == 0:
                    nparr = np.frombuffer(frame_data, np.uint8)
                    frame_cache[session_id] = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Use cached frame for detection
            result, _ = focus_service.detect_frame(frame_cache[session_id])
```

---

## Option 7: Multi-Threading (Advanced)

**Use separate thread for AI processing:**

**Backend (focus.py):**
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Create thread pool
executor = ThreadPoolExecutor(max_workers=2)

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(...):
    try:
        while True:
            # ... receive frame ...
            
            # ✅ Run YOLO in separate thread
            loop = asyncio.get_event_loop()
            result, _ = await loop.run_in_executor(
                executor,
                focus_service.process_webcam_frame,
                frame_data
            )
            
            # ... send response ...
```

**Warning:** May cause race conditions, needs careful implementation

---

## Performance Comparison

| Method | Processing Time | Latency | Accuracy | Difficulty |
|--------|----------------|---------|----------|-----------|
| **Current (Optimized CPU)** | 0.5-2s | 1-3s | Good | Easy |
| Skip Every 2nd Frame | 0.5-1s | 1-2s | Good | Easy |
| YOLOv5n | 0.4-1.5s | 0.5-2s | Good | Easy |
| 224x224 Resolution | 0.3-1s | 0.5-1.5s | Fair | Easy |
| Frame Caching | 0.3-0.8s | 0.5-1s | Fair | Medium |
| **GPU (NVIDIA)** | 0.02-0.1s | <0.2s | Excellent | Medium |
| Multi-threading | 0.3-0.8s | 0.5-1s | Good | Hard |

---

## Recommended Approach

### For CPU-Only Systems:

**Tier 1 (Quick Wins):**
1. ✅ Already applied: 320x240, quality 0.5, imgsz=320
2. Try YOLOv5n (20-30% faster)
3. Skip every 2nd frame (2x faster)

**Tier 2 (If Still Slow):**
4. Reduce to 224x224 or 160x120
5. Add frame caching
6. Lower confidence to 0.15

**Tier 3 (Last Resort):**
7. Process every 3rd frame only
8. Use 160x120 resolution
9. Cache detections for 1-2 seconds

### For Systems with GPU:

**Just add GPU support - problem solved!**
- 10-50x faster than CPU
- Real-time performance guaranteed
- No quality tradeoffs needed

---

## Testing Your Changes

**1. Check Backend Processing Time:**
```bash
# Backend logs should show:
⚡ Performance metrics for session xxx:
   Avg processing time: 0.XXXs  # Target: <0.5s for CPU, <0.1s for GPU
```

**2. Check Frontend Latency:**
```javascript
// UI should display:
Latency: XXXms  # Target: <1000ms for CPU, <200ms for GPU
```

**3. Measure FPS:**
```bash
# Backend logs:
Avg FPS: X.XX  # Target: >1.5 FPS for CPU, >10 FPS for GPU
```

---

## When Nothing Works (CPU Limitations)

**Reality Check:**

If you're on a CPU-only system and still getting 2-3s delays after all optimizations:

**This is normal for CPU-based YOLO inference.**

**Your options:**
1. **Accept the delay** - 2s latency is reasonable for focus tracking (not real-time, but functional)
2. **Get GPU** - Only way to achieve true real-time (<200ms)
3. **Use simpler detection** - Face detection only (OpenCV Haar Cascades, much faster)
4. **Cloud GPU** - Deploy to GPU-enabled cloud instance

**Consider Alternative Approach:**

Instead of YOLO, use **OpenCV face detection** (much faster on CPU):

```python
import cv2

# Load face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def detect_face_only(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    person_detected = len(faces) > 0
    
    return {
        "is_focused": person_detected,
        "person_detected": person_detected,
        "phone_detected": False,  # Can't detect phone with this method
        "confidence": 0.8 if person_detected else 0.0
    }
```

**Performance:** 10-50ms per frame (20-40x faster than YOLO)
**Tradeoff:** Can't detect phones, only presence of person

---

## Summary

**2-3 second response time is expected on CPU.**

**Quick fixes to try (in order):**
1. ✅ Already applied optimizations
2. Switch to YOLOv5n (20-30% faster)
3. Skip every 2nd frame (2x faster)
4. Lower resolution to 224x224 (30% faster)
5. **Add GPU (50x faster) - BEST SOLUTION**

**If you must stay on CPU:**
- Accept 1-2 second latency as normal
- Or switch to faster face detection (no phone detection)

**GPU is the only real solution for <200ms latency.**
