const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');

// Import shared utilities
const {
  database,
  errorHandler,
  notFoundHandler,
  addCorrelationId,
  requestLogger,
  logger,
  logServiceStart,
  loadEnvironment,
  getServicePort
} = require('../shared');

// Load environment configuration
const config = loadEnvironment('user-service', [
  'MONGODB_URI',
  'JWT_SECRET'
]);

const app = express();
const PORT = getServicePort('user-service');
const SERVICE_NAME = 'user-service';

// Trust proxy for production
if (config.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later'
    }
  }
});

// Middleware
app.use(limiter);
app.use(addCorrelationId);
app.use(requestLogger(SERVICE_NAME));

app.use(cors({
  origin: [
    config.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-correlation-id'
  ]
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration for Google OAuth
app.use(session({
  secret: config.SESSION_SECRET || 'user-service-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: database.isConnected() ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/groups', require('./routes/groups'));
app.use('/profile', require('./routes/profile'));

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: SERVICE_NAME,
    version: '1.0.0',
    description: 'User management and authentication microservice',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      users: '/users/*',
      groups: '/groups/*',
      profile: '/profile/*'
    }
  });
});

// Error handling
app.use(notFoundHandler(SERVICE_NAME));
app.use(errorHandler(SERVICE_NAME));

// Database connection and server startup
const startServer = async () => {
  try {
    // Connect to database
    await database.connect(config.MONGODB_URI, SERVICE_NAME);
    
    // Start server
    app.listen(PORT, () => {
      logServiceStart(SERVICE_NAME, PORT);
      logger.info('User Service ready to handle requests', {
        port: PORT,
        database: config.MONGODB_URI ? 'configured' : 'missing'
      }, SERVICE_NAME);
    });
  } catch (error) {
    logger.error('Failed to start User Service', error, {}, SERVICE_NAME);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully', {}, SERVICE_NAME);
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully', {}, SERVICE_NAME);
  await database.disconnect();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', err, {}, SERVICE_NAME);
  process.exit(1);
});

// Start the server
startServer();