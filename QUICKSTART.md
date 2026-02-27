# Quick Start Deployment Script

## Prerequisites
- Oracle Cloud instance with Ubuntu/Oracle Linux
- Domain pointing to instance IP
- SSH access configured

## Step-by-Step Commands

### 1. SSH into your Oracle instance
```bash
ssh opc@<your-instance-ip>
# or
ssh ubuntu@<your-instance-ip>
```

### 2. Install Docker and Docker Compose

**For Oracle Linux:**
```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker

# Configure firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**For Ubuntu:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install Docker Compose plugin
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### 3. Clone Repository
```bash
cd ~
git clone <your-repo-url> tabeeb
cd tabeeb
```

### 4. Configure Environment
```bash
# Copy example file
cp .env.example .env

# Generate secure passwords
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "MYSQL_ROOT_PASSWORD=$(openssl rand -base64 24)"
echo "MYSQL_PASSWORD=$(openssl rand -base64 24)"

# Edit .env file with your credentials
nano .env
```

**Required in `.env`:**
- Replace all passwords with generated ones above
- Add Firebase credentials (Project Settings → Service Accounts)
- Add Cloudinary credentials (Dashboard → API Keys)
- Set `SITE_ADDRESS` and `LETSENCRYPT_EMAIL` for HTTPS

### 5. Deploy Application
```bash
# Build all containers
docker compose build

# Start all services
docker compose up -d

# Wait ~2 minutes for services to initialize
docker compose ps

# Run database migrations
docker compose exec backend npx prisma migrate deploy
```

### 5b. Enable HTTPS with Certbot (manual)
```bash
chmod +x nginx/init-letsencrypt.sh
./nginx/init-letsencrypt.sh
```

If you skip this on first run, Nginx will fail to start because certificates are missing.
If `LETSENCRYPT_EMAIL` is not set, the script will fall back to a self-signed certificate.
Make sure DNS points to your server and port 80 is reachable for the HTTP-01 challenge.
Certbot is manual-only. For renewals:
```bash
docker compose --profile tools run --rm certbot renew --webroot -w /var/www/certbot --dry-run
```
For prebuilt deployments:
```bash
docker compose -f docker-compose.prebuilt.yml --profile tools run --rm certbot renew --webroot -w /var/www/certbot --dry-run
```
If you use `deploy-prebuilt.sh`, run this step first. The script expects certificates to already exist.

### 6. Verify Deployment
```bash
# Check all services are running
docker compose ps

# Check backend logs
docker compose logs backend

# Test frontend (in browser)
# Visit: https://tabeeb.dpdns.org

# Test backend API
curl https://tabeeb.dpdns.org/api/health
```

### 7. Monitor Application
```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f backend

# Check resource usage
docker stats
```

## Common Operations

### Update Application
```bash
cd ~/tabeeb
git pull
docker compose build
docker compose up -d
docker compose exec backend npx prisma migrate deploy
```

### Restart Services
```bash
docker compose restart
# or specific service
docker compose restart backend
```

### Backup Database
```bash
mkdir -p ~/backups
docker compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} tabeeb > ~/backups/tabeeb_$(date +%Y%m%d).sql
```

### View Logs
```bash
# All logs
docker compose logs

# Follow logs
docker compose logs -f

# Specific service
docker compose logs backend
docker compose logs frontend
docker compose logs nginx
docker compose logs mysql
```

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker compose logs

# Restart services
docker compose restart

# Rebuild if code changed
docker compose build
docker compose up -d
```

### Port already in use
```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop httpd
sudo systemctl stop nginx
```

### SSL certificate issues
```bash
# Check DNS is pointing correctly
nslookup tabeeb.dpdns.org

# Run Certbot with verbose logs
docker compose --profile tools run --rm certbot renew --webroot -w /var/www/certbot --dry-run --verbose
```

### Database connection failed
```bash
# Check MySQL is running
docker compose ps mysql

# Check MySQL logs
docker compose logs mysql

# Verify DATABASE_URL in .env
docker compose exec backend printenv | grep DATABASE
```

## Complete Deployment Checklist

- [ ] Oracle Cloud security rules: ports 80, 443 open
- [ ] Docker installed and running
- [ ] Repository cloned
- [ ] `.env` configured with all credentials
- [ ] Strong passwords generated
- [ ] DNS pointing to instance IP
- [ ] `docker compose up -d` successful
- [ ] All 4 containers running (mysql, backend, frontend, nginx)
- [ ] Database migrations applied
- [ ] SSL certificate obtained (check logs)
- [ ] Frontend loads at https://tabeeb.dpdns.org
- [ ] Backend API responds

## Need More Help?

See full documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)


