#!/bin/bash
# Quick deploy with pre-built images from Docker Hub
# Takes ~2 minutes on Oracle (just pulls images)

set -e

if [ -z "$SITE_ADDRESS" ] && [ -f ./.env ]; then
    SITE_ADDRESS=$(grep -E "^SITE_ADDRESS=" ./.env | head -n1 | cut -d= -f2- | sed 's/^"//;s/"$//')
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

cert_dir="./nginx/certbot/conf/live/${SITE_ADDRESS}"
if [ ! -f "$cert_dir/fullchain.pem" ]; then
    echo "❌ Missing TLS certificates for $SITE_ADDRESS."
    echo "   Run: ./nginx/init-letsencrypt.sh docker-compose.prebuilt.yml"
    exit 1
fi

# Step 6: Start all services
echo "🚀 Starting all services..."
docker compose -f docker-compose.prebuilt.yml up -d

# Step 7: Show status
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













