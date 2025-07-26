/**
 * Standardized error handling utilities for microservices
 */

class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (error, serviceName) => {
  return {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.details || null
    },
    timestamp: new Date().toISOString(),
    service: serviceName
  };
};

/**
 * Global error handling middleware
 */
const errorHandler = (serviceName) => {
  return (err, req, res, next) => {
    console.error(`❌ ${serviceName} Error:`, {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });

    // Default error values
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details = null;

    // Handle operational errors
    if (err.isOperational) {
      statusCode = err.statusCode;
      code = err.code;
      message = err.message;
      details = err.details;
    }
    // Handle Mongoose validation errors
    else if (err.name === 'ValidationError') {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = 'Invalid input data';
      details = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
    }
    // Handle Mongoose cast errors
    else if (err.name === 'CastError') {
      statusCode = 400;
      code = 'INVALID_ID';
      message = 'Invalid ID format';
      details = { field: err.path, value: err.value };
    }
    // Handle duplicate key errors
    else if (err.code === 11000) {
      statusCode = 409;
      code = 'DUPLICATE_RESOURCE';
      message = 'Resource already exists';
      details = { field: Object.keys(err.keyValue)[0] };
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      code = 'INVALID_TOKEN';
      message = 'Invalid authentication token';
    }
    else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      code = 'TOKEN_EXPIRED';
      message = 'Authentication token has expired';
    }

    const errorResponse = {
      success: false,
      error: {
        code,
        message,
        details
      },
      timestamp: new Date().toISOString(),
      service: serviceName
    };

    res.status(statusCode).json(errorResponse);
  };
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler
 */
const notFoundHandler = (serviceName) => {
  return (req, res) => {
    const errorResponse = formatErrorResponse(
      new AppError('Route not found', 404, 'NOT_FOUND'),
      serviceName
    );
    res.status(404).json(errorResponse);
  };
};

module.exports = {
  AppError,
  formatErrorResponse,
  errorHandler,
  asyncHandler,
  notFoundHandler
};