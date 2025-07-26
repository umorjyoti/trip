const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('../utils/errorHandler');

/**
 * Authentication middleware for microservices
 */

/**
 * Verify JWT token middleware
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for token in cookies
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // Make sure token exists
  if (!token) {
    throw new AppError('Authentication token required', 401, 'MISSING_TOKEN');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      isAdmin: decoded.role === 'admin' || decoded.isAdmin === true
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid authentication token', 401, 'INVALID_TOKEN');
    } else if (error.name === 'TokenExpiredError') {
      throw new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED');
    }
    throw error;
  }
});

/**
 * Admin authorization middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'MISSING_AUTH');
  }

  if (!req.user.isAdmin && req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403, 'INSUFFICIENT_PERMISSIONS');
  }

  next();
};

/**
 * Optional authentication middleware (doesn't throw error if no token)
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for token in cookies
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        isAdmin: decoded.role === 'admin' || decoded.isAdmin === true
      };
    } catch (error) {
      // Ignore token errors for optional auth
      req.user = null;
    }
  }

  next();
});

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin' || user.isAdmin === true
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '24h'
    }
  );
};

/**
 * Set JWT cookie
 */
const setTokenCookie = (res, token) => {
  const options = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, options);
};

module.exports = {
  verifyToken,
  requireAdmin,
  optionalAuth,
  generateToken,
  setTokenCookie
};