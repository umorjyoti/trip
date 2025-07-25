/**
 * CACHE INTEGRATION EXAMPLES
 * How to use cache.js in your controllers
 */

const { CacheManager, cacheInvalidationMiddleware } = require('../utils/cache');
const Trek = require('../models/Trek');
const Booking = require('../models/Booking');

// ========================================
// EXAMPLE 1: Trek Controller with Caching
// ========================================

// GET /api/treks - Get all treks with caching
exports.getAllTreks = async (req, res) => {
  try {
    const { region, difficulty, category } = req.query;
    
    // 1. Try to get from cache first
    const cachedTreks = CacheManager.getTrekList(region, difficulty);
    if (cachedTreks) {
      console.log('📦 Serving treks from cache');
      return res.json(cachedTreks);
    }
    
    // 2. If not in cache, fetch from database
    console.log('🔍 Fetching treks from database');
    const query = { isEnabled: true };
    if (region) query.region = region;
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    
    const treks = await Trek.find(query)
      .select('name slug region difficulty displayPrice images duration')
      .sort({ createdAt: -1 });
    
    // 3. Store in cache for next time
    CacheManager.setTrekList(treks, region, difficulty);
    
    res.json(treks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/treks/:slug - Get single trek with caching
exports.getTrekBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // 1. Check cache first
    const cachedTrek = CacheManager.getTrekDetails(slug);
    if (cachedTrek) {
      console.log('📦 Serving trek details from cache');
      return res.json(cachedTrek);
    }
    
    // 2. Fetch from database
    console.log('🔍 Fetching trek details from database');
    const trek = await Trek.findOne({ slug, isEnabled: true })
      .populate('batches')
      .lean(); // Use lean() for better performance
    
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    // 3. Cache the result
    CacheManager.setTrekDetails(slug, trek);
    
    res.json(trek);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// EXAMPLE 2: User Bookings with Caching
// ========================================

// GET /api/user/bookings - Get user bookings with caching
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Check cache
    const cachedBookings = CacheManager.getUserBookings(userId);
    if (cachedBookings) {
      console.log('📦 Serving user bookings from cache');
      return res.json(cachedBookings);
    }
    
    // 2. Fetch from database
    const bookings = await Booking.find({ user: userId })
      .populate('trek', 'name slug images')
      .sort({ createdAt: -1 });
    
    // 3. Cache the result
    CacheManager.setUserBookings(userId, bookings);
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// EXAMPLE 3: Search with Caching
// ========================================

// GET /api/search - Search treks with caching
exports.searchTreks = async (req, res) => {
  try {
    const { q, region, difficulty, minPrice, maxPrice } = req.query;
    const filters = { region, difficulty, minPrice, maxPrice };
    
    // 1. Check cache
    const cachedResults = CacheManager.getSearchResults(q, filters);
    if (cachedResults) {
      console.log('📦 Serving search results from cache');
      return res.json(cachedResults);
    }
    
    // 2. Build search query
    const searchQuery = {
      isEnabled: true,
      $text: { $search: q }
    };
    
    if (region) searchQuery.region = region;
    if (difficulty) searchQuery.difficulty = difficulty;
    if (minPrice || maxPrice) {
      searchQuery.displayPrice = {};
      if (minPrice) searchQuery.displayPrice.$gte = parseInt(minPrice);
      if (maxPrice) searchQuery.displayPrice.$lte = parseInt(maxPrice);
    }
    
    // 3. Execute search
    const results = await Trek.find(searchQuery, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);
    
    // 4. Cache results
    CacheManager.setSearchResults(q, filters, results);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// EXAMPLE 4: Cache Invalidation in Routes
// ========================================

// PUT /api/admin/treks/:id - Update trek (with cache invalidation)
exports.updateTrek = [
  cacheInvalidationMiddleware.onTrekUpdate, // Middleware to invalidate cache
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const trek = await Trek.findByIdAndUpdate(id, updateData, { new: true });
      
      // Manual cache invalidation (middleware also handles this)
      CacheManager.invalidateTrekCache(trek.slug);
      CacheManager.invalidateSearchCache();
      
      res.json(trek);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
];

// POST /api/bookings - Create booking (with cache invalidation)
exports.createBooking = [
  cacheInvalidationMiddleware.onBookingUpdate,
  async (req, res) => {
    try {
      const bookingData = { ...req.body, user: req.user.id };
      const booking = await Booking.create(bookingData);
      
      // Invalidate related caches
      CacheManager.invalidateUserCache(req.user.id);
      CacheManager.invalidateBatchAvailability(booking.trek);
      
      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
];

module.exports = exports;