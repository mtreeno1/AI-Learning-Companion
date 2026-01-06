# Production Deployment Checklist

## 📋 Pre-Deployment

### 1. Code & Configuration
- [ ] All tests passing locally
- [ ] Code reviewed and approved
- [ ] No debug statements or console.logs in production code
- [ ] Environment variables properly configured
- [ ] `.env.example` updated with all required variables
- [ ] `.gitignore` properly configured (no secrets in repo)

### 2. Security
- [ ] Strong `SECRET_KEY` generated (min 32 characters)
- [ ] Database password is strong and unique
- [ ] CORS origins properly configured (no wildcards in production)
- [ ] HTTPS/SSL configured
- [ ] Firewall rules configured (only necessary ports open)
- [ ] Rate limiting enabled
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] Dependencies scanned for vulnerabilities

### 3. Database
- [ ] Database credentials secured
- [ ] Database backup strategy defined
- [ ] Database migrations ready
- [ ] Connection pooling configured
- [ ] Database timezone set correctly

### 4. Infrastructure
- [ ] Server/VPS provisioned with adequate resources
- [ ] Docker and Docker Compose installed
- [ ] Disk space monitored (especially for video recordings)
- [ ] Nginx or reverse proxy configured
- [ ] Domain DNS configured
- [ ] SSL certificates obtained (Let's Encrypt)

## 🚀 Deployment Steps

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Create deployment directory
sudo mkdir -p /opt/ai-learning-companion
sudo chown $USER:$USER /opt/ai-learning-companion
```

### 2. Clone & Configure
```bash
# Clone repository
cd /opt/ai-learning-companion
git clone https://github.com/mtreeno1/AI-Learning-Companion.git .

# Setup environment
cp .env.example .env
nano .env  # Update all production values

# Generate strong secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Deploy Application
```bash
# Run deployment script
chmod +x deploy.sh
./deploy.sh

# Select option 2 (Production with Nginx)
```

### 4. SSL/HTTPS Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 5. Firewall Configuration
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
sudo ufw status
```

## ✅ Post-Deployment

### 1. Verification
- [ ] Frontend accessible at https://yourdomain.com
- [ ] Backend API responding at https://yourdomain.com/api
- [ ] WebSocket connections working
- [ ] Database connections successful
- [ ] Video recording working
- [ ] AI detection functioning
- [ ] Login/Authentication working
- [ ] All features tested in production

### 2. Monitoring Setup
- [ ] Uptime monitoring configured (UptimeRobot/Pingdom)
- [ ] Application monitoring setup (Sentry)
- [ ] Log aggregation configured
- [ ] Disk space alerts configured
- [ ] CPU/Memory monitoring active
- [ ] Error tracking enabled

### 3. Backup Configuration
```bash
# Setup automated database backups
# Create backup script
cat > /opt/ai-learning-companion/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/ai-companion"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T db pg_dump -U aicompanion ai_learning_companion > $BACKUP_DIR/db_$DATE.sql

# Backup recordings (optional, can be large)
# tar -czf $BACKUP_DIR/recordings_$DATE.tar.gz ai-engine/recordings/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/ai-learning-companion/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/ai-learning-companion/backup.sh") | crontab -
```

### 4. Documentation
- [ ] Production URLs documented
- [ ] Access credentials stored securely (password manager)
- [ ] Runbook created for common operations
- [ ] Disaster recovery plan documented
- [ ] Team notified of deployment

## 🔧 Configuration Checklist

### Environment Variables (.env)
- [ ] `DB_PASSWORD` - Strong, unique password
- [ ] `SECRET_KEY` - Random 32+ character string
- [ ] `CORS_ORIGINS` - Production domain(s) only
- [ ] `NEXT_PUBLIC_API_URL` - Production backend URL
- [ ] `NEXT_PUBLIC_WS_URL` - Production WebSocket URL
- [ ] `DOMAIN` - Your production domain
- [ ] `LETSENCRYPT_EMAIL` - Valid email for SSL
- [ ] `PRODUCTION=true` - Set for production

### Docker Compose
- [ ] Resource limits configured
- [ ] Restart policies set to `unless-stopped`
- [ ] Health checks enabled
- [ ] Volume mounts configured correctly
- [ ] Network isolation configured

### Nginx
- [ ] SSL/TLS configured
- [ ] HTTP to HTTPS redirect enabled
- [ ] Correct upstream servers
- [ ] WebSocket proxy configured
- [ ] File upload size limits set
- [ ] Gzip compression enabled
- [ ] Security headers added

## 📊 Performance Optimization

### Backend
- [ ] Number of workers optimized (4-8 for 4 CPU cores)
- [ ] Database connection pool size configured
- [ ] YOLO model loaded on startup (no lazy loading)
- [ ] Static file serving optimized

### Frontend
- [ ] Static assets cached
- [ ] Images optimized
- [ ] Code splitting enabled
- [ ] Bundle size analyzed

### Database
- [ ] Indexes created on frequently queried fields
- [ ] Connection pooling enabled
- [ ] Query performance monitored
- [ ] Regular VACUUM/ANALYZE scheduled

## 🚨 Monitoring & Alerts

### Critical Alerts
- [ ] Server down
- [ ] Disk space > 80%
- [ ] Memory usage > 90%
- [ ] Database connection failures
- [ ] SSL certificate expiring soon (< 30 days)

### Application Metrics
- [ ] Response times
- [ ] Error rates
- [ ] Active sessions
- [ ] API request rates
- [ ] Video recording success rate

## 📝 Maintenance Tasks

### Daily
- [ ] Check application logs
- [ ] Monitor error rates
- [ ] Verify backups completed

### Weekly
- [ ] Review system resource usage
- [ ] Check disk space (recordings grow quickly)
- [ ] Review security logs
- [ ] Update dependencies if needed

### Monthly
- [ ] Review and optimize database
- [ ] Update system packages
- [ ] Review costs and optimize
- [ ] Test disaster recovery plan

## 🆘 Rollback Plan

If deployment fails:

1. **Stop new containers:**
   ```bash
   docker-compose down
   ```

2. **Restore previous version:**
   ```bash
   git checkout <previous-commit>
   docker-compose up -d
   ```

3. **Restore database backup (if needed):**
   ```bash
   docker-compose exec -T db psql -U aicompanion ai_learning_companion < backup.sql
   ```

4. **Verify rollback:**
   - Test critical functionality
   - Check logs for errors
   - Monitor metrics

## 📞 Support Contacts

- **DevOps Team**: devops@company.com
- **Database Admin**: dba@company.com
- **Security Team**: security@company.com
- **On-call**: +1-XXX-XXX-XXXX

## 🎉 Sign-off

**Deployed by:** _________________

**Date:** _________________

**Deployment successful:** [ ] Yes [ ] No

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Remember**: Always test in staging before deploying to production!
