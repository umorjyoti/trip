# Trekking Club Microservices

This directory contains the microservices architecture for the Trekking Club platform, decomposed from the original monolithic backend.

## Architecture Overview

The system is composed of 9 microservices:

1. **Gateway Service** (Port 3000) - API routing and authentication
2. **User Service** (Port 3001) - User management and authentication
3. **Trek Service** (Port 3002) - Trek catalog and regions
4. **Batch Service** (Port 3003) - Batch scheduling and management
5. **Booking Service** (Port 3004) - Booking management
6. **Payment Service** (Port 3005) - Payment processing
7. **Content Service** (Port 3006) - Blogs, offers, and media
8. **Admin Service** (Port 3007) - Administrative functions
9. **Notification Service** (Port 3008) - Email notifications

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 7.0+
- Docker & Docker Compose (optional)

### Local Development Setup

1. **Clone and setup environment files:**
   ```bash
   # Copy environment files for each service
   cp user-service/.env.example user-service/.env
   cp trek-service/.env.example trek-service/.env
   cp batch-service/.env.example batch-service/.env
   cp booking-service/.env.example booking-service/.env
   cp payment-service/.env.example payment-service/.env
   cp content-service/.env.example content-service/.env
   cp admin-service/.env.example admin-service/.env
   cp notification-service/.env.example notification-service/.env
   cp gateway-service/.env.example gateway-service/.env
   ```

2. **Install dependencies for all services:**
   ```bash
   # Install dependencies for each service
   cd user-service && npm install && cd ..
   cd trek-service && npm install && cd ..
   cd batch-service && npm install && cd ..
   cd booking-service && npm install && cd ..
   cd payment-service && npm install && cd ..
   cd content-service && npm install && cd ..
   cd admin-service && npm install && cd ..
   cd notification-service && npm install && cd ..
   cd gateway-service && npm install && cd ..
   ```

3. **Start MongoDB:**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   
   # Or use your local MongoDB installation
   ```

4. **Start services in development mode:**
   ```bash
   # Start each service in separate terminals
   cd user-service && npm run dev
   cd trek-service && npm run dev
   cd batch-service && npm run dev
   cd booking-service && npm run dev
   cd payment-service && npm run dev
   cd content-service && npm run dev
   cd admin-service && npm run dev
   cd notification-service && npm run dev
   cd gateway-service && npm run dev
   ```

### Docker Development Setup

1. **Start all services with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f [service-name]
   ```

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

## Service Communication

Services communicate through REST APIs. The Gateway Service routes external requests to appropriate microservices.

### API Endpoints

All external API calls go through the Gateway Service at `http://localhost:3000`:

- `/api/auth/*` → User Service
- `/api/users/*` → User Service  
- `/api/treks/*` → Trek Service
- `/api/regions/*` → Trek Service
- `/api/batches/*` → Batch Service
- `/api/bookings/*` → Booking Service
- `/api/payments/*` → Payment Service
- `/api/blogs/*` → Content Service
- `/api/offers/*` → Content Service
- `/api/admin/*` → Admin Service
- `/api/notifications/*` → Notification Service

### Inter-Service Communication

Services communicate directly with each other using configured service URLs:

```javascript
// Example: Booking Service calling User Service
const userResponse = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
```

## Database Structure

Each service has its own MongoDB database:

- `trekking_club_user` - User Service
- `trekking_club_trek` - Trek Service
- `trekking_club_batch` - Batch Service
- `trekking_club_booking` - Booking Service
- `trekking_club_payment` - Payment Service
- `trekking_club_content` - Content Service
- `trekking_club_admin` - Admin Service
- `trekking_club_notification` - Notification Service

## Development Guidelines

### Adding New Features

1. Identify the appropriate service for the feature
2. Add the feature to that service only
3. Use inter-service communication for cross-service data
4. Update API documentation
5. Add tests for the new functionality

### Error Handling

All services use standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { "field": "email" }
  },
  "timestamp": "2025-01-24T10:30:00Z",
  "service": "user-service"
}
```

### Authentication

- JWT tokens are validated at the Gateway level
- User information is passed to services in request headers
- Services can validate tokens independently if needed

## Testing

Run tests for individual services:

```bash
cd [service-name]
npm test
```

Run tests for all services:

```bash
# Create a script to run all tests
./scripts/run-all-tests.sh
```

## Monitoring and Logging

- All services use structured JSON logging
- Correlation IDs track requests across services
- Health check endpoints available at `/health` for each service

## Deployment

### Production Deployment

1. Build Docker images for each service
2. Deploy to container orchestration platform (Kubernetes, Docker Swarm)
3. Configure environment variables for production
4. Set up monitoring and alerting
5. Configure load balancers and service discovery

### Environment Variables

Each service requires specific environment variables. See individual `.env.example` files for details.

## Migration from Monolith

The microservices maintain API compatibility with the original monolithic backend. The Gateway Service handles routing and request transformation to ensure seamless migration.

## Troubleshooting

### Common Issues

1. **Service not starting**: Check environment variables and database connectivity
2. **Inter-service communication failing**: Verify service URLs in environment files
3. **Database connection issues**: Ensure MongoDB is running and accessible
4. **Port conflicts**: Make sure each service uses a unique port

### Debugging

1. Check service logs: `docker-compose logs [service-name]`
2. Verify service health: `curl http://localhost:[port]/health`
3. Check database connectivity: Verify MongoDB connection strings
4. Test inter-service communication: Use service URLs directly

## Contributing

1. Follow the established service structure
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Use the shared utilities for common functionality
5. Follow the error handling patterns