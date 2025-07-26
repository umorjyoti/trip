# Design Document

## Overview

This design outlines the migration of the existing monolithic trekking platform backend into a microservices architecture. The current system is a Node.js/Express application with MongoDB that handles user authentication, trek management, bookings, payments, and various other business functions. The microservices architecture will decompose this into 8 domain-specific services that communicate through REST APIs.

The migration will create new services in the `microservices` folder while preserving the existing backend as a reference. Each microservice will be independently deployable, scalable, and maintainable.

## Architecture

### Service Decomposition Strategy

Based on the analysis of the current backend, the system will be decomposed into the following microservices organized by business domains:

1. **User Service** - User management, authentication, profiles
2. **Trek Service** - Trek catalog, regions, trek sections
3. **Batch Service** - Batch management, scheduling, availability
4. **Booking Service** - Booking management, participant details
5. **Payment Service** - Payment processing, Razorpay integration
6. **Content Service** - Blogs, offers, career applications
7. **Admin Service** - Administrative functions, statistics, settings
8. **Notification Service** - Email notifications, reminders
9. **Gateway Service** - API gateway, routing, authentication middleware

### Communication Patterns

- **Synchronous Communication**: REST APIs for real-time operations
- **Service Discovery**: Environment-based configuration with service URLs
- **Authentication**: JWT tokens validated at gateway level and passed to services
- **Error Handling**: Standardized error responses across all services
- **Data Consistency**: Each service owns its data with API-based communication

### Database Strategy

Each microservice will have its own database schema/collection within MongoDB:
- `users`, `user_groups` - User Service
- `treks`, `regions`, `trek_sections` - Trek Service  
- `batches` - Batch Service
- `bookings`, `failed_bookings` - Booking Service
- `payments`, `promo_codes` - Payment Service
- `blogs`, `blog_regions`, `offers`, `careers`, `leads` - Content Service
- `settings`, `tickets` - Admin Service
- `email_logs`, `otp_codes`, `notification_templates` - Notification Service

## Components and Interfaces

### 1. User Service (`/microservices/user-service`)

**Responsibilities:**
- User registration, login, profile management
- JWT token generation and validation
- Google OAuth integration
- User groups and permissions
- Password reset functionality

**API Endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-otp` - OTP verification
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update user profile
- `GET /users` - List users (admin)
- `PATCH /users/:id/role` - Update user role

**Database Collections:**
- `users`
- `user_groups`

**Dependencies:**
- Notification Service (for OTP emails)

### 2. Trek Service (`/microservices/trek-service`)

**Responsibilities:**
- Trek catalog management
- Region and trek section management
- Trek search and filtering
- Custom trek handling

**API Endpoints:**
- `GET /treks` - List treks with filtering
- `GET /treks/:id` - Get trek details
- `POST /treks` - Create trek (admin)
- `PUT /treks/:id` - Update trek
- `GET /regions` - List regions
- `GET /trek-sections` - List trek sections

**Database Collections:**
- `treks`
- `regions`
- `trek_sections`

**Dependencies:**
- User Service (for authentication)

### 3. Batch Service (`/microservices/batch-service`)

**Responsibilities:**
- Batch scheduling and management
- Batch availability tracking
- Batch pricing management
- Batch status updates
- Participant count management

**API Endpoints:**
- `GET /batches` - List batches with filtering
- `GET /batches/:id` - Get batch details
- `GET /batches/trek/:trekId` - Get batches for a trek
- `POST /batches` - Create batch (admin)
- `PUT /batches/:id` - Update batch
- `PUT /batches/:id/participants` - Update participant count
- `PUT /batches/:id/status` - Update batch status

**Database Collections:**
- `batches`

**Dependencies:**
- Trek Service (for trek validation)
- User Service (for authentication)

### 4. Booking Service (`/microservices/booking-service`)

**Responsibilities:**
- Booking creation and management
- Participant details management
- Booking status updates
- Cancellation and reschedule requests
- Booking exports and reporting

**API Endpoints:**
- `POST /bookings` - Create booking
- `GET /bookings` - List bookings
- `GET /bookings/:id` - Get booking details
- `PUT /bookings/:id/participants` - Update participants
- `PUT /bookings/:id/cancel` - Cancel booking
- `POST /bookings/:id/cancellation-request` - Request cancellation

**Database Collections:**
- `bookings`
- `failed_bookings`

**Dependencies:**
- User Service (for user validation)
- Trek Service (for trek details)
- Batch Service (for batch validation and participant count updates)
- Payment Service (for payment validation)
- Notification Service (for booking emails)

### 5. Payment Service (`/microservices/payment-service`)

**Responsibilities:**
- Razorpay integration
- Payment order creation
- Payment verification
- Promo code management
- Refund processing

**API Endpoints:**
- `POST /payments/create-order` - Create payment order
- `POST /payments/verify` - Verify payment
- `GET /payments/get-key` - Get Razorpay key
- `POST /payments/webhook` - Handle webhooks
- `GET /promos` - List promo codes
- `POST /promos/validate` - Validate promo code

**Database Collections:**
- `promo_codes`
- `payment_logs`

**Dependencies:**
- Booking Service (for booking validation)
- Notification Service (for payment emails)

### 6. Content Service (`/microservices/content-service`)

**Responsibilities:**
- Blog management
- Offer management
- Career application handling
- Google Reviews integration
- File upload management

**API Endpoints:**
- `GET /blogs` - List blogs
- `POST /blogs` - Create blog (admin)
- `GET /offers` - List offers
- `POST /careers` - Submit career application
- `GET /google/reviews` - Get Google reviews
- `POST /upload` - File upload

**Database Collections:**
- `blogs`
- `blog_regions`
- `offers`
- `career_applications`
- `leads`
- `lead_history`

**Dependencies:**
- User Service (for authentication)
- Notification Service (for application emails)

### 7. Admin Service (`/microservices/admin-service`)

**Responsibilities:**
- Administrative booking management
- Statistics and analytics
- System settings
- User group management
- Ticket management

**API Endpoints:**
- `GET /admin/bookings` - Admin booking management
- `GET /admin/stats` - System statistics
- `GET /admin/settings` - System settings
- `POST /admin/tickets` - Create support ticket
- `GET /admin/users` - User management

**Database Collections:**
- `settings`
- `tickets`
- `user_groups`

**Dependencies:**
- User Service (for user data)
- Booking Service (for booking data)
- Trek Service (for trek data)

### 8. Notification Service (`/microservices/notification-service`)

**Responsibilities:**
- Email sending (SMTP integration)
- Email templates management
- Notification scheduling
- OTP generation and validation
- Booking reminders

**API Endpoints:**
- `POST /notifications/send-email` - Send email
- `POST /notifications/send-otp` - Send OTP
- `POST /notifications/verify-otp` - Verify OTP
- `POST /notifications/booking-confirmation` - Send booking confirmation
- `POST /notifications/payment-confirmation` - Send payment confirmation

**Database Collections:**
- `email_logs`
- `otp_codes`
- `notification_templates`

**Dependencies:**
- None (shared service)

### 9. Gateway Service (`/microservices/gateway-service`)

**Responsibilities:**
- API routing and load balancing
- Authentication middleware
- Rate limiting
- CORS handling
- Request/response logging
- Swagger documentation aggregation

**API Endpoints:**
- All external API endpoints are routed through the gateway
- `GET /api-docs` - Aggregated API documentation
- `GET /health` - Health check for all services

**Dependencies:**
- All other services (routes requests to them)

## Data Models

### Cross-Service Data Relationships

**User-Booking Relationship:**
- Booking Service stores `userId` and calls User Service for user details
- User Service doesn't directly reference bookings

**Trek-Batch-Booking Relationship:**
- Batch Service stores `trekId` and calls Trek Service for trek validation
- Booking Service stores `trekId` and `batchId`
- Calls Trek Service to validate trek existence and Batch Service to validate batch existence
- Batch Service updates participant counts when bookings are created/cancelled

**Payment-Booking Relationship:**
- Payment Service stores `bookingId` for payment tracking
- Booking Service calls Payment Service for payment validation

**Notification Dependencies:**
- All services can call Notification Service for email sending
- Notification Service doesn't store business data, only logs

### Data Consistency Patterns

**Eventual Consistency:**
- Statistics and reporting data can be eventually consistent
- Email notifications can be processed asynchronously

**Strong Consistency:**
- Payment verification must be strongly consistent
- Booking creation requires immediate validation

**Saga Pattern:**
- Booking creation involves multiple services (User validation, Trek validation, Payment processing)
- Implement compensation actions for rollback scenarios

## Error Handling

### Standardized Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "timestamp": "2025-01-24T10:30:00Z",
  "service": "user-service"
}
```

### Error Categories

1. **Validation Errors (400)** - Invalid input data
2. **Authentication Errors (401)** - Invalid or missing tokens
3. **Authorization Errors (403)** - Insufficient permissions
4. **Not Found Errors (404)** - Resource not found
5. **Conflict Errors (409)** - Resource conflicts
6. **Service Errors (500)** - Internal service errors
7. **Service Unavailable (503)** - Downstream service failures

### Circuit Breaker Pattern

Implement circuit breakers for service-to-service communication:
- **Closed State**: Normal operation
- **Open State**: Service calls fail fast
- **Half-Open State**: Limited requests to test service recovery

## Testing Strategy

### Unit Testing
- Each service will have comprehensive unit tests
- Mock external service dependencies
- Test business logic in isolation
- Target 80%+ code coverage

### Integration Testing
- Test API contracts between services
- Test database operations
- Test external service integrations (Razorpay, SMTP)
- Use test containers for database testing

### Contract Testing
- Define API contracts using OpenAPI specifications
- Use contract testing tools to ensure compatibility
- Version API contracts to manage changes

### End-to-End Testing
- Test complete user journeys across services
- Test critical business flows (booking, payment, cancellation)
- Use test data that spans multiple services

### Performance Testing
- Load testing for individual services
- Stress testing for service communication
- Database performance testing
- Identify bottlenecks and scaling requirements

### Service Testing Strategy

**Service-Level Tests:**
- Each service runs its own test suite
- Independent deployment testing
- Service health checks

**System-Level Tests:**
- Cross-service integration tests
- Data consistency validation
- Error propagation testing

## Implementation Considerations

### Service Configuration
- Environment-based configuration for service URLs
- Centralized configuration management
- Secret management for API keys and database credentials

### Monitoring and Observability
- Structured logging across all services
- Distributed tracing for request flows
- Service health monitoring
- Performance metrics collection

### Security Considerations
- JWT token validation at gateway level
- Service-to-service authentication
- Input validation and sanitization
- Rate limiting and DDoS protection

### Deployment Strategy
- Docker containerization for each service
- Independent service deployment
- Database migration management
- Blue-green deployment capability

### Backward Compatibility
- Maintain existing API endpoints during migration
- Gradual migration of functionality
- Rollback capability to monolithic version