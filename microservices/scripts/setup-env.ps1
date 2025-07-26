# Setup environment files for all microservices
Write-Host "🔧 Setting up environment files for all microservices..." -ForegroundColor Green

# Array of service directories
$services = @(
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

# Copy environment files
foreach ($service in $services) {
    Write-Host "📝 Setting up environment for $service..." -ForegroundColor Yellow
    
    $exampleFile = "$service\.env.example"
    $envFile = "$service\.env"
    
    if (Test-Path $exampleFile) {
        if (!(Test-Path $envFile)) {
            Copy-Item $exampleFile $envFile
            Write-Host "✅ Created .env file for $service" -ForegroundColor Green
        } else {
            Write-Host "⚠️  .env file already exists for $service" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ No .env.example found for $service" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Please update the following in your .env files:" -ForegroundColor Yellow
Write-Host "   - MONGODB_URI: Your MongoDB connection string"
Write-Host "   - JWT_SECRET: A secure JWT secret key"
Write-Host "   - EMAIL_* variables: Your email service configuration"
Write-Host "   - RAZORPAY_* variables: Your Razorpay API keys"
Write-Host "   - AWS_* variables: Your AWS S3 configuration"
Write-Host "   - GOOGLE_* variables: Your Google OAuth credentials"
Write-Host ""
Write-Host "📖 See individual .env files for specific configuration details" -ForegroundColor Cyan