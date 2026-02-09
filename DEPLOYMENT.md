# TABEEB Healthcare - Docker Deployment Guide

## Deploying to Oracle Cloud Free Tier

This guide will help you deploy the TABEEB Healthcare application to your Oracle Cloud instance using Docker and Caddy for automatic SSL.

## Architecture

The deployment consists of 4 Docker containers:
- **MySQL** - Database (persistent volume)
- **Backend** - Express.js API with Prisma ORM (Port 5002)
- **Frontend** - Next.js application (Port 3000)
- **Caddy** - Reverse proxy with automatic HTTPS (Ports 80, 443)

## Prerequisites

1. Oracle Cloud Free Tier instance (Ubuntu/OracleLinux)
2. Domain `tabeeb.dpdns.org` pointing to your instance's public IP
3. SSH access to your instance
4. Git installed on your instance

## Step 1: Configure Oracle Cloud Security Rules

In your Oracle Cloud Console:

1. Navigate to: **Networking → Virtual Cloud Networks → Your VCN → Security Lists**
2. Add the following **Ingress Rules**:

| Source CIDR | Protocol | Destination Port | Description |
|-------------|----------|------------------|-------------|
| 0.0.0.0/0   | TCP      | 80               | HTTP        |
| 0.0.0.0/0   | TCP      | 443              | HTTPS       |
| 0.0.0.0/0   | TCP      | 22               | SSH (should exist) |

## Step 2: Setup Oracle Instance

SSH into your Oracle instance:

```bash
ssh opc@<your-instance-public-ip>
```

Or if using Ubuntu:

```bash
ssh ubuntu@<your-instance-public-ip>
```

### Install Docker and Docker Compose

**For Oracle Linux:**
```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**For Ubuntu:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose-plugin
```

Verify installation:
```bash
docker --version
docker compose version
```

### Configure Firewall

**Oracle Linux:**
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**Ubuntu:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## Step 3: Clone and Configure Application

```bash
# Clone your repository
cd ~
git clone <your-repo-url> tabeeb
cd tabeeb

# Or if using SSH
# git clone git@github.com:yourusername/tabeeb.git
# cd tabeeb
```

### Create Environment File

Copy the example environment file and configure it:

```bash
cp .env.example .env
nano .env
```

**Required Configuration:**

1. **Generate strong passwords:**
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate MySQL passwords
openssl rand -base64 24
```

2. **Update `.env` file with:**
   - MySQL passwords (strong, random)
   - JWT secret (generated above)
   - Firebase credentials (from Firebase Console)
   - Cloudinary credentials (from Cloudinary Dashboard)

**Example `.env`:**
```env
# Database
MYSQL_ROOT_PASSWORD=YOUR_STRONG_ROOT_PASSWORD_HERE
MYSQL_DATABASE=tabeeb
MYSQL_USER=tabeeb_user
MYSQL_PASSWORD=YOUR_STRONG_USER_PASSWORD_HERE

# JWT Secret
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE

# Firebase Admin SDK (from Firebase Console → Project Settings → Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nMultiline\nKey\nHere\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Firebase Client (from Firebase Console → Project Settings → General)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Cloudinary (from Cloudinary Dashboard)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important Notes:**
- Never commit `.env` to version control
- Use strong, unique passwords in production
- Keep Firebase private key secure

## Step 4: Update Caddyfile (if needed)

If your domain is different, update the `Caddyfile`:

```bash
nano Caddyfile
```

Replace `tabeeb.dpdns.org` with your actual domain.

## Step 5: Build and Deploy

Build and start all containers:

```bash
# Build images (first time or after code changes)
docker compose build

# Start all services in detached mode
docker compose up -d

# View logs
docker compose logs -f
```

Wait for all services to start (this may take 2-3 minutes on first run).

## Step 6: Run Database Migrations

After the backend container is running:

```bash
# Run Prisma migrations
docker compose exec backend npx prisma migrate deploy

# Verify database schema
docker compose exec backend npx prisma db pull
```

## Step 7: Verify Deployment

### Check Container Status
```bash
docker compose ps
```

All services should show "Up" status.

### Check Logs
```bash
# All services
docker compose logs

# Specific service
docker compose logs backend
docker compose logs frontend
docker compose logs caddy
docker compose logs mysql

# Follow logs in real-time
docker compose logs -f backend
```

### Test Services

1. **Frontend:** Visit https://tabeeb.dpdns.org
2. **Backend Health:** `curl https://tabeeb.dpdns.org/api/health`
3. **SSL Certificate:** Check browser padlock icon

### Verify SSL Certificate

Caddy should automatically obtain SSL certificate from Let's Encrypt. Check Caddy logs:

```bash
docker compose logs caddy | grep -i "certificate"
```

You should see: "certificate obtained successfully"

## Step 8: Setup Auto-restart on Reboot

Ensure containers start automatically after instance reboot:

```bash
# Edit docker-compose.yml restart policies (already set to "unless-stopped")
# OR enable Docker to start on boot
sudo systemctl enable docker
```

## Common Commands

```bash
# View running containers
docker compose ps

# Stop all services
docker compose stop

# Start all services
docker compose start

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend

# View logs
docker compose logs -f

# Rebuild after code changes
git pull
docker compose build
docker compose up -d

# Access backend shell
docker compose exec backend sh

# Access MySQL shell
docker compose exec mysql mysql -u tabeeb_user -p

# Run Prisma Studio (database GUI)
docker compose exec backend npx prisma studio

# Clean up everything (WARNING: Deletes data)
docker compose down -v
```

## Updating the Application

```bash
cd ~/tabeeb

# Pull latest code
git pull

# Rebuild and restart
docker compose build
docker compose up -d

# Run new migrations if any
docker compose exec backend npx prisma migrate deploy

# Check logs
docker compose logs -f backend
```

## Backup and Restore Database

### Backup
```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} tabeeb > ~/backups/tabeeb_$(date +%Y%m%d_%H%M%S).sql

# Or using docker volume backup
docker compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} tabeeb | gzip > ~/backups/tabeeb_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore
```bash
# Stop backend
docker compose stop backend

# Restore database
docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} tabeeb < ~/backups/tabeeb_backup.sql

# Or from compressed
gunzip < ~/backups/tabeeb_backup.sql.gz | docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} tabeeb

# Start backend
docker compose start backend
```

## Monitoring

### Check Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

### Performance Tuning

For Oracle Cloud Free Tier (1GB RAM):

1. **Limit MySQL memory** - Add to `docker-compose.yml`:
```yaml
mysql:
  command: --max_connections=50 --innodb_buffer_pool_size=128M
```

2. **Monitor memory usage:**
```bash
free -h
docker stats --no-stream
```

## Troubleshooting

### Containers Not Starting
```bash
# Check logs for errors
docker compose logs

# Check specific service
docker compose logs backend

# Restart services
docker compose restart
```

### "Port already in use" Error
```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop httpd  # or nginx, apache2
```

### Database Connection Issues
```bash
# Check MySQL is running
docker compose exec mysql mysqladmin ping -u root -p

# Verify DATABASE_URL in .env
docker compose exec backend printenv DATABASE_URL

# Test connection
docker compose exec backend npx prisma db pull
```

### SSL Certificate Issues
```bash
# Check Caddy logs
docker compose logs caddy

# Verify domain points to your IP
nslookup tabeeb.dpdns.org

# Restart Caddy
docker compose restart caddy
```

### Out of Memory
```bash
# Check available memory
free -h

# Stop non-essential services
docker compose stop mysql
docker compose start mysql

# Reduce MySQL memory usage (edit docker-compose.yml)
```

## Security Best Practices

1. **Change default passwords** - Use strong, unique passwords
2. **Keep system updated:**
```bash
sudo yum update -y  # Oracle Linux
sudo apt update && sudo apt upgrade -y  # Ubuntu
```
3. **Enable automatic security updates**
4. **Regular backups** - Automate daily database backups
5. **Monitor logs** - Check for suspicious activity
6. **Firewall rules** - Only open required ports
7. **Keep Docker updated:**
```bash
sudo yum update docker-ce  # Oracle Linux
sudo apt update docker-ce  # Ubuntu
```

## Cost Optimization (Oracle Free Tier)

1. **Use volumes sparingly** - Free tier has 200GB block storage
2. **Monitor bandwidth** - Free tier includes 10TB/month
3. **Clean up unused images:**
```bash
docker image prune -a
docker volume prune
```

## Getting Help

If issues persist:

1. Check logs: `docker compose logs -f`
2. Verify environment variables: `docker compose config`
3. Test individual services: `docker compose up backend` (without -d)
4. Check Oracle Cloud firewall and security lists
5. Verify DNS: `dig tabeeb.dpdns.org`

## Next Steps

- Setup automated backups (cron job)
- Configure monitoring (Prometheus + Grafana)
- Setup CI/CD pipeline (GitHub Actions)
- Add application-level logging (Winston, Pino)
- Configure rate limiting in Caddy
- Add WAF (Web Application Firewall)

---

**Deployment Checklist:**

- [ ] Oracle Cloud security rules configured (80, 443)
- [ ] Instance firewall configured
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] `.env` file created and configured
- [ ] Strong passwords generated
- [ ] Firebase credentials added
- [ ] Cloudinary credentials added
- [ ] Domain DNS pointing to instance IP
- [ ] `docker compose up -d` executed successfully
- [ ] Database migrations run
- [ ] SSL certificate obtained (check Caddy logs)
- [ ] Frontend accessible at https://tabeeb.dpdns.org
- [ ] Backend API responding
- [ ] Database backups scheduled

---

**Need help?** Check the troubleshooting section or review the logs.
