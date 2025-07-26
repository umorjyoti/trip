# Install dependencies for all microservices
Write-Host "🚀 Installing dependencies for all microservices..." -ForegroundColor Green

# Array of service directories
$services = @(
    "shared",
    "user-service",
    "trek-service",
    "batch-service", 
    "booking-service",
    "payment-service",
    "content-service",
    "admin-service",
    "notification-service",
    "gateway-service"
)

# Install dependencies for each service
foreach ($service in $services) {
    Write-Host "📦 Installing dependencies for $service..." -ForegroundColor Yellow
    Set-Location $service
    
    if (Test-Path "package.json") {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully installed dependencies for $service" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install dependencies for $service" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
    } else {
        Write-Host "⚠️  No package.json found for $service" -ForegroundColor Yellow
    }
    
    Set-Location ..
}

Write-Host "🎉 All dependencies installed successfully!" -ForegroundColor Green