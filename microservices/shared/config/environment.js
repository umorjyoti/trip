/**
 * Environment configuration utilities for microservices
 */

/**
 * Load and validate environment variables
 */
const loadEnvironment = (serviceName, requiredVars = []) => {
  require('dotenv').config();

  const config = {
    // Common configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT) || 3000,
    
    // Database configuration
    MONGODB_URI: process.env.MONGODB_URI,
    
    // JWT configuration
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',
    
    // Service URLs (for inter-service communication)
    USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    TREK_SERVICE_URL: process.env.TREK_SERVICE_URL || 'http://localhost:3002',
    BATCH_SERVICE_URL: process.env.BATCH_SERVICE_URL || 'http://localhost:3003',
    BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL || 'http://localhost:3004',
    PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
    CONTENT_SERVICE_URL: process.env.CONTENT_SERVICE_URL || 'http://localhost:3006',
    ADMIN_SERVICE_URL: process.env.ADMIN_SERVICE_URL || 'http://localhost:3007',
    NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
    GATEWAY_SERVICE_URL: process.env.GATEWAY_SERVICE_URL || 'http://localhost:3000',
    
    // Email configuration
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    
    // Payment configuration
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    
    // AWS configuration
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    
    // Google OAuth configuration
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URL: process.env.GOOGLE_OAUTH_REDIRECT_URL,
    
    // CORS configuration
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    
    // Session configuration
    SESSION_SECRET: process.env.SESSION_SECRET
  };

  // Validate required environment variables
  const missingVars = requiredVars.filter(varName => !config[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ ${serviceName} - Missing required environment variables:`, missingVars);
    process.exit(1);
  }

  // Log configuration (without sensitive data)
  console.log(`🔧 ${serviceName} configuration loaded:`, {
    NODE_ENV: config.NODE_ENV,
    PORT: config.PORT,
    MONGODB_URI: config.MONGODB_URI ? '***configured***' : 'missing',
    JWT_SECRET: config.JWT_SECRET ? '***configured***' : 'missing'
  });

  return config;
};

/**
 * Get service-specific port based on service name
 */
const getServicePort = (serviceName) => {
  const portMap = {
    'gateway-service': 3000,
    'user-service': 3001,
    'trek-service': 3002,
    'batch-service': 3003,
    'booking-service': 3004,
    'payment-service': 3005,
    'content-service': 3006,
    'admin-service': 3007,
    'notification-service': 3008
  };

  return portMap[serviceName] || parseInt(process.env.PORT) || 3000;
};

/**
 * Get database name for service
 */
const getDatabaseName = (serviceName) => {
  const baseDbName = process.env.DB_NAME || 'trekking_club';
  return `${baseDbName}_${serviceName.replace('-service', '')}`;
};

/**
 * Check if running in production
 */
const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if running in development
 */
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
};

module.exports = {
  loadEnvironment,
  getServicePort,
  getDatabaseName,
  isProduction,
  isDevelopment
};