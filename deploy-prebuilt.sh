#!/bin/bash
# Quick deploy with pre-built images from Docker Hub
# Takes ~2 minutes on Oracle (just pulls images)

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_BIN="$(command -v docker || true)"
if [ -z "$DOCKER_BIN" ]; then
    DOCKER_BIN="/usr/bin/docker"
fi

if [ -z "$SITE_ADDRESS" ] && [ -f "$ROOT_DIR/.env" ]; then
    SITE_ADDRESS=$(grep -E "^SITE_ADDRESS=" "$ROOT_DIR/.env" | head -n1 | cut -d= -f2- | sed 's/^"//;s/"$//')
fi

if [ -z "$SITE_ADDRESS" ]; then
    SITE_ADDRESS="localhost"
fi
echo "🚀 Tabeeb Healthcare - Pre-built Image Deploy"
echo "=============================================="

# Step 1: Setup swap (if needed — only for first run on small VMs)
if [ ! -f /swapfile ]; then
    echo "📊 Creating swap space..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Step 2: Stop old containers
echo "🛑 Stopping old containers..."
docker compose -f docker-compose.prebuilt.yml down 2>/dev/null || true

# Step 3: Pull latest images (fast!)
echo "⬇️  Pulling pre-built images from Docker Hub..."
docker compose -f docker-compose.prebuilt.yml pull

# Step 4: Start Redis first so backend can connect
echo "🟢 Starting Redis..."
docker compose -f docker-compose.prebuilt.yml up -d redis
echo "⏳ Waiting for Redis to be ready..."
sleep 5

# Step 5: Run database migrations
echo "Running database migrations..."
docker compose -f docker-compose.prebuilt.yml run --rm \
  backend npx prisma migrate deploy

cert_dir="$ROOT_DIR/nginx/certbot/conf/live/${SITE_ADDRESS}"
if [ ! -f "$cert_dir/fullchain.pem" ]; then
    echo "❌ Missing TLS certificates for $SITE_ADDRESS."
    echo "   Run: ./nginx/init-letsencrypt.sh docker-compose.prebuilt.yml"
    exit 1
fi

# Step 6: Start all services
echo "🚀 Starting all services..."
docker compose -f docker-compose.prebuilt.yml up -d

# Step 7: Ensure Certbot renewal cron (host)
if [ "$SITE_ADDRESS" != "localhost" ] && [ -f "$cert_dir/fullchain.pem" ]; then
    echo "Setting up Certbot renewal cron..."
    cat > "$ROOT_DIR/nginx/renew-certbot.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail

cd "$ROOT_DIR"

$DOCKER_BIN compose -f docker-compose.prebuilt.yml --profile tools run --rm certbot renew \\
  --webroot -w /var/www/certbot --quiet

$DOCKER_BIN compose -f docker-compose.prebuilt.yml exec -T nginx nginx -s reload
EOF
    chmod +x "$ROOT_DIR/nginx/renew-certbot.sh"

    if command -v crontab >/dev/null 2>&1; then
        cron_line="15 3 * * * $ROOT_DIR/nginx/renew-certbot.sh >> $ROOT_DIR/nginx/renew-certbot.log 2>&1"
        ( crontab -l 2>/dev/null | grep -v 'renew-certbot.sh' ; echo "$cron_line" ) | crontab -
    else
        echo "WARNING: crontab not found; install cron to enable auto-renew."
    fi
fi

# Step 8: Show status
echo ""
echo "✅ Deployment complete!"
docker compose -f docker-compose.prebuilt.yml ps
echo ""
if [ -n "$SITE_ADDRESS" ] && [ "$SITE_ADDRESS" != "localhost" ]; then
    echo "🌐 Your app should be live at: https://$SITE_ADDRESS"
else
    echo "🌐 Your app should be live at: http://localhost"
fi
echo "🔧 Health check: curl http://localhost:5002/api/health"














