#!/bin/bash

# Install dependencies for all microservices
echo "🚀 Installing dependencies for all microservices..."

# Array of service directories
services=(
  "shared"
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

# Install dependencies for each service
for service in "${services[@]}"; do
  echo "📦 Installing dependencies for $service..."
  cd "$service"
  
  if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
      echo "✅ Successfully installed dependencies for $service"
    else
      echo "❌ Failed to install dependencies for $service"
      exit 1
    fi
  else
    echo "⚠️  No package.json found for $service"
  fi
  
  cd ..
done

echo "🎉 All dependencies installed successfully!"