#!/bin/bash
# Local Docker Testing - Start Script
# Run this to test everything locally before deploying

set -e

export NEXT_PUBLIC_API_URL="http://localhost:5002"
export FRONTEND_URL="http://localhost:3000"
export SITE_ADDRESS="localhost"

echo "🐳 Starting TABEEB Healthcare Locally"
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your credentials before continuing."
    exit 1
fi

echo "✅ .env file found"

# Stop any running containers
echo ""
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Start services
echo ""
echo "🚀 Starting all services..."
docker-compose up -d --force-recreate

# Wait for MySQL to be ready
echo ""
echo "⏳ Waiting for MySQL to initialize (this may take 30 seconds)..."
sleep 30

# Check MySQL health
echo ""
echo "🔍 Checking MySQL status..."
until docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p'Moeez4316$' --silent 2>/dev/null; do
    echo "   MySQL is still starting..."
    sleep 5
done
echo "✅ MySQL is ready!"

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
docker-compose run --rm migrate || {
    echo "⚠️  Migrations may have already run or schema is in sync"
}

# Show service status
echo ""
echo "📊 Service Status:"
docker-compose ps

# Test backend
echo ""
echo "🧪 Testing backend..."
sleep 5
if curl -s http://localhost:5002/api/health > /dev/null; then
    echo "✅ Backend is responding!"
else
    echo "⚠️  Backend might still be starting..."
fi

# Show logs
echo ""
echo "📋 Recent logs (Ctrl+C to stop viewing):"
echo "----------------------------------------"
docker-compose logs --tail=20

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5002/api"
echo "   Health:    http://localhost:5002/api/health"
echo ""
echo "📊 View logs:        docker-compose logs -f"
echo "🛑 Stop services:    docker-compose down"
echo "🔄 Restart service:  docker-compose restart backend"
echo ""
