const NodeCache = require('node-cache');

/**
 * Enhanced Caching System for Trekking Platform
 * Implements multiple cache layers with different TTL strategies
 */

// Different cache instances for different data types
const caches = {
  // Short-term cache for frequently changing data (5 minutes)
  short: new NodeCache({ stdTTL: 300, checkperiod: 60 }),
  
  // Medium-term cache for semi-static data (30 minutes)
  medium: new NodeCache({ stdTTL: 1800, checkperiod: 300 }),
  
  // Long-term cache for static data (2 hours)
  long: new NodeCache({ stdTTL: 7200, checkperiod: 600 }),
  
  // Session cache for user sessions (1 hour)
  session: new NodeCache({ stdTTL: 3600, checkperiod: 300 })
};

class CacheManager {
  
  // Trek-related caching
  static async getTrekList(region = null, difficulty = null) {
    const key = `treks:${region || 'all'}:${difficulty || 'all'}`;
    return caches.medium.get(key);
  }
  
  static setTrekList(data, region = null, difficulty = null) {
    const key = `treks:${region || 'all'}:${difficulty || 'all'}`;
    return caches.medium.set(key, data);
  }
  
  static getTrekDetails(slug) {
    return caches.medium.get(`trek:${slug}`);
  }
  
  static setTrekDetails(slug, data) {
    return caches.medium.set(`trek:${slug}`, data);
  }
  
  // User-related caching
  static getUserBookings(userId) {
    return caches.short.get(`user:bookings:${userId}`);
  }
  
  static setUserBookings(userId, data) {
    return caches.short.set(`user:bookings:${userId}`, data);
  }
  
  static getUserProfile(userId) {
    return caches.session.get(`user:profile:${userId}`);
  }
  
  static setUserProfile(userId, data) {
    return caches.session.set(`user:profile:${userId}`, data);
  }
  
  // Booking-related caching
  static getBookingDetails(bookingId) {
    return caches.short.get(`booking:${bookingId}`);
  }
  
  static setBookingDetails(bookingId, data) {
    return caches.short.set(`booking:${bookingId}`, data);
  }
  
  // Admin dashboard caching
  static getDashboardStats() {
    return caches.short.get('admin:dashboard:stats');
  }
  
  static setDashboardStats(data) {
    return caches.short.set('admin:dashboard:stats', data);
  }
  
  // Search results caching
  static getSearchResults(query, filters = {}) {
    const key = `search:${query}:${JSON.stringify(filters)}`;
    return caches.medium.get(key);
  }
  
  static setSearchResults(query, filters = {}, data) {
    const key = `search:${query}:${JSON.stringify(filters)}`;
    return caches.medium.set(key, data);
  }
  
  // Batch availability caching
  static getBatchAvailability(trekId) {
    return caches.short.get(`batch:availability:${trekId}`);
  }
  
  static setBatchAvailability(trekId, data) {
    return caches.short.set(`batch:availability:${trekId}`, data);
  }
  
  // Generic cache operations
  static get(key, cacheType = 'medium') {
    return caches[cacheType].get(key);
  }
  
  static set(key, data, cacheType = 'medium', ttl = null) {
    if (ttl) {
      return caches[cacheType].set(key, data, ttl);
    }
    return caches[cacheType].set(key, data);
  }
  
  static del(key, cacheType = 'medium') {
    return caches[cacheType].del(key);
  }
  
  // Cache invalidation methods
  static invalidateUserCache(userId) {
    caches.short.del(`user:bookings:${userId}`);
    caches.session.del(`user:profile:${userId}`);
  }
  
  static invalidateTrekCache(slug = null) {
    if (slug) {
      caches.medium.del(`trek:${slug}`);
    }
    // Clear all trek list caches
    const keys = caches.medium.keys();
    keys.forEach(key => {
      if (key.startsWith('treks:')) {
        caches.medium.del(key);
      }
    });
  }
  
  static invalidateBookingCache(bookingId, userId = null) {
    caches.short.del(`booking:${bookingId}`);
    if (userId) {
      caches.short.del(`user:bookings:${userId}`);
    }
    // Invalidate dashboard stats
    caches.short.del('admin:dashboard:stats');
  }
  
  static invalidateSearchCache() {
    const keys = caches.medium.keys();
    keys.forEach(key => {
      if (key.startsWith('search:')) {
        caches.medium.del(key);
      }
    });
  }
  
  // Cache statistics
  static getStats() {
    return {
      short: caches.short.getStats(),
      medium: caches.medium.getStats(),
      long: caches.long.getStats(),
      session: caches.session.getStats()
    };
  }
  
  // Clear all caches
  static clearAll() {
    Object.values(caches).forEach(cache => cache.flushAll());
  }
  
  // Cache warming - preload frequently accessed data
  static async warmCache() {
    console.log('🔥 Warming up cache...');
    try {
      // This would be called during server startup
      // Add your most frequently accessed data here
      console.log('✅ Cache warmed successfully');
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }
}

// Middleware for automatic cache invalidation
const cacheInvalidationMiddleware = {
  // Invalidate trek cache when trek is updated
  onTrekUpdate: (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheManager.invalidateTrekCache(req.params.slug);
        CacheManager.invalidateSearchCache();
      }
    });
    next();
  },
  
  // Invalidate user cache when user data changes
  onUserUpdate: (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheManager.invalidateUserCache(req.user?.id || req.params.userId);
      }
    });
    next();
  },
  
  // Invalidate booking cache when booking changes
  onBookingUpdate: (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheManager.invalidateBookingCache(
          req.params.bookingId, 
          req.user?.id
        );
      }
    });
    next();
  }
};

module.exports = {
  CacheManager,
  cacheInvalidationMiddleware,
  caches // Export for direct access if needed
};