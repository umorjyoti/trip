# Microservices Setup Script
Write-Host "🚀 Setting up Trekking Club Microservices..." -ForegroundColor Green
Write-Host ""

# Step 1: Setup environment files
Write-Host "Step 1: Setting up environment files..." -ForegroundColor Cyan
& ".\scripts\setup-env.ps1"

Write-Host ""
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Cyan
& ".\scripts\install-all.ps1"

Write-Host ""
Write-Host "🎉 Microservices setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env files with your configuration"
Write-Host "2. Start MongoDB: docker run -d -p 27017:27017 --name mongodb mongo:7.0"
Write-Host "3. Start all services: docker-compose up -d"
Write-Host "   OR start individually: cd [service-name] && npm run dev"
Write-Host ""
Write-Host "📖 See README.md for detailed instructions" -ForegroundColor Cyan