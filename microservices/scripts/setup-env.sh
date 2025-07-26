#!/bin/bash

# Setup environment files for all microservices
echo "🔧 Setting up environment files for all microservices..."

# Array of service directories
services=(
  "user-service"
  "trek-service"
  "batch-service"
  "booking-service"
  "payment-service"
  "content-service"
  "admin-service"
  "notification-service"
  "gateway-service"
)

# Copy environment files
for service in "${services[@]}"; do
  echo "📝 Setting up environment for $service..."
  
  if [ -f "$service/.env.example" ]; then
    if [ ! -f "$service/.env" ]; then
      cp "$service/.env.example" "$service/.env"
      echo "✅ Created .env file for $service"
    else
      echo "⚠️  .env file already exists for $service"
    fi
  else
    echo "❌ No .env.example found for $service"
  fi
done

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "⚠️  IMPORTANT: Please update the following in your .env files:"
echo "   - MONGODB_URI: Your MongoDB connection string"
echo "   - JWT_SECRET: A secure JWT secret key"
echo "   - EMAIL_* variables: Your email service configuration"
echo "   - RAZORPAY_* variables: Your Razorpay API keys"
echo "   - AWS_* variables: Your AWS S3 configuration"
echo "   - GOOGLE_* variables: Your Google OAuth credentials"
echo ""
echo "📖 See individual .env files for specific configuration details"