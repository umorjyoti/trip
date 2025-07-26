const { AppError } = require('./errorHandler');

/**
 * Common validation utilities for microservices
 */

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    throw new AppError(
      'Missing required fields',
      400,
      'VALIDATION_ERROR',
      { missingFields }
    );
  }
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(
      'Invalid email format',
      400,
      'VALIDATION_ERROR',
      { field: 'email' }
    );
  }
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(
      `Invalid ${fieldName} format`,
      400,
      'VALIDATION_ERROR',
      { field: fieldName }
    );
  }
};

/**
 * Validate phone number (basic validation)
 */
const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    throw new AppError(
      'Invalid phone number format',
      400,
      'VALIDATION_ERROR',
      { field: 'phone' }
    );
  }
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (password.length < 6) {
    throw new AppError(
      'Password must be at least 6 characters long',
      400,
      'VALIDATION_ERROR',
      { field: 'password' }
    );
  }
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate pagination parameters
 */
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  if (pageNum < 1) {
    throw new AppError(
      'Page number must be greater than 0',
      400,
      'VALIDATION_ERROR',
      { field: 'page' }
    );
  }

  if (limitNum < 1 || limitNum > 100) {
    throw new AppError(
      'Limit must be between 1 and 100',
      400,
      'VALIDATION_ERROR',
      { field: 'limit' }
    );
  }

  return { page: pageNum, limit: limitNum };
};

/**
 * Validation middleware factory
 */
const createValidationMiddleware = (validationRules) => {
  return (req, res, next) => {
    try {
      validationRules(req.body, req.params, req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validateRequiredFields,
  validateEmail,
  validateObjectId,
  validatePhone,
  validatePassword,
  sanitizeString,
  validatePagination,
  createValidationMiddleware
};