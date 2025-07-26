#!/bin/bash

# Stop all microservices
echo "🛑 Stopping all microservices..."

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

# Function to stop a service
stop_service() {
  local service=$1
  local pid_file="logs/${service}.pid"
  
  if [ -f "$pid_file" ]; then
    local pid=$(cat "$pid_file")
    echo "🔄 Stopping $service (PID: $pid)..."
    
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      echo "✅ Stopped $service"
    else
      echo "⚠️  $service was not running"
    fi
    
    rm -f "$pid_file"
  else
    echo "⚠️  No PID file found for $service"
  fi
}

# Stop all services
for service in "${services[@]}"; do
  stop_service "$service"
done

# Clean up log files
echo "🧹 Cleaning up log files..."
rm -f logs/*.log

echo "🎉 All services stopped!"