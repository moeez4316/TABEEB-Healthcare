#!/bin/bash
# Oracle Cloud Deployment Script for 1GB RAM Instance
# Run this on your Oracle Cloud instance

set -e

echo "🚀 Tabeeb Healthcare - Oracle Cloud Deployment (1GB RAM Optimized)"
echo "=================================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Warning: Not running as root. Some operations may fail."
    echo "   Consider running: sudo bash deploy-oracle.sh"
fi

# Step 1: Add swap space (critical for 1GB RAM)
echo ""
echo "📊 Step 1: Setting up swap space..."
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap enabled"
else
    echo "✅ Swap already configured"
fi
free -h

# Step 2: Enable Docker BuildKit
echo ""
echo "🔧 Step 2: Enabling Docker BuildKit..."
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
echo "export DOCKER_BUILDKIT=1" >> ~/.bashrc
echo "export COMPOSE_DOCKER_CLI_BUILD=1" >> ~/.bashrc
echo "✅ BuildKit enabled"

# Step 3: Stop old containers (but keep build cache!)
echo ""
echo "🧹 Step 3: Stopping old containers..."
docker compose down 2>/dev/null || true
# Note: NOT running 'docker system prune' to preserve build cache
echo "✅ Old containers stopped (build cache preserved)"

# Step 4: Build backend (smaller, build first)
echo ""
echo "🏗️  Step 4: Building backend..."
docker compose build backend --progress=plain
echo "✅ Backend built"

# Step 5: Build frontend (larger, build separately to avoid OOM)
echo ""
echo "🏗️  Step 5: Building frontend (this will take 5-10 minutes)..."
docker compose build frontend --progress=plain
echo "✅ Frontend built"

# Step 6: Run database migrations
echo ""
echo "🗄️  Step 6: Running database migrations..."
docker compose run --rm migrate || echo "⚠️  Migration failed, but continuing..."
echo "✅ Migrations attempted"

# Step 7: Start services
echo ""
echo "🚀 Step 7: Starting all services..."
docker compose up -d
echo "✅ Services started"

# Step 8: Show status
echo ""
echo "📊 Step 8: Checking service status..."
sleep 5
docker compose ps
echo ""
docker stats --no-stream

echo ""
echo "=================================================================="
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Check logs: docker compose logs -f"
echo "  2. Monitor resources: docker stats"
echo "  3. Test backend: curl http://localhost:5002/api/health"
echo "  4. Test frontend: curl http://localhost:3000"
echo ""
echo "⚠️  If services crash due to OOM:"
echo "  - Restart individual services: docker compose restart backend"
echo "  - Check swap: free -h"
echo "  - Reduce resource limits in docker-compose.yml"
echo "=================================================================="
