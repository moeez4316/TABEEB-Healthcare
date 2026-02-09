# 🚀 Oracle Cloud 1GB RAM - Quick Deploy Guide

## ⚡ Optimizations Applied

✅ **Build Cache Mounts** - npm packages cached between builds (saves 15+ mins)
✅ **Memory Limits** - Backend: 768MB, Frontend: 768MB, Caddy: 192MB  
✅ **No Dev Dependencies** - Production builds only install what's needed
✅ **Separate Migration** - Migrations run in isolated container
✅ **BuildKit Enabled** - Faster, more efficient Docker builds
✅ **No startup migrations** - Backend starts immediately

---

## 📋 Prerequisites on Oracle Instance

```bash
# 1. Add swap (CRITICAL for 1GB RAM!)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap
free -h

# 2. Enable BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
echo "export DOCKER_BUILDKIT=1" >> ~/.bashrc
echo "export COMPOSE_DOCKER_CLI_BUILD=1" >> ~/.bashrc
```

---

## 🔥 Deployment Options

### Option 1: Automated Script (Recommended)
```bash
# Upload deploy-oracle.sh to your instance, then:
chmod +x deploy-oracle.sh
sudo bash deploy-oracle.sh
```

### Option 2: Manual Step-by-Step
```bash
# Clean up
docker-compose down
docker system prune -f

# Build backend (5-8 mins)
docker-compose build backend

# Build frontend (5-10 mins)  
docker-compose build frontend

# Run migrations ONCE
docker-compose run --rm migrate

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

---

## 🐌 Why npm ci Takes 20+ Minutes on Oracle?

**Root Causes:**
1. **Limited CPU** - 1 vCore is slow for building
2. **Network Throttling** - Free tier has bandwidth limits
3. **861 packages** - Your Next.js app has many dependencies
4. **No build cache** - Downloads everything from scratch

**Our Fixes:**
- ✅ Cache mount (`--mount=type=cache,target=/root/.npm`)
- ✅ `--prefer-offline` flag  
- ✅ `--no-audit` and `--progress=false` to skip overhead
- ✅ `--omit=dev` to skip devDependencies in production
- ✅ Swap space to prevent OOM during build

**Expected Times:**
- Backend build: 5-8 minutes
- Frontend build: 8-12 minutes (first time), 3-5 minutes (with cache)

---

## 📦 If Build Interrupted

```bash
# Resume with cache (continues from last successful layer)
docker-compose build frontend

# If corrupted, clean and rebuild
docker-compose build --no-cache frontend

# Out of disk space?
docker system df
docker system prune -af
df -h
```

---

## 🗄️ Database Migrations

### Run migrations manually in container:
```bash
# One-time migration run
docker-compose run --rm migrate

# Or manually inside backend container
docker-compose exec backend npx prisma migrate deploy

# Push schema without migrations (dev only!)
docker-compose exec backend npx prisma db push
```

### Check migration status:
```bash
docker-compose exec backend npx prisma migrate status
```

---

## 🔍 Troubleshooting

### Build still taking forever?
```bash
# Check if swap is being used
free -h
# If swap is 0B used, Docker might not be using it

# Ensure BuildKit is enabled
docker version | grep "BuildKit"

# Build with verbose output
docker-compose build frontend --progress=plain 2>&1 | tee build.log
```

### Out of Memory during build?
```bash
# Check memory usage
free -h
docker stats --no-stream

# Increase swap
sudo swapoff /swapfile
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Services crash after starting?
```bash
# Check logs
docker-compose logs backend | tail -50
docker-compose logs frontend | tail -50

# Check if OOM killed them
dmesg | grep -i "out of memory"
journalctl -u docker | grep -i "oom"

# Restart individual service
docker-compose restart backend
```

### Container keeps restarting?
```bash
# Disable restart temporarily to see errors
docker-compose stop backend
docker-compose run --rm backend

# Check healthcheck
docker inspect tabeeb_backend | grep -A 10 Health
```

---

## 📊 Monitoring

```bash
# Real-time resource usage
docker stats

# Service status
docker-compose ps

# Logs (all services)
docker-compose logs -f

# Logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend

# System resources
htop
free -h
df -h
```

---

## 🔧 Resource Tuning

If you need to reduce memory further, edit [docker-compose.yml](docker-compose.yml):

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '0.6'
        memory: 512M  # Reduce from 768M

frontend:
  deploy:
    resources:
      limits:
        cpus: '0.6'
        memory: 512M  # Reduce from 768M
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

---

## 🚨 Emergency Recovery

```bash
# Nuclear option - complete reset
docker-compose down -v
docker system prune -af
docker volume prune -f

# Rebuild everything
docker-compose build --no-cache
docker-compose up -d
```

---

## ✨ After Deployment

```bash
# Test backend
curl http://localhost:5002/api/health

# Test frontend
curl http://localhost:3000

# Check Caddy SSL
curl https://your-domain.com

# View all running containers
docker ps

# Check if services are healthy
docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
```

---

## 🎯 Performance Tips

1. **Build locally, push to registry** (future optimization)
   - Build on powerful machine
   - Push to Docker Hub
   - Pull on Oracle instance (much faster!)

2. **Use pre-built base images**
   - Cache your Prisma-generated client
   - Version your builds

3. **Schedule builds during off-peak**
   - Oracle network is faster at certain times
   - Use `nice` command to lower build priority

4. **Monitor network throttling**
   ```bash
   # Check bandwidth usage
   vnstat -i eth0
   ```

---

## 📞 Common Issues

| Issue | Solution |
|-------|----------|
| `npm ci` stuck at specific package | Wait 5 mins, Oracle network might be throttled |
| Build fails with exit code 137 | Out of memory - increase swap or reduce limits |
| Services won't start | Check: `docker-compose logs`, memory usage, disk space |
| Database connection timeout | Verify `DATABASE_URL` in `.env`, check firewall |
| Caddy not getting SSL | Check DNS, ensure ports 80/443 open in Oracle security lists |

---

## 📚 Useful Commands Reference

```bash
# View environment variables
docker-compose config

# Rebuild single service
docker-compose build backend --no-cache

# Restart single service
docker-compose restart frontend

# Run command in container
docker-compose exec backend sh

# View container IP addresses
docker-compose exec backend hostname -i

# Check Docker disk usage
docker system df

# Backup volumes
docker run --rm -v tabeeb-healthcare_caddy_data:/data -v $(pwd):/backup alpine tar czf /backup/caddy-backup.tar.gz /data

# Clean build cache
docker builder prune -af
```
