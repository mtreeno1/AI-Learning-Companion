# AI Learning Companion 🎓🤖

Hệ thống trợ lý học tập thông minh sử dụng Computer Vision và AI để theo dõi và cải thiện hiệu quả học tập.

## ✨ Tính Năng

- 🎥 **Real-time Focus Tracking**: Theo dõi mức độ tập trung qua webcam
- 🔍 **AI Detection**: Phát hiện điện thoại, rời khỏi chỗ ngồi, và các hành vi phân tâm
- 📹 **Video Recording**: Ghi lại phiên học tập chất lượng cao (30 FPS, Full HD)
- 📊 **Analytics Dashboard**: Thống kê và phân tích hiệu suất học tập
- ⏱️ **Pomodoro Timer**: Quản lý thời gian học tập hiệu quả
- 🔐 **Authentication**: Bảo mật với JWT và PostgreSQL

## 🏗️ Kiến Trúc

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│              React 19 + TypeScript + Tailwind            │
└────────────────────┬────────────────────────────────────┘
                     │ REST API + WebSocket
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                       │
│          Python + YOLO (YOLOv8) + OpenCV                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                   │
│           User Data + Sessions + Recordings              │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Với Docker (Khuyến nghị):

```bash
# Clone repository
git clone https://github.com/mtreeno1/AI-Learning-Companion.git
cd AI-Learning-Companion

# Cấu hình môi trường
cp .env.example .env
nano .env  # Chỉnh sửa các giá trị cần thiết

# Deploy
chmod +x deploy.sh
./deploy.sh
```

Truy cập:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Manual Setup:

#### Backend:
```bash
cd ai-engine
pip install -r requirements.txt
python run.py
```

#### Frontend:
```bash
cd ai-learning-companion-ui2
npm install -g pnpm
pnpm install
pnpm dev
```

## 📋 Yêu Cầu Hệ Thống

### Development:
- Docker & Docker Compose
- 2+ CPU cores
- 4GB RAM
- 20GB storage

### Production:
- 4+ CPU cores  
- 8GB RAM
- 50GB+ storage
- Ubuntu 20.04+ hoặc Debian 11+

## 📚 Tài Liệu

- [**DEPLOYMENT_GUIDE.md**](./DEPLOYMENT_GUIDE.md) - Hướng dẫn deploy chi tiết
- [**QUICK_START.md**](./QUICK_START.md) - Bắt đầu nhanh trong 5 phút
- [**IMPLEMENTATION_SUMMARY.md**](./IMPLEMENTATION_SUMMARY.md) - Tổng quan triển khai
- [**VIDEO_RECORDING_SYSTEM.md**](./ai-engine/VIDEO_RECORDING_SYSTEM.md) - Hệ thống ghi video

## 🛠️ Stack Công Nghệ

### Frontend:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- WebSocket client

### Backend:
- Python 3.10
- FastAPI
- YOLOv8 (Ultralytics)
- OpenCV
- PostgreSQL
- SQLAlchemy
- JWT Authentication

### DevOps:
- Docker & Docker Compose
- Nginx (reverse proxy)
- GitHub Actions (CI/CD)

## 🌐 Deployment Options

| Platform | Difficulty | Cost/month | Scalability |
|----------|-----------|------------|-------------|
| Docker + VPS | ⭐⭐⭐ | $10-40 | ⭐⭐⭐ |
| Vercel + Railway | ⭐⭐⭐⭐⭐ | $10-50 | ⭐⭐⭐⭐ |
| AWS | ⭐⭐ | $50-200 | ⭐⭐⭐⭐⭐ |
| Google Cloud | ⭐⭐ | $40-150 | ⭐⭐⭐⭐⭐ |
| DigitalOcean | ⭐⭐⭐⭐ | $20-80 | ⭐⭐⭐⭐ |

Xem [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) để biết thêm chi tiết.

## 🔐 Security

- JWT authentication
- Password hashing với Argon2
- CORS configuration
- SQL injection protection (SQLAlchemy)
- Path traversal protection
- Rate limiting ready

## 📊 Performance

**Browser → Server:**
- Bandwidth: ~250 KB/s (5 FPS)
- CPU: Minimal
- Memory: <100 MB

**Server Processing:**
- CPU: Moderate (AI detection + encoding)
- Memory: ~500 MB per session
- Storage: ~1 MB/minute (Full HD, H.264)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- GitHub: [@mtreeno1](https://github.com/mtreeno1)

## 🙏 Acknowledgments

- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/)
- [OpenCV](https://opencv.org/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/mtreeno1/AI-Learning-Companion/issues)
- **Documentation**: Xem thư mục docs/
- **Discussions**: [GitHub Discussions](https://github.com/mtreeno1/AI-Learning-Companion/discussions)

---

**Made with ❤️ for students and learners**
