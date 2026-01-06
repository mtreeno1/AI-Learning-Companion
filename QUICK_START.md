# Quick Start Guide - AI Learning Companion

## 🚀 Deploy trong 5 phút

### Bước 1: Clone Repository
```bash
git clone https://github.com/mtreeno1/AI-Learning-Companion.git
cd AI-Learning-Companion
```

### Bước 2: Cấu hình Environment Variables
```bash
# Copy file mẫu
cp .env.example .env

# Chỉnh sửa file .env (tối thiểu cần thay đổi):
# - DB_PASSWORD: Đổi password database
# - SECRET_KEY: Đổi secret key cho JWT
# - CORS_ORIGINS: Thêm domain của bạn
nano .env
```

### Bước 3: Deploy với Docker
```bash
# Chạy script deploy tự động
chmod +x deploy.sh
./deploy.sh

# Hoặc manual với docker-compose
docker-compose up -d
```

### Bước 4: Truy cập ứng dụng
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📋 Yêu Cầu Hệ Thống

### Minimum (Development):
- Docker & Docker Compose
- 2 CPU cores
- 4GB RAM
- 20GB storage
- Linux/macOS/Windows với WSL2

### Recommended (Production):
- 4 CPU cores
- 8GB RAM
- 50GB+ storage
- Ubuntu 20.04+ hoặc Debian 11+

## 🔧 Troubleshooting

### Port đã được sử dụng:
```bash
# Đổi port trong .env
BACKEND_PORT=8001
FRONTEND_PORT=3001
```

### Container không start:
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Restart
docker-compose restart
```

### Database connection error:
```bash
# Verify database is running
docker-compose ps db

# Check database logs
docker-compose logs db
```

### Out of memory:
```bash
# Increase Docker memory limit
# Docker Desktop -> Settings -> Resources -> Memory
# Recommend: 4GB minimum, 8GB better
```

## 🌐 Deploy lên VPS (DigitalOcean, Linode, etc.)

### 1. Chuẩn bị VPS
```bash
# SSH vào VPS
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install git
apt install git -y
```

### 2. Clone và Deploy
```bash
# Clone repository
git clone https://github.com/mtreeno1/AI-Learning-Companion.git
cd AI-Learning-Companion

# Setup environment
cp .env.example .env
nano .env  # Update với production values

# Deploy
./deploy.sh
```

### 3. Setup Domain và SSL
```bash
# Point domain DNS A record to your VPS IP
# Example: aicompanion.yourdomain.com -> 123.45.67.89

# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d aicompanion.yourdomain.com

# Auto-renew setup (already done by certbot)
certbot renew --dry-run
```

### 4. Configure Firewall
```bash
# Allow HTTP, HTTPS, SSH
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## ☁️ Deploy lên Cloud Platform

### Vercel (Frontend only):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd ai-learning-companion-ui2
vercel

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Railway (Backend):
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
cd ai-engine
railway up

# Add PostgreSQL addon in Railway dashboard
```

### Heroku:
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create ai-companion-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main
```

## 📊 Monitoring

### Check Status:
```bash
docker-compose ps
```

### View Logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Resource Usage:
```bash
docker stats
```

## 🔄 Updates

### Update Application:
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Update Dependencies:
```bash
# Backend
cd ai-engine
pip install -r requirements.txt --upgrade

# Frontend
cd ai-learning-companion-ui2
pnpm update
```

## 🗄️ Backup

### Database Backup:
```bash
# Create backup
docker-compose exec db pg_dump -U aicompanion ai_learning_companion > backup.sql

# Restore backup
docker-compose exec -T db psql -U aicompanion ai_learning_companion < backup.sql
```

### Full Backup:
```bash
# Stop containers
docker-compose down

# Backup volumes
tar -czf backup-$(date +%Y%m%d).tar.gz \
    ai-engine/recordings \
    ai-engine/models \
    .env \
    backup.sql

# Restart
docker-compose up -d
```

## 🆘 Support

- **Documentation**: Xem `DEPLOYMENT_GUIDE.md` cho chi tiết
- **Issues**: https://github.com/mtreeno1/AI-Learning-Companion/issues
- **Email**: support@yourdomain.com

## 📚 Next Steps

1. ✅ Deploy application
2. ✅ Test all features
3. ⬜ Setup monitoring (Uptime Robot, Sentry)
4. ⬜ Configure backups (daily/weekly)
5. ⬜ Setup CI/CD (GitHub Actions)
6. ⬜ Scale as needed

## 💡 Tips

1. **Always use HTTPS in production**
2. **Set strong passwords in .env**
3. **Enable firewall rules**
4. **Setup automatic backups**
5. **Monitor disk space** (video recordings can grow quickly)
6. **Use CDN for static assets** (optional)
7. **Setup alerts** for downtime

---

**Happy Deploying! 🎉**
