/**
 * Performance Monitoring Utilities
 * Track query performance and identify bottlenecks
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.slowQueries = [];
    this.slowQueryThreshold = 1000; // 1 second
  }

  // Start timing a database query
  startTimer(queryName, query = null) {
    const startTime = process.hrtime.bigint();
    return {
      queryName,
      query,
      startTime,
      end: () => this.endTimer(queryName, startTime, query)
    };
  }

  // End timing and record metrics
  endTimer(queryName, startTime, query = null) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Record metrics
    if (!this.metrics.has(queryName)) {
      this.metrics.set(queryName, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      });
    }

    const metric = this.metrics.get(queryName);
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);

    // Track slow queries
    if (duration > this.slowQueryThreshold) {
      this.slowQueries.push({
        queryName,
        query,
        duration,
        timestamp: new Date()
      });

      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries.shift();
      }

      console.warn(`🐌 Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Get performance metrics
  getMetrics() {
    const metrics = {};
    for (const [queryName, data] of this.metrics) {
      metrics[queryName] = {
        ...data,
        avgTime: Math.round(data.avgTime * 100) / 100,
        minTime: Math.round(data.minTime * 100) / 100,
        maxTime: Math.round(data.maxTime * 100) / 100
      };
    }
    return metrics;
  }

  // Get slow queries
  getSlowQueries(limit = 10) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Reset metrics
  reset() {
    this.metrics.clear();
    this.slowQueries = [];
  }

  // Generate performance report
  generateReport() {
    const metrics = this.getMetrics();
    const slowQueries = this.getSlowQueries();

    console.log('\n📊 Performance Report');
    console.log('=' .repeat(50));
    
    console.log('\n🏃 Query Performance:');
    Object.entries(metrics).forEach(([queryName, data]) => {
      console.log(`  ${queryName}:`);
      console.log(`    Count: ${data.count}`);
      console.log(`    Avg: ${data.avgTime}ms`);
      console.log(`    Min: ${data.minTime}ms`);
      console.log(`    Max: ${data.maxTime}ms`);
    });

    if (slowQueries.length > 0) {
      console.log('\n🐌 Slowest Queries:');
      slowQueries.forEach((query, index) => {
        console.log(`  ${index + 1}. ${query.queryName}: ${query.duration.toFixed(2)}ms`);
      });
    }

    return { metrics, slowQueries };
  }
}

// Mongoose plugin for automatic query monitoring
function mongoosePerformancePlugin(schema, options = {}) {
  const monitor = options.monitor || new PerformanceMonitor();

  // Pre-hook for all query operations
  const queryMethods = [
    'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete',
    'updateOne', 'updateMany', 'deleteOne', 'deleteMany',
    'countDocuments', 'aggregate'
  ];

  queryMethods.forEach(method => {
    schema.pre(method, function() {
      this._startTime = process.hrtime.bigint();
      this._queryName = `${this.model.modelName}.${method}`;
    });

    schema.post(method, function() {
      if (this._startTime) {
        const duration = Number(process.hrtime.bigint() - this._startTime) / 1000000;
        monitor.endTimer(this._queryName, this._startTime);
      }
    });
  });
}

// Express middleware for request timing
function requestTimingMiddleware(req, res, next) {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
    
    if (duration > 2000) { // Log requests taking more than 2 seconds
      console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
    
    // Add timing header
    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  });
  
  next();
}

// Database connection monitoring
function monitorDatabaseConnection() {
  const mongoose = require('mongoose');
  
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });
  
  // Monitor connection pool
  setInterval(() => {
    const db = mongoose.connection.db;
    if (db) {
      const stats = db.serverConfig?.s?.pool?.totalConnectionCount || 0;
      if (stats > 0) {
        console.log(`📊 Active DB connections: ${stats}`);
      }
    }
  }, 60000); // Check every minute
}

// Memory usage monitoring
function monitorMemoryUsage() {
  setInterval(() => {
    const usage = process.memoryUsage();
    const formatBytes = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
    
    console.log('💾 Memory Usage:');
    console.log(`  RSS: ${formatBytes(usage.rss)}`);
    console.log(`  Heap Used: ${formatBytes(usage.heapUsed)}`);
    console.log(`  Heap Total: ${formatBytes(usage.heapTotal)}`);
    console.log(`  External: ${formatBytes(usage.external)}`);
    
    // Alert if memory usage is high
    if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('⚠️ High memory usage detected!');
    }
  }, 300000); // Check every 5 minutes
}

// Global performance monitor instance
const globalMonitor = new PerformanceMonitor();

module.exports = {
  PerformanceMonitor,
  mongoosePerformancePlugin,
  requestTimingMiddleware,
  monitorDatabaseConnection,
  monitorMemoryUsage,
  globalMonitor
};