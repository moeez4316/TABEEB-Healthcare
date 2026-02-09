# Docker Deployment Files for TABEEB Healthcare

This directory contains Docker configuration files for deploying the TABEEB Healthcare application to Oracle Cloud.

## Files Overview

### Docker Configuration
- **`docker-compose.yml`** - Orchestrates all services (MySQL, Backend, Frontend, Caddy)
- **`Caddyfile`** - Caddy reverse proxy configuration with automatic SSL
- **`TabeebBackend/tabeeb_backend/Dockerfile`** - Backend API containerization
- **`TabeebFrontend/Dockerfile`** - Frontend Next.js containerization

### Environment Configuration
- **`.env.example`** - Template for environment variables (root level)
- **`TabeebBackend/tabeeb_backend/.env.example`** - Backend-specific environment template
- **`TabeebFrontend/.env.example`** - Frontend-specific environment template
- **`.env`** - Your actual environment file (NOT committed to Git)

### Documentation
- **`DEPLOYMENT.md`** - Complete deployment guide with troubleshooting
- **`QUICKSTART.md`** - Quick reference for common deployment commands

## Architecture

```
┌─────────────────────────────────────────────┐
│         Internet (Port 80/443)              │
└─────────────────┬───────────────────────────┘
                  │
          ┌───────▼────────┐
          │  Caddy Proxy   │ (Automatic SSL)
          │  Port 80/443   │
          └────────┬───────┘
                   │
        ┌──────────┼──────────┐
        │                     │
   ┌────▼─────┐        ┌─────▼────┐
   │ Frontend │        │ Backend  │
   │ Next.js  │────────│ Express  │
   │ Port 3000│        │ Port 5002│
   └──────────┘        └─────┬────┘
                             │
                       ┌─────▼─────┐
                       │   MySQL   │
                       │ Port 3306 │
                       └───────────┘
```

## Services

1. **MySQL** (mysql:8.0)
   - Database server
   - Port: 3306 (internal)
   - Volume: `mysql_data` (persistent)

2. **Backend** (Node.js + Express + Prisma)
   - REST API server
   - Port: 5002 (internal)
   - Auto-runs migrations on start

3. **Frontend** (Next.js 15)
   - React application
   - Port: 3000 (internal)
   - Standalone build for Docker

4. **Caddy** (Reverse Proxy)
   - Automatic HTTPS via Let's Encrypt
   - Ports: 80, 443 (public)
   - Routes traffic to frontend/backend

## Quick Deployment

1. **Clone repository and configure:**
   ```bash
   git clone <repo-url> tabeeb && cd tabeeb
   cp .env.example .env
   nano .env  # Add your credentials
   ```

2. **Deploy:**
   ```bash
   docker compose up -d
   docker compose exec backend npx prisma migrate deploy
   ```

3. **Verify:**
   ```bash
   docker compose ps
   docker compose logs -f
   ```

4. **Access:**
   - Frontend: https://tabeeb.dpdns.org
   - Backend API: https://tabeeb.dpdns.org/api

## Environment Variables Required

### Critical (Must Configure)
- `MYSQL_ROOT_PASSWORD` - MySQL root password (strong!)
- `MYSQL_PASSWORD` - MySQL user password (strong!)
- `JWT_SECRET` - JWT signing secret (use `openssl rand -base64 32`)
- `FIREBASE_*` - Firebase credentials (from Firebase Console)
- `CLOUDINARY_*` - Cloudinary credentials (from Cloudinary Dashboard)

### Optional
- `MYSQL_DATABASE` - Database name (default: tabeeb)
- `MYSQL_USER` - Database user (default: tabeeb_user)

## Commands Cheat Sheet

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose stop

# Restart services
docker compose restart

# View logs
docker compose logs -f

# Update application
git pull && docker compose build && docker compose up -d

# Run migrations
docker compose exec backend npx prisma migrate deploy

# Backup database
docker compose exec mysql mysqldump -u root -p tabeeb > backup.sql

# Check status
docker compose ps

# Remove everything (WARNING: deletes data)
docker compose down -v
```

## Prerequisites

### Oracle Cloud Instance
- Free tier instance (Ubuntu 20.04+ or Oracle Linux 8+)
- Security rules: Allow ingress on ports 80, 443
- Firewall configured
- Docker installed

### Domain Configuration
- `tabeeb.dpdns.org` pointing to instance public IP
- DNS propagation completed (verify with `nslookup`)

### Credentials Ready
- Firebase project created with credentials
- Cloudinary account with API keys
- Strong passwords generated

## Deployment Checklist

**Before Deployment:**
- [ ] Oracle Cloud security rules configured (ports 80, 443)
- [ ] Instance firewall configured (firewall-cmd or ufw)
- [ ] Docker and Docker Compose installed
- [ ] Domain DNS pointing to instance IP
- [ ] All credentials collected (Firebase, Cloudinary)

**During Deployment:**
- [ ] Repository cloned to instance
- [ ] `.env` file created from `.env.example`
- [ ] Strong passwords generated and added to `.env`
- [ ] Firebase credentials added to `.env`
- [ ] Cloudinary credentials added to `.env`
- [ ] `docker compose build` successful
- [ ] `docker compose up -d` successful
- [ ] All 4 containers running
- [ ] Migrations applied successfully

**After Deployment:**
- [ ] Frontend loads at https://tabeeb.dpdns.org
- [ ] Backend API responds at https://tabeeb.dpdns.org/api
- [ ] SSL certificate obtained (check Caddy logs)
- [ ] No errors in container logs
- [ ] Database accessible
- [ ] User registration works
- [ ] Login works

## Troubleshooting

**Containers not starting:**
- Check logs: `docker compose logs`
- Verify `.env` file exists and is configured
- Check ports aren't in use: `sudo lsof -i :80`

**SSL certificate issues:**
- Verify DNS: `nslookup tabeeb.dpdns.org`
- Check Caddy logs: `docker compose logs caddy`
- Wait 5 minutes for Let's Encrypt validation

**Database connection errors:**
- Verify DATABASE_URL format in `.env`
- Check MySQL is running: `docker compose ps mysql`
- Review MySQL logs: `docker compose logs mysql`

**502 Bad Gateway:**
- Backend may not be ready yet (wait 1-2 minutes)
- Check backend logs: `docker compose logs backend`
- Restart services: `docker compose restart`

## Security Notes

- **Never commit `.env`** - Contains sensitive credentials
- **Use strong passwords** - Generate with `openssl rand -base64 32`
- **Keep Docker updated** - Security patches
- **Regular backups** - Database and volumes
- **Monitor logs** - Check for suspicious activity
- **Firewall configured** - Only ports 80, 443, 22 open

## Maintenance

### Daily
- Check container health: `docker compose ps`
- Monitor disk space: `df -h`

### Weekly
- Review logs: `docker compose logs --tail=100`
- Backup database
- Update system packages

### Monthly
- Pull latest code: `git pull`
- Rebuild containers: `docker compose build`
- Update Docker: `sudo apt update && sudo apt upgrade docker-ce`

## Performance Notes

**Oracle Free Tier (1GB RAM):**
- Suitable for development/testing
- Monitor memory: `docker stats`
- May need swap for compilation
- MySQL memory limited in docker-compose.yml

**Optimization Tips:**
- Enable MySQL query cache
- Use Next.js image optimization
- Enable Caddy caching (add to Caddyfile)
- CDN for static assets (Cloudinary)

## Support

For detailed documentation, see:
- **Full guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Quick reference:** [QUICKSTART.md](./QUICKSTART.md)

For issues:
1. Check logs: `docker compose logs -f`
2. Verify configuration: `docker compose config`
3. Review security groups in Oracle Cloud Console
4. Check DNS propagation: `dig tabeeb.dpdns.org`

---

**Last Updated:** February 2026  
**Docker Compose Version:** 3.8  
**Caddy Version:** 2-alpine  
**MySQL Version:** 8.0  
**Node.js Version:** 20-alpine
