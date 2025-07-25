/**
 * SERVER.JS INTEGRATION EXAMPLE
 * How to add cache and performance monitoring to your server.js
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// 1. IMPORT PERFORMANCE AND CACHE UTILITIES
const { 
  requestTimingMiddleware,
  monitorDatabaseConnection,
  monitorMemoryUsage,
  globalMonitor 
} = require('./utils/performance');

const { CacheManager } = require('./utils/cache');

const app = express();

// 2. ADD PERFORMANCE MIDDLEWARE EARLY
app.use(requestTimingMiddleware);

// 3. EXISTING MIDDLEWARE
app.use(express.json());
app.use(cors());
// ... your other middleware

// 4. START MONITORING
monitorDatabaseConnection();
monitorMemoryUsage();

// 5. WARM UP CACHE ON SERVER START
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log('MongoDB connected');
  
  // Warm up cache with frequently accessed data
  await CacheManager.warmCache();
  
  // Setup cron jobs for automated tasks (only in production)
  if (process.env.NODE_ENV === 'production') {
    const { setupCronJobs } = require('./scripts/setupCronJobs');
    setupCronJobs();
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// 6. ADD PERFORMANCE MONITORING ROUTES
app.get('/api/admin/performance', (req, res) => {
  const stats = globalMonitor.getStats();
  const slowQueries = globalMonitor.getSlowQueries(10);
  
  res.json({
    queryMetrics: stats,
    slowQueries,
    cacheStats: CacheManager.getStats(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Performance dashboard (HTML)
app.get('/admin/performance-dashboard', (req, res) => {
  // Use the HTML dashboard from performanceIntegration.js example
});

// 7. YOUR EXISTING ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/treks', trekRoutes);
// ... other routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Performance dashboard: http://localhost:${PORT}/admin/performance-dashboard`);
});