/**
 * QUICK START GUIDE
 * Copy these examples into your existing controllers
 */

// ========================================
// 1. ADD TO YOUR TREK CONTROLLER
// ========================================

// At the top of trekController.js, add:
const { CacheManager } = require('../utils/cache');
const { globalMonitor } = require('../utils/performance');

// Replace your existing getAllTreks function with this:
exports.getAllTreks = async (req, res) => {
  const timer = globalMonitor.startTimer('getAllTreks');
  
  try {
    const { region, difficulty } = req.query;
    
    // Check cache first
    const cacheKey = `treks:${region || 'all'}:${difficulty || 'all'}`;
    const cached = CacheManager.get(cacheKey);
    
    if (cached) {
      timer.end();
      return res.json(cached);
    }
    
    // Your existing database query
    const query = { isEnabled: true };
    if (region) query.region = region;
    if (difficulty) query.difficulty = difficulty;
    
    const treks = await Trek.find(query).sort({ createdAt: -1 });
    
    // Cache for 30 minutes
    CacheManager.set(cacheKey, treks, 'medium');
    
    timer.end();
    res.json(treks);
  } catch (error) {
    timer.end();
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// 2. ADD TO YOUR BOOKING CONTROLLER
// ========================================

// At the top of bookingController.js, add:
const { CacheManager } = require('../utils/cache');

// For getUserBookings function:
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check cache
    const cached = CacheManager.getUserBookings(userId);
    if (cached) {
      return res.json(cached);
    }
    
    // Your existing query
    const bookings = await Booking.find({ user: userId })
      .populate('trek')
      .sort({ createdAt: -1 });
    
    // Cache for 5 minutes (bookings change frequently)
    CacheManager.setUserBookings(userId, bookings);
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// 3. ADD TO YOUR SERVER.JS (MINIMAL)
// ========================================

// Add these lines to your server.js:

// After your imports, add:
const { requestTimingMiddleware, monitorDatabaseConnection } = require('./utils/performance');

// After app = express(), add:
app.use(requestTimingMiddleware);

// After mongoose.connect(), add:
monitorDatabaseConnection();

// Add performance route:
app.get('/api/admin/performance', (req, res) => {
  const { globalMonitor } = require('./utils/performance');
  const { CacheManager } = require('./utils/cache');
  
  res.json({
    queryStats: globalMonitor.getStats(),
    cacheStats: CacheManager.getStats(),
    memory: process.memoryUsage()
  });
});

// ========================================
// 4. TESTING YOUR IMPLEMENTATION
// ========================================

// Test cache:
// 1. Hit GET /api/treks twice - second should be faster
// 2. Check logs for "Serving from cache" messages

// Test performance:
// 1. Visit /api/admin/performance to see stats
// 2. Check console for slow query warnings

// ========================================
// 5. PACKAGE.JSON SCRIPTS TO ADD
// ========================================

// Add these to your package.json scripts:
{
  "scripts": {
    "performance:report": "node -e \"const {globalMonitor} = require('./utils/performance'); globalMonitor.generateReport();\"",
    "cache:clear": "node -e \"const {CacheManager} = require('./utils/cache'); CacheManager.clearAll(); console.log('Cache cleared');\"",
    "cache:stats": "node -e \"const {CacheManager} = require('./utils/cache'); console.log(CacheManager.getStats());\""
  }
}

// ========================================
// 6. ENVIRONMENT VARIABLES TO ADD
// ========================================

// Add to your .env file:
// CACHE_TTL_SHORT=300     # 5 minutes
// CACHE_TTL_MEDIUM=1800   # 30 minutes  
// CACHE_TTL_LONG=7200     # 2 hours
// SLOW_QUERY_THRESHOLD=1000  # 1 second