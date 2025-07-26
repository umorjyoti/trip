#!/bin/bash

# Start all microservices in development mode
echo "🚀 Starting all microservices in development mode..."

# Array of service directories with their ports
declare -A services=(
  ["notification-service"]=3008
  ["user-service"]=3001
  ["trek-service"]=3002
  ["batch-service"]=3003
  ["booking-service"]=3004
  ["payment-service"]=3005
  ["content-service"]=3006
  ["admin-service"]=3007
  ["gateway-service"]=3000
)

# Function to start a service
start_service() {
  local service=$1
  local port=$2
  
  echo "🔄 Starting $service on port $port..."
  cd "$service"
  
  if [ -f "package.json" ]; then
    # Start service in background
    npm run dev > "../logs/${service}.log" 2>&1 &
    local pid=$!
    echo "$pid" > "../logs/${service}.pid"
    echo "✅ Started $service (PID: $pid)"
  else
    echo "❌ No package.json found for $service"
  fi
  
  cd ..
}

# Create logs directory
mkdir -p logs

# Start services in dependency order
for service in "${!services[@]}"; do
  start_service "$service" "${services[$service]}"
  sleep 2  # Wait a bit between service starts
done

echo "🎉 All services started!"
echo "📋 Service status:"
echo "   Gateway Service: http://localhost:3000"
echo "   User Service: http://localhost:3001"
echo "   Trek Service: http://localhost:3002"
echo "   Batch Service: http://localhost:3003"
echo "   Booking Service: http://localhost:3004"
echo "   Payment Service: http://localhost:3005"
echo "   Content Service: http://localhost:3006"
echo "   Admin Service: http://localhost:3007"
echo "   Notification Service: http://localhost:3008"
echo ""
echo "📝 Logs are available in the logs/ directory"
echo "🛑 To stop all services, run: ./scripts/stop-all.sh"