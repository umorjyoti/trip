const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

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
const config = loadEnvironment('trek-service', [
  'MONGODB_URI',
  'JWT_SECRET'
]);

const app = express();
const PORT = getServicePort('trek-service');
const SERVICE_NAME = 'trek-service';

// Trust proxy for production
if (config.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for trek service as it's read-heavy
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

// API routes will be added here
// app.use('/treks', require('./routes/treks'));
// app.use('/regions', require('./routes/regions'));
// app.use('/sections', require('./routes/sections'));

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: SERVICE_NAME,
    version: '1.0.0',
    description: 'Trek catalog and region management microservice',
    endpoints: {
      health: '/health',
      treks: '/treks/*',
      regions: '/regions/*',
      sections: '/sections/*'
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
      logger.info('Trek Service ready to handle requests', {
        port: PORT,
        database: config.MONGODB_URI ? 'configured' : 'missing'
      }, SERVICE_NAME);
    });
  } catch (error) {
    logger.error('Failed to start Trek Service', error, {}, SERVICE_NAME);
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