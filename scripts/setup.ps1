# PowerShell setup script for Windows

Write-Host "🚀 Setting up MSME AI Assistant..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Create environment files if they don't exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "📝 Creating backend\.env from example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "📝 Creating frontend\.env from example..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
}

# Start Docker services
Write-Host "🐳 Starting PostgreSQL and Redis..." -ForegroundColor Cyan
docker-compose up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review and update backend\.env with your configuration"
Write-Host "  2. Review and update frontend\.env with your configuration"
Write-Host "  3. Run 'npm run dev' to start the development servers"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  npm run dev          - Start both backend and frontend"
Write-Host "  npm run dev:backend  - Start backend only"
Write-Host "  npm run dev:frontend - Start frontend only"
Write-Host "  npm test             - Run all tests"
Write-Host "  docker-compose down  - Stop database services"
Write-Host ""
