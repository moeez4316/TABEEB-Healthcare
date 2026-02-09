# Local Docker Testing - Start Script (PowerShell)
# Run this to test everything locally before deploying to Oracle

Write-Host "🐳 Starting TABEEB Healthcare Locally" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found. Copying from .env.example..." -ForegroundColor Red
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit .env with your credentials before continuing." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# Stop any running containers
Write-Host ""
Write-Host "🛑 Stopping any existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Start services
Write-Host ""
Write-Host "🚀 Starting all services..." -ForegroundColor Cyan
docker-compose up -d

# Wait for MySQL to be ready
Write-Host ""
Write-Host "⏳ Waiting for MySQL to initialize (this may take 30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check MySQL health
Write-Host ""
Write-Host "🔍 Checking MySQL status..." -ForegroundColor Cyan
$maxRetries = 12
$retryCount = 0
while ($retryCount -lt $maxRetries) {
    try {
        docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p'Moeez4316$' --silent 2>$null | Out-Null
        Write-Host "✅ MySQL is ready!" -ForegroundColor Green
        break
    } catch {
        Write-Host "   MySQL is still starting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        $retryCount++
    }
}

# Run database migrations
Write-Host ""
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
try {
    docker-compose run --rm migrate
} catch {
    Write-Host "⚠️  Migrations may have already run or schema is in sync" -ForegroundColor Yellow
}

# Show service status
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose ps

# Test backend
Write-Host ""
Write-Host "🧪 Testing backend..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5002/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend is responding!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend might still be starting..." -ForegroundColor Yellow
}

# Show logs
Write-Host ""
Write-Host "📋 Recent logs:" -ForegroundColor Cyan
Write-Host "----------------------------------------"
docker-compose logs --tail=20

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access your application:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:   http://localhost:5002/api" -ForegroundColor White
Write-Host "   Health:    http://localhost:5002/api/health" -ForegroundColor White
Write-Host ""
Write-Host "📊 View logs:        docker-compose logs -f" -ForegroundColor Yellow
Write-Host "🛑 Stop services:    docker-compose down" -ForegroundColor Yellow
Write-Host "🔄 Restart service:  docker-compose restart backend" -ForegroundColor Yellow
Write-Host ""
