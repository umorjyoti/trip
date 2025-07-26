/**
 * Shared utilities index file
 * Exports all shared utilities for easy importing in microservices
 */

// Database utilities
const database = require('./utils/database');

// Error handling utilities
const {
  AppError,
  formatErrorResponse,
  errorHandler,
  asyncHandler,
  notFoundHandler
} = require('./utils/errorHandler');

// Validation utilities
const {
  validateRequiredFields,
  validateEmail,
  validateObjectId,
  validatePhone,
  validatePassword,
  sanitizeString,
  validatePagination,
  createValidationMiddleware
} = require('./utils/validation');

// Authentication middleware
const {
  verifyToken,
  requireAdmin,
  optionalAuth,
  generateToken,
  setTokenCookie
} = require('./middleware/auth');

// Logging middleware
const {
  addCorrelationId,
  requestLogger,
  logger,
  logServiceStart
} = require('./middleware/logging');

// Environment configuration
const {
  loadEnvironment,
  getServicePort,
  getDatabaseName,
  isProduction,
  isDevelopment
} = require('./config/environment');

module.exports = {
  // Database
  database,
  
  // Error handling
  AppError,
  formatErrorResponse,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  
  // Validation
  validateRequiredFields,
  validateEmail,
  validateObjectId,
  validatePhone,
  validatePassword,
  sanitizeString,
  validatePagination,
  createValidationMiddleware,
  
  // Authentication
  verifyToken,
  requireAdmin,
  optionalAuth,
  generateToken,
  setTokenCookie,
  
  // Logging
  addCorrelationId,
  requestLogger,
  logger,
  logServiceStart,
  
  // Environment
  loadEnvironment,
  getServicePort,
  getDatabaseName,
  isProduction,
  isDevelopment
};