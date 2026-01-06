# Hướng Dẫn Deploy AI Learning Companion

## Tổng Quan Hệ Thống

AI Learning Companion là một ứng dụng full-stack với:
- **Frontend**: Next.js 16 (React 19, TypeScript)
- **Backend**: Python FastAPI với YOLO models (YOLOv8)
- **Database**: PostgreSQL
- **AI Models**: Computer Vision (Object Detection, Pose Estimation)
- **Real-time**: WebSocket cho video streaming

## 🚀 Các Giải Pháp Deploy Được Khuyến Nghị

### 1. Docker + Docker Compose (Khuyến nghị cho bắt đầu) ⭐

**Ưu điểm:**
- Dễ setup, nhất quán trên mọi môi trường
- Tất cả dependencies được đóng gói
- Dễ scale và maintain
- Hoạt động trên local, VPS, hoặc cloud

**Phù hợp cho:**
- Development và Testing
- Deploy lên VPS (DigitalOcean, Linode, Vultr)
- Self-hosted solutions

**Cách sử dụng:**
```bash
# Clone repository
git clone https://github.com/mtreeno1/AI-Learning-Companion.git
cd AI-Learning-Companion

# Copy environment files
cp .env.example .env

# Build and run
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Chi phí ước tính:** $10-40/tháng cho VPS (2-4 CPU cores, 4-8GB RAM)

### 2. Cloud Platform - Vercel + Heroku/Railway

**Frontend trên Vercel:**
- **Ưu điểm**: Free tier hào phóng, auto-scaling, CDN global, CI/CD tự động
- **Phù hợp**: Next.js apps
- **Setup**: Connect GitHub repo → Auto deploy

**Backend trên Railway/Heroku:**
- **Railway**: Modern, dễ dùng, $5-20/tháng
- **Heroku**: Mature platform, nhiều add-ons, $7-25/tháng

**Ưu điểm tổng thể:**
- Managed infrastructure
- Auto-scaling
- Easy deployment
- Built-in monitoring

**Nhược điểm:**
- Chi phí cao hơn VPS khi scale
- AI models nặng có thể cần paid tiers
- Ít control hơn

**Chi phí ước tính:** $10-50/tháng (bắt đầu)

### 3. AWS (Amazon Web Services) - Production Grade

**Kiến trúc:**
- **Frontend**: AWS Amplify hoặc S3 + CloudFront
- **Backend**: EC2 hoặc ECS (Docker)
- **Database**: RDS PostgreSQL
- **Storage**: S3 cho video recordings
- **Load Balancer**: ALB

**Ưu điểm:**
- Highly scalable
- Nhiều services tích hợp
- Reliable và secure
- Professional monitoring

**Nhược điểm:**
- Phức tạp hơn để setup
- Cần kiến thức về AWS
- Chi phí có thể cao

**Chi phí ước tính:** $50-200/tháng (tùy traffic)

### 4. Google Cloud Platform (GCP)

**Kiến trúc:**
- **Frontend**: Firebase Hosting hoặc Cloud Run
- **Backend**: Cloud Run (containerized) hoặc Compute Engine
- **Database**: Cloud SQL PostgreSQL
- **Storage**: Cloud Storage
- **AI**: Có thể tích hợp Vertex AI

**Ưu điểm:**
- Tốt cho AI/ML workloads
- Free tier có giới hạn
- Tích hợp tốt với AI services
- Auto-scaling với Cloud Run

**Chi phí ước tính:** $40-150/tháng

### 5. DigitalOcean App Platform + Droplets

**Kiến trúc:**
- **Frontend**: App Platform (static site)
- **Backend**: App Platform hoặc Droplet với Docker
- **Database**: Managed PostgreSQL
- **Storage**: Spaces (S3-compatible)

**Ưu điểm:**
- Đơn giản, dễ sử dụng
- Giá cả minh bạch
- Managed services
- Tài liệu tốt

**Chi phí ước tính:** $20-80/tháng

## 📋 So Sánh Chi Tiết

| Tiêu chí | Docker+VPS | Vercel+Railway | AWS | GCP | DigitalOcean |
|----------|------------|----------------|-----|-----|--------------|
| **Độ khó setup** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Chi phí (start)** | $10-40 | $10-50 | $50-200 | $40-150 | $20-80 |
| **Scalability** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **AI/ML support** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Maintenance** | Cao | Thấp | Trung bình | Trung bình | Thấp |
| **Control** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🎯 Khuyến Nghị Theo Use Case

### Cho Developer/Student (Budget thấp):
**→ Docker + DigitalOcean Droplet ($10-20/month)**
- Setup đơn giản
- Full control
- Đủ cho development và demo
- Có thể upgrade dễ dàng

### Cho Startup/MVP (Tốc độ deploy):
**→ Vercel + Railway ($10-30/month để bắt đầu)**
- Deploy nhanh nhất
- Auto CI/CD
- Managed infrastructure
- Scale dễ dàng khi cần

### Cho Production/Enterprise:
**→ AWS hoặc GCP (Budget $100+/month)**
- Professional infrastructure
- High availability
- Security và compliance
- Advanced monitoring và analytics

### Cho Demo/Testing:
**→ Docker Compose trên local machine (Free)**
- Không cần cloud
- Perfect cho development
- Có thể demo offline

## 🛠️ Yêu Cầu Hệ Thống Tối Thiểu

### Backend (Python + YOLO):
- **CPU**: 2+ cores (4+ cores recommended)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 20GB minimum (50GB+ cho recordings)
- **GPU**: Optional nhưng tốt cho performance (NVIDIA CUDA)

### Frontend (Next.js):
- **Node.js**: 18.x hoặc 20.x
- **RAM**: 512MB minimum (2GB recommended)
- **Storage**: 1GB

### Database (PostgreSQL):
- **RAM**: 512MB minimum (1-2GB recommended)
- **Storage**: 5GB minimum

### Tổng cộng cho VPS:
- **Minimum**: 2 CPU cores, 4GB RAM, 30GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 100GB storage

## 📦 Các File Cần Thiết (Đã Cung Cấp)

1. **Dockerfile** (cho backend và frontend)
2. **docker-compose.yml** (orchestration)
3. **.env.example** (environment variables template)
4. **nginx.conf** (reverse proxy configuration)
5. **.github/workflows/deploy.yml** (CI/CD automation)

## 🔐 Security Checklist

- [ ] Sử dụng HTTPS (SSL/TLS certificates)
- [ ] Bảo mật environment variables
- [ ] Firewall configuration (chỉ mở ports cần thiết)
- [ ] Database authentication và encryption
- [ ] Rate limiting cho API
- [ ] CORS configuration đúng
- [ ] Regular security updates
- [ ] Backup database thường xuyên

## 📊 Monitoring và Maintenance

### Tools Khuyến Nghị:
1. **Uptime Monitoring**: UptimeRobot, Pingdom
2. **Application Monitoring**: Sentry, New Relic
3. **Logs**: ELK Stack, Loki
4. **Metrics**: Prometheus + Grafana

### Tasks Thường Xuyên:
- Weekly: Check logs, disk space
- Monthly: Update dependencies, security patches
- Quarterly: Review costs, optimize resources

## 🚦 Quy Trình Deploy Bước Đầu

### Bước 1: Chuẩn bị
```bash
# Clone repo
git clone <your-repo>
cd AI-Learning-Companion

# Tạo environment files
cp .env.example .env
# Edit .env với config của bạn
```

### Bước 2: Build Images
```bash
# Build Docker images
docker-compose build
```

### Bước 3: Deploy
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Bước 4: Verify
```bash
# Test backend
curl http://localhost:8000/

# Test frontend
open http://localhost:3000
```

### Bước 5: Setup Domain (Optional)
- Point domain DNS to server IP
- Setup SSL with Let's Encrypt
- Configure Nginx reverse proxy

## 📞 Support và Resources

- **Documentation**: Xem các file `*_SUMMARY.md` và `VIDEO_RECORDING_SYSTEM.md`
- **Issues**: GitHub Issues
- **Community**: Stack Overflow tags: `fastapi`, `nextjs`, `yolo`, `opencv`

## 🎓 Kết Luận

**Khuyến nghị bắt đầu**: Deploy với **Docker + Docker Compose** trên một VPS (DigitalOcean hoặc Linode) với cấu hình 2-4 CPU cores và 4-8GB RAM. Đây là giải pháp tốt nhất về tỷ lệ chi phí/hiệu suất và dễ dàng scale khi cần thiết.

**Next steps**:
1. Xem file `docker-compose.yml` được cung cấp
2. Config `.env` file
3. Deploy và test
4. Setup monitoring
5. Configure domain và SSL
