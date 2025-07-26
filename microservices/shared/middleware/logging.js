const morgan = require('morgan');

/**
 * Logging middleware for microservices
 */

/**
 * Generate correlation ID for request tracking
 */
const generateCorrelationId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Add correlation ID to requests
 */
const addCorrelationId = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
};

/**
 * Custom morgan format with correlation ID
 */
const morganFormat = ':method :url :status :res[content-length] - :response-time ms [:correlation-id]';

// Add correlation ID token to morgan
morgan.token('correlation-id', (req) => req.correlationId);

/**
 * Request logging middleware
 */
const requestLogger = (serviceName) => {
  return morgan(morganFormat, {
    stream: {
      write: (message) => {
        console.log(`[${serviceName}] ${message.trim()}`);
      }
    }
  });
};

/**
 * Structured logging utility
 */
const logger = {
  info: (message, meta = {}, serviceName = 'microservice') => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      service: serviceName,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },

  error: (message, error = null, meta = {}, serviceName = 'microservice') => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      service: serviceName,
      timestamp: new Date().toISOString(),
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null,
      ...meta
    }));
  },

  warn: (message, meta = {}, serviceName = 'microservice') => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      service: serviceName,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },

  debug: (message, meta = {}, serviceName = 'microservice') => {
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify({
        level: 'debug',
        message,
        service: serviceName,
        timestamp: new Date().toISOString(),
        ...meta
      }));
    }
  }
};

/**
 * Log service startup
 */
const logServiceStart = (serviceName, port) => {
  logger.info(`${serviceName} started successfully`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  }, serviceName);
};

module.exports = {
  addCorrelationId,
  requestLogger,
  logger,
  logServiceStart
};