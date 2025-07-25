/**
 * PERFORMANCE MONITORING INTEGRATION EXAMPLES
 * How to use performance.js in your application
 */

const { 
  PerformanceMonitor, 
  mongoosePerformancePlugin, 
  requestTimingMiddleware,
  monitorDatabaseConnection,
  monitorMemoryUsage,
  globalMonitor 
} = require('../utils/performance');

// ========================================
// EXAMPLE 1: Server.js Integration
// ========================================

// In your server.js file:
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// 1. Add request timing middleware
app.use(requestTimingMiddleware);

// 2. Start database and memory monitoring
monitorDatabaseConnection();
monitorMemoryUsage();

// 3. Add performance plugin to all schemas
const Trek = require('./models/Trek');
const User = require('./models/User');
const Booking = require('./models/Booking');

// Apply performance monitoring to schemas
Trek.schema.plugin(mongoosePerformancePlugin, { monitor: globalMonitor });
User.schema.plugin(mongoosePerformancePlugin, { monitor: globalMonitor });
Booking.schema.plugin(mongoosePerformancePlugin, { monitor: globalMonitor });

// ========================================
// EXAMPLE 2: Manual Query Timing in Controllers
// ========================================

const Trek = require('../models/Trek');

// Example: Trek controller with manual timing
exports.getTrekStats = async (req, res) => {
  try {
    // 1. Start timing for the entire operation
    const operationTimer = globalMonitor.startTimer('getTrekStats');
    
    // 2. Time individual database queries
    const totalTreksTimer = globalMonitor.startTimer('getTrekStats.totalTreks');
    const totalTreks = await Trek.countDocuments();
    totalTreksTimer.end();
    
    const regionsTimer = globalMonitor.startTimer('getTrekStats.regions');
    const regions = await Trek.aggregate([
      { $group: { _id: "$regionName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    regionsTimer.end();
    
    const difficultiesTimer = globalMonitor.startTimer('getTrekStats.difficulties');
    const difficulties = await Trek.aggregate([
      { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    difficultiesTimer.end();
    
    // 3. End overall timing
    const totalTime = operationTimer.end();
    
    const response = {
      totalTreks,
      regions,
      difficulties,
      _performance: {
        totalTime: `${totalTime.toFixed(2)}ms`
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// EXAMPLE 3: Performance Monitoring Route
// ========================================

// Add this route to monitor performance in real-time
exports.getPerformanceStats = (req, res) => {
  try {
    const stats = globalMonitor.getStats();
    const slowQueries = globalMonitor.getSlowQueries(10);
    
    res.json({
      queryMetrics: stats,
      slowQueries,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// EXAMPLE 4: Custom Performance Middleware
// ========================================

// Middleware to track API endpoint performance
const trackEndpointPerformance = (endpointName) => {
  return (req, res, next) => {
    const timer = globalMonitor.startTimer(`endpoint.${endpointName}`);
    
    res.on('finish', () => {
      const duration = timer.end();
      
      // Log slow endpoints
      if (duration > 1000) {
        console.warn(`🐌 Slow endpoint: ${endpointName} took ${duration.toFixed(2)}ms`);
      }
      
      // Add performance header
      res.set('X-Performance-Time', `${duration.toFixed(2)}ms`);
    });
    
    next();
  };
};

// Usage in routes:
// router.get('/treks', trackEndpointPerformance('getAllTreks'), getAllTreks);
// router.get('/bookings', trackEndpointPerformance('getUserBookings'), getUserBookings);

// ========================================
// EXAMPLE 5: Performance Dashboard Route
// ========================================

exports.getPerformanceDashboard = (req, res) => {
  try {
    const report = globalMonitor.generateReport();
    
    // Generate HTML dashboard
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Performance Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
            .slow-query { background-color: #ffe6e6; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <h1>Performance Dashboard</h1>
        
        <h2>Query Metrics</h2>
        <table>
            <tr>
                <th>Query</th>
                <th>Count</th>
                <th>Avg Time (ms)</th>
                <th>Min Time (ms)</th>
                <th>Max Time (ms)</th>
            </tr>
            ${Object.entries(report.metrics).map(([query, data]) => `
                <tr>
                    <td>${query}</td>
                    <td>${data.count}</td>
                    <td>${data.avgTime}</td>
                    <td>${data.minTime}</td>
                    <td>${data.maxTime}</td>
                </tr>
            `).join('')}
        </table>
        
        <h2>Slow Queries</h2>
        ${report.slowQueries.map(query => `
            <div class="metric slow-query">
                <strong>${query.queryName}</strong>: ${query.duration.toFixed(2)}ms
                <br><small>${query.timestamp}</small>
            </div>
        `).join('')}
        
        <h2>System Info</h2>
        <div class="metric">
            <strong>Memory Usage:</strong> ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
        </div>
        <div class="metric">
            <strong>Uptime:</strong> ${(process.uptime() / 60).toFixed(2)} minutes
        </div>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// EXAMPLE 6: Scheduled Performance Reports
// ========================================

// Add this to your cron jobs (in setupCronJobs.js)
const cron = require('node-cron');

// Generate performance report every hour
cron.schedule('0 * * * *', () => {
  console.log('📊 Generating hourly performance report...');
  globalMonitor.generateReport();
  
  // Optional: Reset metrics after reporting
  // globalMonitor.reset();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

module.exports = {
  trackEndpointPerformance,
  // ... other exports
};