# 🚀 Prebuilt Docker Images Workflow (Windows → Oracle)

This guide covers building Docker images on your Windows PC and deploying them on Oracle Cloud VM.

---

## 📦 Setup Overview

- **Build Location**: Windows PC (faster builds)
- **Registry**: Docker Hub (`hammadhafeez1100`)
- **Deploy Location**: Oracle Cloud VM
- **Database**: MySQL 8.0 (containerized)

---

## 🔧 Part 1: Build & Push (Windows PC)

### 1. Update Your Code
Make all your changes to the codebase on Windows.

### 2. Build and Push Images

```powershell
# Navigate to project root
cd c:\Users\hamma\OneDrive\Desktop\FYP\TABEEB-Healthcare

# Login to Docker Hub (first time only)
docker login

# Build backend image (~2-3 minutes)
cd TabeebBackend\tabeeb_backend
docker build -t hammadhafeez1100/tabeeb-backend:latest .
docker push hammadhafeez1100/tabeeb-backend:latest
cd ..\..

# Build frontend image (~3-5 minutes)
cd TabeebFrontend
docker build -t hammadhafeez1100/tabeeb-frontend:latest .
docker push hammadhafeez1100/tabeeb-frontend:latest
cd ..
```

### Alternative: Use Build Script
```bash
# In Git Bash or WSL on Windows
bash build-and-push.sh
```

### 3. Push Code to GitHub
```bash
git add .
git commit -m "Update: description of your changes"
git push origin main
```

---

## 🌐 Part 2: Deploy on Oracle VM

### 1. SSH into Oracle Instance
```bash
ssh ubuntu@<YOUR_ORACLE_VM_IP>
```

### 2. Pull Latest Code
```bash
cd TABEEB-Healthcare
git pull origin main
```

### 3. Verify .env Configuration

Make sure `.env` exists with these critical settings:

```bash
# Check if .env exists
cat .env

# If not, copy from example
cp .env.example .env
nano .env
```

**Required .env settings for Oracle:**
```env
# Database (MySQL Container)
DATABASE_URL=mysql://tabeeb_user:Moeez4316$@mysql:3306/tabeeb_db
MYSQL_ROOT_PASSWORD=Moeez4316$
MYSQL_DATABASE=tabeeb_db
MYSQL_USER=tabeeb_user
MYSQL_PASSWORD=Moeez4316$

# API URL (update with your Oracle VM IP or domain)
NEXT_PUBLIC_API_URL=https://tabeeb.dpdns.org/api
# Or for IP-based access:
# NEXT_PUBLIC_API_URL=http://<YOUR_ORACLE_VM_IP>:5002/api
```

### 4. Deploy with Prebuilt Images

**Quick Deploy (Automated):**
```bash
chmod +x deploy-prebuilt.sh
bash deploy-prebuilt.sh
```

**Manual Deploy:**
```bash
# Stop old containers
docker-compose -f docker-compose.prebuilt.yml down

# Pull latest images from Docker Hub
docker-compose -f docker-compose.prebuilt.yml pull

# Start all services (MySQL + Backend + Frontend + Caddy)
docker-compose -f docker-compose.prebuilt.yml up -d

# Wait for MySQL to initialize (first time only)
sleep 15

# Run database migrations
docker-compose -f docker-compose.prebuilt.yml run --rm backend npx prisma migrate deploy

# Verify services are running
docker-compose -f docker-compose.prebuilt.yml ps
```

### 5. Check Logs
```bash
# View all logs
docker-compose -f docker-compose.prebuilt.yml logs -f

# View specific service
docker-compose -f docker-compose.prebuilt.yml logs -f backend
docker-compose -f docker-compose.prebuilt.yml logs -f frontend
docker-compose -f docker-compose.prebuilt.yml logs -f mysql
```

---

## 🔄 Quick Update Workflow

When you make changes:

### On Windows:
```powershell
# 1. Make your code changes
# 2. Build and push
docker build -t hammadhafeez1100/tabeeb-backend:latest TabeebBackend\tabeeb_backend
docker push hammadhafeez1100/tabeeb-backend:latest

# 3. Push to GitHub
git add .
git commit -m "Update description"
git push
```

### On Oracle:
```bash
# 1. Pull code (for .env or config changes)
git pull

# 2. Pull and restart with new images
docker-compose -f docker-compose.prebuilt.yml pull
docker-compose -f docker-compose.prebuilt.yml up -d

# 3. Run migrations if schema changed
docker-compose -f docker-compose.prebuilt.yml run --rm backend npx prisma migrate deploy
```

---

## 🗄️ Database Management

### First Time Setup
The MySQL container will automatically:
- Create database `tabeeb_db`
- Create user `tabeeb_user`
- Initialize on first run

### Access MySQL
```bash
# From Oracle VM
docker exec -it tabeeb_mysql mysql -u tabeeb_user -p
# Password: Moeez4316$

# Show databases
SHOW DATABASES;
USE tabeeb_db;
SHOW TABLES;
```

### Backup Database
```bash
# Export
docker exec tabeeb_mysql mysqldump -u tabeeb_user -p'Moeez4316$' tabeeb_db > backup.sql

# Import
docker exec -i tabeeb_mysql mysql -u tabeeb_user -p'Moeez4316$' tabeeb_db < backup.sql
```

### Reset Database
```bash
# Stop all services
docker-compose -f docker-compose.prebuilt.yml down

# Remove database volume
docker volume rm tabeeb-healthcare_mysql_data

# Start fresh
docker-compose -f docker-compose.prebuilt.yml up -d
sleep 15
docker-compose -f docker-compose.prebuilt.yml run --rm backend npx prisma migrate deploy
```

---

## 🐛 Troubleshooting

### Images Not Updating
```bash
# Force pull without cache
docker-compose -f docker-compose.prebuilt.yml pull --no-cache
docker-compose -f docker-compose.prebuilt.yml up -d --force-recreate
```

### Out of Memory
```bash
# Check memory
free -h

# Add swap if not exists
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstag
```

### MySQL Won't Start
```bash
# Check logs
docker logs tabeeb_mysql

# Reset MySQL data
docker-compose -f docker-compose.prebuilt.yml down
docker volume rm tabeeb-healthcare_mysql_data
docker-compose -f docker-compose.prebuilt.yml up -d mysql
```

### Backend Can't Connect to MySQL
```bash
# Verify backend can reach mysql
docker-compose -f docker-compose.prebuilt.yml exec backend ping mysql

# Check DATABASE_URL env var
docker-compose -f docker-compose.prebuilt.yml exec backend printenv DATABASE_URL
```

---

## 📊 Resource Usage

**Container Limits (Oracle 1GB RAM):**
- MySQL: 512MB
- Backend: 768MB
- Frontend: 768MB
- Caddy: 192MB

**With 2GB swap, this works smoothly!**

---

## ✅ Health Checks

```bash
# Backend health
curl http://localhost:5002/api/health

# Frontend
curl http://localhost:3000

# All services status
docker-compose -f docker-compose.prebuilt.yml ps

# Resource usage
docker stats
```

---

## 🔐 Security Notes

1. **Change default passwords** in `.env` for production
2. **Use HTTPS** with Caddy for domain access
3. **Keep images updated** regularly
4. **Backup database** before major changes

---

## 📝 Files Involved

- `docker-compose.prebuilt.yml` - Prebuilt image configuration
- `build-and-push.sh` - Build script for Windows
- `deploy-prebuilt.sh` - Deploy script for Oracle
- `.env` - Environment configuration

---

## 💡 Pro Tips

1. **Tag your images** for version control:
   ```bash
   docker tag hammadhafeez1100/tabeeb-backend:latest hammadhafeez1100/tabeeb-backend:v1.2.0
   docker push hammadhafeez1100/tabeeb-backend:v1.2.0
   ```

2. **Use .dockerignore** to speed up builds (already configured)

3. **Monitor logs** regularly for issues

4. **Regular backups** of MySQL data volume
