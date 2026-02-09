#!/bin/bash
# Build locally and push to Docker Hub
# Run this on your local machine (much faster than Oracle)

set -e

echo "🔑 Login to Docker Hub..."
docker login

echo "🏗️  Building backend (2-3 mins on local machine)..."
cd TabeebBackend/tabeeb_backend
docker build -t hammadhafeez1100/tabeeb-backend:latest .
docker push hammadhafeez1100/tabeeb-backend:latest
cd ../..

echo "🏗️  Building frontend (3-5 mins on local machine)..."
cd TabeebFrontend
docker build -t hammadhafeez1100/tabeeb-frontend:latest .
docker push hammadhafeez1100/tabeeb-frontend:latest
cd ..

echo "✅ Images pushed to Docker Hub!"
echo ""
echo "On Oracle instance, run:"
echo "  git pull"
echo "  docker-compose -f docker-compose.prebuilt.yml up -d"
