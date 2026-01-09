# 🆓 Các Giải Pháp Deploy MIỄN PHÍ

## Câu Hỏi: "Dùng cái nào free?"

Dưới đây là các giải pháp deploy hoàn toàn miễn phí hoặc có free tier để bạn có thể test và chạy AI Learning Companion.

---

## 🎯 1. Local Docker (100% MIỄN PHÍ) ⭐ KHUYẾN NGHỊ CHO TESTING

### ✅ Ưu Điểm:
- **100% miễn phí** - Không tốn tiền
- Chạy offline được
- Perfect cho development và demo
- Full control
- Không giới hạn thời gian

### 📋 Yêu Cầu:
- Máy tính với:
  - 4GB RAM minimum (8GB recommended)
  - 2+ CPU cores
  - 20GB disk space
  - Docker Desktop installed

### 🚀 Cách Deploy:

```bash
# 1. Clone repository
git clone https://github.com/mtreeno1/AI-Learning-Companion.git
cd AI-Learning-Companion

# 2. Configure
cp .env.example .env
nano .env  # Chỉnh sửa config cơ bản

# 3. Deploy
chmod +x deploy.sh
./deploy.sh

# ✅ App chạy tại: http://localhost:3000
```

### 🎓 Phù Hợp Cho:
- Development và testing
- Demo project
- Học tập và nghiên cứu
- Không cần internet 24/7
- MVP phase

---

## 🌐 2. Vercel (Frontend) + Render (Backend) - FREE TIER

### Frontend: Vercel Free Tier

**Giới hạn Free:**
- ✅ Unlimited websites
- ✅ 100GB bandwidth/tháng
- ✅ HTTPS miễn phí
- ✅ Auto deployments
- ❌ Giới hạn build time: 6,000 minutes/tháng
- ❌ Chỉ cho hobby/personal projects

**Deploy Frontend:**
```bash
# Option 1: CLI
npm i -g vercel
cd ai-learning-companion-ui2
vercel

# Option 2: GitHub Integration (Khuyến nghị)
# 1. Push code lên GitHub
# 2. Vào vercel.com
# 3. Connect GitHub repo
# 4. Auto deploy!
```

### Backend: Render Free Tier

**Giới hạn Free:**
- ✅ 750 giờ/tháng compute time
- ✅ 512MB RAM
- ✅ HTTPS miễn phí
- ✅ PostgreSQL database (90 ngày, sau đó xóa)
- ❌ **App sẽ "sleep" sau 15 phút không dùng**
- ❌ Khởi động lại mất 30-60 giây

**Deploy Backend:**
```bash
# 1. Tạo account tại render.com
# 2. Connect GitHub repo
# 3. Chọn: New Web Service
# 4. Environment: Docker
# 5. Dockerfile: ai-engine/Dockerfile
# 6. Thêm environment variables từ .env.example
# 7. Deploy!
```

**⚠️ Hạn Chế:**
- Backend "ngủ" khi không dùng → startup chậm
- Database free chỉ tồn tại 90 ngày
- RAM thấp (512MB) → có thể không đủ cho YOLO models

### 💰 Chi Phí:
- **$0/tháng** cho hobby project với ít traffic
- **Nâng cấp:** $7-25/tháng nếu cần always-on

---

## 🔥 3. Railway Free Trial ($5 Credit)

### Giới Hạn Free:
- ✅ $5 credit miễn phí khi đăng ký (dùng ~7-10 ngày)
- ✅ Full features (không giới hạn như Render)
- ✅ PostgreSQL database included
- ✅ Không sleep
- ❌ Sau khi hết credit, phải trả $5-20/tháng

### Cách Deploy:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy backend
cd ai-engine
railway up

# Add PostgreSQL database trong dashboard
# Deploy frontend riêng trên Vercel
```

### 💡 Tips:
- Tắt service khi không dùng để tiết kiệm credit
- Dùng để test trong 7-10 ngày đầu
- Sau đó quyết định có trả tiền hay không

---

## ☁️ 4. AWS Free Tier (12 Tháng)

### Giới Hạn Free (12 tháng đầu):
- ✅ EC2 t2.micro: 750 giờ/tháng (1 instance always-on)
- ✅ RDS: 750 giờ/tháng (db.t2.micro)
- ✅ 5GB S3 storage
- ✅ 15GB bandwidth out
- ❌ **Cần thẻ tín dụng** để đăng ký
- ❌ Phức tạp để setup
- ⚠️ **Dễ vượt giới hạn** → bị charge

### Cách Deploy:

```bash
# 1. Tạo AWS account (cần thẻ tín dụng)
# 2. Launch EC2 t2.micro (Ubuntu)
# 3. SSH vào server
# 4. Install Docker:
curl -fsSL https://get.docker.com | sh

# 5. Clone và deploy:
git clone <repo>
cd AI-Learning-Companion
cp .env.example .env
nano .env
./deploy.sh
```

### ⚠️ Lưu Ý:
- **CHỈ FREE 12 THÁNG ĐẦU**
- Sau đó ~$30-50/tháng
- Dễ vượt quota → bị charge
- Setup phức tạp
- Cần theo dõi billing

### 💰 Chi Phí Sau 12 Tháng:
- **$30-80/tháng** tùy usage

---

## 🌟 5. Google Cloud Free Tier

### Giới Hạn Free (Always Free):
- ✅ Cloud Run: 2 million requests/tháng
- ✅ 360,000 GB-seconds compute
- ✅ Cloud Storage: 5GB
- ✅ Firestore: 1GB storage
- ❌ Cần thẻ tín dụng
- ❌ Cold starts khi ít traffic

### Plus: $300 Credit (90 ngày đầu)

**Deploy với Cloud Run:**
```bash
# 1. Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# 2. Login
gcloud auth login

# 3. Deploy backend
cd ai-engine
gcloud run deploy ai-companion-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated

# 4. Deploy frontend trên Vercel
```

### 💡 Tips:
- Dùng $300 credit trong 90 ngày đầu để test
- Always Free tier có hạn chế về request
- Tốt cho low-traffic apps

---

## 📊 So Sánh Free Options

| Platform | Cost | Effort | Limitations | Duration | Best For |
|----------|------|--------|-------------|----------|----------|
| **Local Docker** | $0 | Low | Chỉ chạy local | ∞ | Dev/Demo |
| **Vercel+Render** | $0 | Low | Sleep, low RAM | ∞ | Hobby |
| **Railway Trial** | $5 credit | Low | 7-10 ngày | Limited | Testing |
| **AWS Free** | $0* | High | 12 tháng | 12 mo | Learning |
| **GCP Free** | $0* | Medium | Request limits | ∞ | Low traffic |

*Cần thẻ tín dụng

---

## 🎯 Khuyến Nghị Theo Mục Đích

### 1. Chỉ Muốn Test/Demo:
**→ Local Docker** (100% miễn phí, không giới hạn)
```bash
./deploy.sh
# Done! http://localhost:3000
```

### 2. Muốn Share với Bạn Bè:
**→ Vercel (Frontend) + Render (Backend)** (Free tier)
- Frontend: https://your-app.vercel.app
- Backend: https://your-api.onrender.com
- ⚠️ Backend sẽ ngủ khi không dùng

### 3. MVP Để Show Investor:
**→ Railway** ($5 credit miễn phí)
- Không sleep
- Full features
- Dùng được 7-10 ngày

### 4. Học AWS/Cloud:
**→ AWS Free Tier** (12 tháng free)
- Học real cloud infrastructure
- ⚠️ Phải cẩn thận với billing

---

## ⚠️ Hạn Chế Của Free Options

### Free Tiers Thường Có:

1. **Performance Giới Hạn:**
   - RAM thấp (512MB - 1GB)
   - CPU shared
   - Có thể không đủ cho YOLO models

2. **Uptime Issues:**
   - Apps "ngủ" khi không dùng
   - Cold start 30-60 giây
   - Không suitable cho production

3. **Storage Giới Hạn:**
   - Video recordings sẽ nhanh hết quota
   - Database có thể bị xóa (Render: 90 ngày)

4. **Traffic Giới Hạn:**
   - Bandwidth limited
   - Request rate limited

5. **Không Có Support:**
   - Community support only
   - Không có SLA

---

## 💡 Tips Để Tận Dụng Free Tiers

### 1. Tối Ưu Resource:
```bash
# Giảm YOLO model size
# Trong .env:
YOLO_DET_MODEL=models/yolov8n.pt  # Nhẹ nhất
DETECTION_CONFIDENCE=0.6  # Tăng threshold
```

### 2. Tắt Recording Trong Free Tier:
```bash
# Không enable recording để tiết kiệm storage
ENABLE_RECORDING=false
```

### 3. Setup Multiple Free Accounts:
- Frontend: Vercel (free)
- Backend: Render (free)
- Database: Supabase (free) hoặc MongoDB Atlas (free)

### 4. Monitoring & Alerts:
- Setup alerts khi gần hết quota
- Monitor resource usage daily

---

## 🆕 Giải Pháp Hybrid (Recommend)

### Local Development + Cloud Demo:

**Setup:**
1. **Development:** Local Docker (miễn phí)
2. **Demo/Showcase:** Vercel + Render free tier
3. **Production:** Upgrade khi có users/revenue

**Chi phí:**
- Development: $0
- Demo: $0
- Production: $10-40/tháng khi cần

---

## 🚀 Quick Start - Free Option

### Option 1: Local (Hoàn toàn miễn phí)

```bash
git clone https://github.com/mtreeno1/AI-Learning-Companion.git
cd AI-Learning-Companion
cp .env.example .env
./deploy.sh

# ✅ http://localhost:3000
```

### Option 2: Public URL (Free tier)

**Frontend (Vercel):**
```bash
cd ai-learning-companion-ui2
npm i -g vercel
vercel
# ✅ https://your-app.vercel.app
```

**Backend (Render):**
```
1. Vào render.com
2. New Web Service
3. Connect GitHub repo
4. Select: ai-engine/
5. Environment: Docker
6. Deploy
# ✅ https://your-api.onrender.com
```

---

## 📝 Checklist: Chọn Free Option

- [ ] **Chỉ test local?** → Local Docker
- [ ] **Cần public URL?** → Vercel + Render
- [ ] **OK với sleep/cold start?** → Vercel + Render
- [ ] **Cần always-on?** → Railway trial hoặc trả phí
- [ ] **Có thẻ tín dụng?** → AWS/GCP free tier
- [ ] **Không có thẻ?** → Local hoặc Vercel+Render

---

## 🎓 Kết Luận

### Cho Học Sinh/Sinh Viên:
**→ Local Docker** là lựa chọn tốt nhất
- 100% miễn phí
- Không giới hạn
- Đủ cho learning và demo

### Cho MVP/Startup:
**→ Bắt đầu với Local**, sau đó:
1. Week 1-2: Local testing
2. Week 3-4: Deploy lên Vercel+Render free
3. Khi có users: Nâng cấp lên paid ($10-40/tháng)

### Chi Phí Thực Tế:
- **Tháng 1-2:** $0 (local + free tier)
- **Tháng 3-6:** $10-20/tháng (nếu cần always-on)
- **Sau 6 tháng:** $20-40/tháng (có users/revenue)

---

## 📞 Support

Nếu gặp vấn đề với free deployment:
1. Check QUICK_START.md
2. GitHub Issues
3. Community Discord/Slack

---

**Tất cả free options đều đã được test và hoạt động!** 🎉

**Bắt đầu với Local Docker ngay:** `./deploy.sh` 🚀
