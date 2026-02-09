# 🐳 Local Docker Testing Guide

Test your entire application stack locally on Windows before deploying to Oracle.

---

## 🎯 What You'll Run Locally

- **MySQL 8.0** - Database container
- **Backend API** - Node.js/Express/Prisma
- **Frontend** - Next.js application
- **Caddy** - Reverse proxy (optional for local)

---

## ⚙️ Prerequisites

1. **Docker Desktop** installed and running on Windows
2. **Git Bash** or **PowerShell** for commands
3. **.env** file configured (already set up for localhost)

---

## 🚀 Quick Start

### Option 1: Simple Start (Build from source)

```bash
# Open PowerShell or Git Bash in project root
cd c:\Users\hamma\OneDrive\Desktop\FYP\TABEEB-Healthcare

# Start all services (MySQL + Backend + Frontend + Caddy)
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 2: With Database Migrations

```bash
# Start all services
docker-compose up -d

# Wait for MySQL to initialize (first time only)
Start-Sleep -Seconds 15

# Run database migrations
docker-compose run --rm migrate

# View service status
docker-compose ps
```

---

## 📋 Step-by-Step Guide

### 1. Start Services

```powershell
# Navigate to project
cd c:\Users\hamma\OneDrive\Desktop\FYP\TABEEB-Healthcare

# Pull MySQL image (first time only)
docker pull mysql:8.0

# Start all containers
docker-compose up -d

# Check if all services are running
docker-compose ps
```

**Expected output:**
```
NAME                STATUS          PORTS
tabeeb_mysql        Up (healthy)    0.0.0.0:3306->3306/tcp
tabeeb_backend      Up              0.0.0.0:5002->5002/tcp
tabeeb_frontend     Up              0.0.0.0:3000->3000/tcp
tabeeb_caddy        Up              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 2. Initialize Database

```powershell
# Wait for MySQL to be ready
Start-Sleep -Seconds 15

# Run Prisma migrations
docker-compose run --rm migrate

# Or manually:
# docker-compose exec backend npx prisma migrate deploy
```

### 3. Verify Services

```powershell
# Test backend health
curl http://localhost:5002/api/health

# Test frontend
curl http://localhost:3000

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### 4. Access Your Application

Open your browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5002/api
- **Backend Health**: http://localhost:5002/api/health

---

## 🔧 Development Workflow

### Making Code Changes

```powershell
# After changing backend code:
docker-compose restart backend

# After changing frontend code:
docker-compose restart frontend

# If you change dependencies or Dockerfile:
docker-compose up -d --build
```

### Viewing Logs

```powershell
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Stopping Services

```powershell
# Stop all services (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop, remove containers AND data volumes
docker-compose down -v
```

---

## 🗄️ Database Management

### Access MySQL

```powershell
# Connect to MySQL
docker exec -it tabeeb_mysql mysql -u tabeeb_user -p
# Password: Moeez4316$
```

**Inside MySQL:**
```sql
SHOW DATABASES;
USE tabeeb_db;
SHOW TABLES;
SELECT * FROM User LIMIT 5;
```

### Backup Database

```powershell
# Export database
docker exec tabeeb_mysql mysqldump -u tabeeb_user -p'Moeez4316$' tabeeb_db > backup.sql

# Import database
Get-Content backup.sql | docker exec -i tabeeb_mysql mysql -u tabeeb_user -p'Moeez4316$' tabeeb_db
```

### Reset Database

```powershell
# Stop all services
docker-compose down

# Remove database volume (DELETES ALL DATA!)
docker volume rm tabeeb-healthcare_mysql_data

# Start fresh
docker-compose up -d
Start-Sleep -Seconds 15
docker-compose run --rm migrate
```

### Run Prisma Studio (Database GUI)

```powershell
# Access Prisma Studio at http://localhost:5555
docker-compose exec backend npx prisma studio
```

---

## 🧪 Testing Checklist

- [ ] MySQL container starts and is healthy
- [ ] Backend connects to MySQL successfully
- [ ] Backend API health check returns OK
- [ ] Frontend loads at localhost:3000
- [ ] Can register a new patient account
- [ ] Can register a new doctor account
- [ ] Can upload profile picture
- [ ] Can create appointment
- [ ] Firebase authentication works
- [ ] Cloudinary image upload works

---

## 🐛 Troubleshooting

### Port Already in Use

```powershell
# Check what's using port 3306 (MySQL)
netstat -ano | findstr :3306

# Check what's using port 5002 (Backend)
netstat -ano | findstr :5002

# Check what's using port 3000 (Frontend)
netstat -ano | findstr :3000

# Kill process by PID (replace 1234 with actual PID)
taskkill /PID 1234 /F
```

### Backend Can't Connect to MySQL

```powershell
# Check if MySQL is healthy
docker-compose ps

# Check MySQL logs
docker-compose logs mysql

# Restart both services
docker-compose restart mysql backend
```

### Frontend Can't Connect to Backend

```powershell
# Verify backend is running
curl http://localhost:5002/api/health

# Check .env has correct API URL
# Should be: NEXT_PUBLIC_API_URL=http://localhost:5002/api

# Rebuild frontend with new env
docker-compose up -d --build frontend
```

### Container Build Fails

```powershell
# Clean Docker build cache
docker builder prune -f

# Remove old images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Out of Memory / Slow Performance

```powershell
# Check Docker Desktop resource allocation:
# Settings → Resources → Advanced
# Recommended: 4GB RAM minimum, 2 CPUs

# Check container resource usage
docker stats

# Restart Docker Desktop
```

### Database Migrations Fail

```powershell
# Check backend logs
docker-compose logs backend

# Run migrations manually
docker-compose exec backend npx prisma migrate deploy

# If schema is out of sync:
docker-compose exec backend npx prisma db push

# Generate Prisma client
docker-compose exec backend npx prisma generate
```

---

## 📊 Resource Monitoring

```powershell
# Real-time resource usage
docker stats

# Container details
docker-compose ps -a

# Disk usage
docker system df

# Clean up unused resources
docker system prune -f
```

---

## 🔄 After Testing Locally

Once everything works locally, you're ready to deploy to Oracle:

### 1. Update .env for Production

```env
# Change API URL to your domain
NEXT_PUBLIC_API_URL=https://tabeeb.dpdns.org/api
```

### 2. Build and Push Images

```powershell
cd TabeebBackend\tabeeb_backend
docker build -t hammadhafeez1100/tabeeb-backend:latest .
docker push hammadhafeez1100/tabeeb-backend:latest

cd ..\..\TabeebFrontend
docker build -t hammadhafeez1100/tabeeb-frontend:latest .
docker push hammadhafeez1100/tabeeb-frontend:latest
```

### 3. Deploy on Oracle

```bash
# On Oracle VM
git pull
docker-compose -f docker-compose.prebuilt.yml pull
docker-compose -f docker-compose.prebuilt.yml up -d
```

---

## 📝 Useful Commands Reference

```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Rebuild a service
docker-compose up -d --build backend

# Run migrations
docker-compose run --rm migrate

# Access backend shell
docker-compose exec backend sh

# Access database
docker exec -it tabeeb_mysql mysql -u tabeeb_user -p

# Clean everything
docker-compose down -v
docker system prune -af

# Check service status
docker-compose ps

# View resource usage
docker stats
```

---

## ✅ Success Indicators

Your local setup is working when:

1. ✅ All 4 containers show "Up" status
2. ✅ MySQL shows "healthy" status
3. ✅ Backend health check returns: `{"status":"ok"}`
4. ✅ Frontend loads at http://localhost:3000
5. ✅ You can register and login users
6. ✅ No error logs in `docker-compose logs`

---

## 🎓 Next Steps

After successful local testing:

1. Test all major features
2. Check database tables are created
3. Upload some test images (profile pictures)
4. Create test appointments
5. Test video call functionality
6. Build and push images to Docker Hub
7. Deploy to Oracle Cloud

See [PREBUILT-WORKFLOW.md](PREBUILT-WORKFLOW.md) for deployment guide.
