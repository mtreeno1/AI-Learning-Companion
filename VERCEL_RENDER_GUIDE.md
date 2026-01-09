# 🚀 Hướng Dẫn Deploy: Vercel (Frontend) + Render (Backend)

## Tổng Quan

Deploy AI Learning Companion với:
- **Frontend (Next.js)**: Vercel Free Tier
- **Backend (FastAPI + YOLO)**: Render Free Tier
- **Database**: Render PostgreSQL Free Tier

---

## ⚠️ LƯU Ý QUAN TRỌNG: RENDER VỚI AI MODELS

### Render Free Tier CÓ GIỚI HẠN:

#### 🔴 Vấn Đề Chính:
1. **RAM: Chỉ 512MB** 
   - YOLO model (yolov8n.pt) ~6MB
   - OpenCV + dependencies ~200-300MB
   - Runtime memory cho inference ~300-500MB
   - **➡️ TỔNG: Có thể vượt 512MB khi chạy AI detection**

2. **CPU: Shared, không có GPU**
   - Inference chậm hơn rất nhiều so với GPU
   - 1 frame có thể mất 2-5 giây (thay vì 0.1s với GPU)

3. **Sleep Mode**
   - Sau 15 phút không dùng, service "ngủ"
   - Khởi động lại mất 30-60 giây
   - Load YOLO model lúc startup mất thêm 10-20 giây

### ✅ KẾT LUẬN:

**Render FREE Tier KHÔNG PHỤ HỢP cho Production với AI models!**

**Nhưng có thể dùng cho:**
- ✅ Demo/Testing với ít requests
- ✅ Proof of concept
- ✅ Show cho bạn bè xem (chấp nhận chậm)
- ❌ KHÔNG dùng cho: Real-time processing, nhiều users, production

### 💡 GIẢI PHÁP:

**Option 1: Nâng cấp Render Paid Plan**
- Standard: $7/mo (512MB RAM) - Vẫn ít
- Pro: $25/mo (2GB RAM) - OK cho AI model
- Plus: No sleep, better CPU

**Option 2: Dùng Platform Khác Cho Backend**
- Railway: $5-10/mo, 1GB RAM
- DigitalOcean: $12/mo, 2GB RAM (Khuyến nghị)
- AWS/GCP: Có GPU options

---

## 📋 HƯỚNG DẪN DEPLOY CHI TIẾT

### Phần 1: Deploy Frontend lên Vercel

#### Bước 1: Chuẩn Bị

```bash
# Clone repository
git clone https://github.com/mtreeno1/AI-Learning-Companion.git
cd AI-Learning-Companion

# Đảm bảo Next.js config đúng
cat ai-learning-companion-ui2/next.config.mjs
# Phải có: output: 'standalone'
```

#### Bước 2: Deploy với Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd ai-learning-companion-ui2

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# ? Set up and deploy "~/AI-Learning-Companion/ai-learning-companion-ui2"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? ai-learning-companion
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

#### Bước 3: Configure Environment Variables

```bash
# Sau khi deploy, vào Vercel dashboard:
# 1. https://vercel.com/dashboard
# 2. Chọn project "ai-learning-companion"
# 3. Settings → Environment Variables
# 4. Thêm:

NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-backend-url.onrender.com

# 5. Redeploy để áp dụng env vars
```

#### Bước 4: Hoặc Deploy với GitHub Integration (Khuyến nghị)

```bash
# 1. Push code lên GitHub repository của bạn
git push origin main

# 2. Vào https://vercel.com/new
# 3. Import GitHub repository
# 4. Select "ai-learning-companion-ui2" as root directory
# 5. Add environment variables
# 6. Deploy!

# ✅ Vercel sẽ auto deploy mỗi khi bạn push code
```

---

### Phần 2: Deploy Backend lên Render

#### ⚠️ Tối Ưu Cho Render Free Tier

Trước khi deploy, tối ưu backend để giảm RAM usage:

```bash
cd ai-engine

# Tạo file render-requirements.txt (nhẹ hơn)
cat > render-requirements.txt << 'EOF'
# Minimal dependencies for Render free tier
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic[email]==2.5.0
pydantic-settings==2.1.0
python-multipart==0.0.6
passlib[argon2]==1.7.4
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0

# AI/CV - Use minimal versions
ultralytics==8.0.196
opencv-python-headless==4.8.1.78  # Headless version (smaller)
numpy==1.24.3
EOF
```

Tạo `render.yaml` cho Render:

```yaml
services:
  - type: web
    name: ai-companion-backend
    env: docker
    dockerfilePath: ./Dockerfile
    plan: free  # Change to 'starter' ($7/mo) for better performance
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: ai-companion-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: CORS_ORIGINS
        value: https://your-frontend.vercel.app
      - key: API_HOST
        value: 0.0.0.0
      - key: API_PORT
        value: 8000

databases:
  - name: ai-companion-db
    plan: free
```

#### Bước 1: Tạo Render Account

```bash
# 1. Vào https://render.com
# 2. Sign up (free)
# 3. Verify email
```

#### Bước 2: Deploy Backend

**Option A: Từ Dashboard (Dễ nhất)**

```
1. Vào https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - Name: ai-companion-backend
   - Region: Oregon (US West)
   - Branch: main
   - Root Directory: ai-engine
   - Environment: Docker
   - Instance Type: Free
   
5. Add Environment Variables:
   DATABASE_URL: [Will be auto-filled when you add database]
   SECRET_KEY: [Generate với: openssl rand -hex 32]
   CORS_ORIGINS: https://your-app.vercel.app
   API_HOST: 0.0.0.0
   API_PORT: 8000
   RECORDING_DEFAULT_FPS: 15  # Giảm FPS để tiết kiệm CPU
   YOLO_DET_MODEL: models/yolov8n.pt  # Use smallest model
   
6. Click "Create Web Service"
```

**Option B: Render CLI**

```bash
# Install Render CLI
npm install -g render

# Login
render login

# Deploy
cd ai-engine
render deploy
```

#### Bước 3: Add PostgreSQL Database

```
1. Trong Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: ai-companion-db
   - Region: Same as backend (Oregon)
   - Plan: Free
   
4. Click "Create Database"

5. Copy "External Database URL"

6. Vào Backend Service → Environment
7. Update DATABASE_URL với URL vừa copy
```

#### Bước 4: Verify Deployment

```bash
# Check backend health
curl https://your-backend.onrender.com/

# Expected response:
{
  "status": "online",
  "service": "AI Learning Companion API",
  "version": "1.0.0"
}
```

---

## 🔧 Tối Ưu Hóa Cho Free Tier

### 1. Giảm RAM Usage

**Trong `ai-engine/app/config.py` hoặc `.env`:**

```python
# Giảm FPS recording
RECORDING_DEFAULT_FPS=10  # Thay vì 30

# Tắt các features không cần thiết
ENABLE_RECORDING=false  # Tắt recording để tiết kiệm RAM

# Giảm detection confidence để xử lý nhanh hơn
DETECTION_CONFIDENCE=0.6  # Tăng threshold

# Giới hạn concurrent sessions
MAX_CONCURRENT_SESSIONS=2
```

### 2. Optimize YOLO Model

**Sử dụng model nhỏ nhất:**

```python
# Trong code, load model nhẹ:
model = YOLO('yolov8n.pt')  # Nano version (6MB)

# Set inference size nhỏ
results = model(frame, imgsz=416)  # Thay vì 640
```

### 3. Lazy Loading

**Chỉ load model khi cần:**

```python
# Không load model at startup
# Load on-demand khi có request đầu tiên

@app.on_event("startup")
async def startup_event():
    # Don't load models here on free tier
    pass

def get_model():
    global det_model
    if det_model is None:
        det_model = YOLO("models/yolov8n.pt")
    return det_model
```

### 4. Giảm Dependencies

**Sử dụng `opencv-python-headless` thay vì `opencv-python`:**

```bash
# opencv-python-headless nhẹ hơn ~100MB
pip install opencv-python-headless
```

---

## 📊 Performance Expectations

### Render Free Tier với AI Models:

| Metric | Free Tier | Paid ($7/mo) | Ideal |
|--------|-----------|--------------|-------|
| **RAM** | 512MB | 512MB | 2GB+ |
| **CPU** | Shared | Shared | Dedicated |
| **Inference Time** | 2-5s/frame | 1-3s/frame | 0.1s/frame |
| **Cold Start** | 30-60s | Instant | Instant |
| **Concurrent Users** | 1-2 | 5-10 | 50+ |
| **Sleep After** | 15 min | Never | Never |

### ⚠️ Thực Tế:

**Free Tier chỉ phù hợp cho:**
- Personal testing
- Demo cho 1-2 người
- Proof of concept
- Development staging

**KHÔNG phù hợp cho:**
- Real-time video processing
- Multiple concurrent users
- Production use
- Business applications

---

## 🆙 Upgrade Recommendations

### Khi Nào Nên Upgrade?

**Upgrade Render lên Paid nếu:**
- Cần always-on (no sleep)
- Có >3 users concurrent
- Cần faster inference
- Production deployment

**Hoặc chuyển sang Platform Khác:**

| Need | Platform | Cost |
|------|----------|------|
| Better AI performance | Railway | $7-15/mo |
| Most cost-effective | DigitalOcean Droplet | $12/mo |
| GPU support | AWS EC2 (g4dn.xlarge) | $200/mo |
| Best for AI | GCP with GPU | $150/mo |

---

## 🔗 Kết Nối Frontend ↔ Backend

### Update Frontend Environment Variables

**Trong Vercel Dashboard:**

```bash
NEXT_PUBLIC_API_URL=https://ai-companion-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://ai-companion-backend.onrender.com
```

### Update Backend CORS

**Trong Render Environment Variables:**

```bash
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-preview.vercel.app
```

### Redeploy Both Services

```bash
# Frontend: Auto redeploy khi update env vars
# Backend: Manual redeploy hoặc trigger via GitHub push
```

---

## 🧪 Testing Deployment

### 1. Test Frontend

```bash
# Open browser
https://your-app.vercel.app

# Check console for errors
# F12 → Console tab
```

### 2. Test Backend

```bash
# Health check
curl https://your-backend.onrender.com/

# API docs
https://your-backend.onrender.com/docs
```

### 3. Test Full Flow

```
1. Login vào app
2. Start study session
3. Enable camera
4. Start AI detection
5. Observe:
   - First request: Slow (cold start + model load)
   - Subsequent: Still slower than local
   - After 15 min idle: Sleep → slow restart
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Backend "Out of Memory"

**Dấu hiệu:**
- Error: "Killed" trong logs
- 502 Bad Gateway
- Crashes randomly

**Giải pháp:**
```bash
# Option 1: Upgrade to paid plan ($7/mo)
# Option 2: Tắt recording, giảm FPS
# Option 3: Chuyển sang Railway/DigitalOcean
```

### Issue 2: Cold Start Lâu (30-60s)

**Dấu hiệu:**
- First request sau 15 phút rất chậm
- Frontend timeout

**Giải pháp:**
```bash
# Option 1: Upgrade to paid (no sleep)
# Option 2: Keep-alive service (ping every 10 min)
# Option 3: Hiển thị loading message cho users
```

### Issue 3: YOLO Model Load Fails

**Dấu hiệu:**
- Error loading model
- "No space left on device"

**Giải pháp:**
```bash
# Sử dụng model nhỏ nhất
YOLO_DET_MODEL=models/yolov8n.pt  # 6MB

# Hoặc download on-demand thay vì bundle
```

### Issue 4: CORS Errors

**Dấu hiệu:**
- "CORS policy blocked" trong console
- API calls fail from frontend

**Giải pháp:**
```bash
# Render backend env vars:
CORS_ORIGINS=https://your-exact-domain.vercel.app

# Không dùng wildcard (*) trong production
```

---

## 💰 Cost Analysis

### Completely Free Setup:

```
Vercel (Frontend): $0/month
Render Backend: $0/month
Render Database: $0/month (90 days only)

Total: $0/month
```

**⚠️ Limitations:**
- Backend sleeps after 15 min
- 512MB RAM (tight for AI)
- Database expires after 90 days
- Slow inference
- Not suitable for production

### Minimal Paid Setup:

```
Vercel (Frontend): $0/month (hobby tier OK)
Render Backend: $7/month (Starter plan)
Render Database: $7/month (Starter plan)

Total: $14/month
```

**✅ Benefits:**
- No sleep
- Still 512MB RAM (marginal improvement)
- Database persistent
- Better support

### Recommended Setup:

```
Vercel (Frontend): $0/month
DigitalOcean Droplet: $12/month (2GB RAM)
  - Backend + Database in Docker

Total: $12/month
```

**✅ Much Better:**
- 2GB RAM (enough for AI models)
- No sleep
- Better CPU
- Full control
- Can add GPU later

---

## 🎯 Final Recommendation

### For Your Use Case (AI Models):

**🚫 KHÔNG khuyến nghị Render Free Tier cho production**

**Lý do:**
1. 512MB RAM quá ít cho YOLO + dependencies
2. CPU shared → inference rất chậm
3. Sleep mode → bad UX
4. Database chỉ 90 ngày

**✅ Khuyến nghị thay thế:**

**1. Cho Testing/Demo (Free):**
```bash
Local Docker - 100% free
./deploy.sh
# Best performance, không giới hạn
```

**2. Cho MVP với Public URL ($12/mo):**
```bash
Vercel (Frontend - Free) + DigitalOcean Droplet (Backend - $12/mo)
# See DEPLOYMENT_GUIDE.md
```

**3. Nếu PHẢI dùng Render:**
- Upgrade lên Render Starter ($7/mo minimum)
- Tối ưu code như hướng dẫn trên
- Accept performance compromise
- Chỉ cho demo, không production

---

## 📚 Tài Liệu Liên Quan

- **DEPLOYMENT_GUIDE.md** - So sánh các platforms
- **FREE_DEPLOYMENT_OPTIONS.md** - Tất cả free options
- **DEPLOYMENT_COMPARISON.md** - Chi tiết cost/performance
- **QUICK_START.md** - Local deployment

---

## 🆘 Cần Hỗ Trợ?

Nếu gặp vấn đề:
1. Check Render logs: Dashboard → Service → Logs
2. Check Vercel logs: Dashboard → Deployments → Logs
3. GitHub Issues: [Repository Issues]
4. Render Discord: https://render.com/discord

---

**Kết luận: Render Free Tier có thể deploy được nhưng KHÔNG tối ưu cho AI models. Khuyến nghị dùng Local Docker cho testing hoặc DigitalOcean ($12/mo) cho production.** 🎯
