# Build locally and push to Docker Hub (PowerShell version)
# Run this on your local machine before deploying to Oracle

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TABEEB Healthcare - Build & Push" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Login to Docker Hub
Write-Host "1/4 - Login to Docker Hub..." -ForegroundColor Yellow
docker login
if ($LASTEXITCODE -ne 0) { Write-Host "Docker login failed!" -ForegroundColor Red; exit 1 }

# Step 2: Build backend
Write-Host "`n2/4 - Building backend image..." -ForegroundColor Yellow
Push-Location TabeebBackend/tabeeb_backend
docker build -t hammadhafeez1100/tabeeb-backend:latest .
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Host "Backend build failed!" -ForegroundColor Red; exit 1 }
Pop-Location
Write-Host "Backend built successfully!" -ForegroundColor Green

# Step 3: Build frontend with PRODUCTION env vars
Write-Host "`n3/4 - Building frontend image with production config..." -ForegroundColor Yellow
Push-Location TabeebFrontend

# Read production env values from root .env
$envFile = Get-Content "../.env" | Where-Object { $_ -match "^[^#]" -and $_ -match "=" }
$envVars = @{}
foreach ($line in $envFile) {
    $parts = $line -split "=", 2
    if ($parts.Count -eq 2) {
        $envVars[$parts[0].Trim()] = $parts[1].Trim()
    }
}

# Override API URL for production (Caddy reverse proxy)
$PROD_API_URL = "https://tabeeb.dpdns.org"

docker build `
    --build-arg NEXT_PUBLIC_API_URL=$PROD_API_URL `
    --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=$($envVars['NEXT_PUBLIC_FIREBASE_API_KEY']) `
    --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$($envVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN']) `
    --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=$($envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID']) `
    --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$($envVars['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET']) `
    --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$($envVars['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID']) `
    --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=$($envVars['NEXT_PUBLIC_FIREBASE_APP_ID']) `
    --build-arg NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$($envVars['NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID']) `
    --build-arg NEXT_PUBLIC_JITSI_APP_ID=$($envVars['NEXT_PUBLIC_JITSI_APP_ID']) `
    --build-arg NEXT_PUBLIC_JITSI_SECRET=$($envVars['NEXT_PUBLIC_JITSI_SECRET']) `
    --build-arg NEXT_PUBLIC_JITSI_DOMAIN=$($envVars['NEXT_PUBLIC_JITSI_DOMAIN']) `
    -t hammadhafeez1100/tabeeb-frontend:latest .

if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Host "Frontend build failed!" -ForegroundColor Red; exit 1 }
Pop-Location
Write-Host "Frontend built successfully!" -ForegroundColor Green

# Step 4: Push to Docker Hub
Write-Host "`n4/4 - Pushing images to Docker Hub..." -ForegroundColor Yellow

Write-Host "  Pushing backend..." -ForegroundColor Cyan
docker push hammadhafeez1100/tabeeb-backend:latest
if ($LASTEXITCODE -ne 0) { Write-Host "Backend push failed!" -ForegroundColor Red; exit 1 }

Write-Host "  Pushing frontend..." -ForegroundColor Cyan
docker push hammadhafeez1100/tabeeb-frontend:latest
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend push failed!" -ForegroundColor Red; exit 1 }

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  All images pushed to Docker Hub!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nImages:" -ForegroundColor Cyan
Write-Host "  - hammadhafeez1100/tabeeb-backend:latest"
Write-Host "  - hammadhafeez1100/tabeeb-frontend:latest"
Write-Host "`nNext steps on Oracle instance:" -ForegroundColor Yellow
Write-Host "  1. SSH into your Oracle VM"
Write-Host "  2. cd to your project directory"
Write-Host "  3. git pull"
Write-Host "  4. docker-compose -f docker-compose.prebuilt.yml pull"
Write-Host "  5. docker-compose -f docker-compose.prebuilt.yml up -d"
Write-Host "  6. docker-compose -f docker-compose.prebuilt.yml exec backend npx prisma db push"
Write-Host ""
