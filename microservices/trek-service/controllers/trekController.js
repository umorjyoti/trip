const { Trek } = require('../models');
const {
  AppError,
  asyncHandler,
  validateRequiredFields,
  validateObjectId,
  validatePagination,
  sanitizeString
} = require('../../shared');

/**
 * Get all treks with filtering and pagination
 */
const getTreks = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 12, 
    search, 
    region, 
    difficulty, 
    category, 
    minPrice, 
    maxPrice,
    duration,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  // Validate pagination
  const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
  
  // Build query
  const query = { isEnabled: true };
  
  // Search functionality
  if (search) {
    query.$text = { $search: sanitizeString(search) };
  }
  
  // Filter by region
  if (region) {
    query.region = region;
  }
  
  // Filter by difficulty
  if (difficulty) {
    query.difficulty = difficulty;
  }
  
  // Filter by category
  if (category) {
    query.category = category;
  }
  
  // Filter by price range
  if (minPrice || maxPrice) {
    query.displayPrice = {};
    if (minPrice) query.displayPrice.$gte = parseInt(minPrice);
    if (maxPrice) query.displayPrice.$lte = parseInt(maxPrice);
  }
  
  // Filter by duration
  if (duration) {
    query.duration = parseInt(duration);
  }
  
  // Build sort object
  const sortObj = {};
  if (search) {
    sortObj.score = { $meta: 'textScore' };
  } else {
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }
  
  // Execute query with pagination
  const skip = (pageNum - 1) * limitNum;
  
  const [treks, total] = await Promise.all([
    Trek.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-__v'),
    Trek.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    data: {
      treks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filters: {
        search,
        region,
        difficulty,
        category,
        minPrice,
        maxPrice,
        duration,
        sortBy,
        sortOrder
      }
    }
  });
});

/**
 * Get trek by ID or slug
 */
const getTrekById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  let trek;
  
  // Check if it's a valid ObjectId or slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    trek = await Trek.findById(id);
  } else {
    trek = await Trek.findOne({ slug: id, isEnabled: true });
  }
  
  if (!trek) {
    throw new AppError('Trek not found', 404, 'TREK_NOT_FOUND');
  }
  
  // Increment view count
  trek.incrementViewCount().catch(err => 
    console.error('Failed to increment view count:', err)
  );
  
  res.json({
    success: true,
    data: { trek }
  });
});

/**
 * Create new trek (admin only)
 */
const createTrek = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    region,
    regionName,
    difficulty,
    duration,
    displayPrice,
    startingPoint,
    endingPoint,
    highlights,
    includes,
    excludes,
    itinerary,
    images,
    category,
    season,
    distance,
    maxAltitude
  } = req.body;

  // Validate required fields
  validateRequiredFields({
    name,
    description,
    region,
    regionName,
    difficulty,
    duration,
    displayPrice,
    startingPoint,
    endingPoint,
    highlights
  }, [
    'name',
    'description', 
    'region',
    'regionName',
    'difficulty',
    'duration',
    'displayPrice',
    'startingPoint',
    'endingPoint',
    'highlights'
  ]);

  // Create trek
  const trek = await Trek.create({
    name: sanitizeString(name),
    description: sanitizeString(description),
    region,
    regionName: sanitizeString(regionName),
    difficulty,
    duration: parseInt(duration),
    displayPrice: parseFloat(displayPrice),
    startingPoint: sanitizeString(startingPoint),
    endingPoint: sanitizeString(endingPoint),
    highlights: highlights.map(h => sanitizeString(h)),
    includes: includes ? includes.map(i => sanitizeString(i)) : [],
    excludes: excludes ? excludes.map(e => sanitizeString(e)) : [],
    itinerary: itinerary || [],
    images: images || [],
    category: category || 'all-treks',
    season: season || 'Year-round',
    distance: distance ? parseFloat(distance) : 0,
    maxAltitude: maxAltitude ? parseInt(maxAltitude) : undefined
  });

  res.status(201).json({
    success: true,
    data: { trek },
    message: 'Trek created successfully'
  });
});

/**
 * Update trek (admin only)
 */
const updateTrek = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'trek ID');
  
  const trek = await Trek.findById(id);
  if (!trek) {
    throw new AppError('Trek not found', 404, 'TREK_NOT_FOUND');
  }
  
  // Update fields
  const updateData = { ...req.body };
  
  // Sanitize string fields
  const stringFields = ['name', 'description', 'regionName', 'startingPoint', 'endingPoint'];
  stringFields.forEach(field => {
    if (updateData[field]) {
      updateData[field] = sanitizeString(updateData[field]);
    }
  });
  
  // Sanitize array fields
  if (updateData.highlights) {
    updateData.highlights = updateData.highlights.map(h => sanitizeString(h));
  }
  if (updateData.includes) {
    updateData.includes = updateData.includes.map(i => sanitizeString(i));
  }
  if (updateData.excludes) {
    updateData.excludes = updateData.excludes.map(e => sanitizeString(e));
  }
  
  const updatedTrek = await Trek.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    data: { trek: updatedTrek },
    message: 'Trek updated successfully'
  });
});

/**
 * Delete trek (admin only)
 */
const deleteTrek = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'trek ID');
  
  const trek = await Trek.findById(id);
  if (!trek) {
    throw new AppError('Trek not found', 404, 'TREK_NOT_FOUND');
  }
  
  await Trek.findByIdAndDelete(id);
  
  res.json({
    success: true,
    message: 'Trek deleted successfully'
  });
});

/**
 * Toggle trek status (admin only)
 */
const toggleTrekStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'trek ID');
  
  const trek = await Trek.findById(id);
  if (!trek) {
    throw new AppError('Trek not found', 404, 'TREK_NOT_FOUND');
  }
  
  trek.isEnabled = !trek.isEnabled;
  await trek.save();
  
  res.json({
    success: true,
    data: { trek },
    message: `Trek ${trek.isEnabled ? 'enabled' : 'disabled'} successfully`
  });
});

/**
 * Get popular treks
 */
const getPopularTreks = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const treks = await Trek.findPopular(parseInt(limit));
  
  res.json({
    success: true,
    data: { treks }
  });
});

/**
 * Get featured treks
 */
const getFeaturedTreks = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  
  const treks = await Trek.findFeatured(parseInt(limit));
  
  res.json({
    success: true,
    data: { treks }
  });
});

/**
 * Search treks
 */
const searchTreks = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  
  if (!q) {
    throw new AppError('Search query is required', 400, 'MISSING_SEARCH_QUERY');
  }
  
  const treks = await Trek.searchTreks(sanitizeString(q)).limit(parseInt(limit));
  
  res.json({
    success: true,
    data: { treks, query: q }
  });
});

/**
 * Get trek statistics (admin only)
 */
const getTrekStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    Trek.countDocuments(),
    Trek.countDocuments({ isEnabled: true }),
    Trek.countDocuments({ isEnabled: false }),
    Trek.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]),
    Trek.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    Trek.aggregate([
      { $group: { _id: null, avgPrice: { $avg: '$displayPrice' } } }
    ])
  ]);
  
  res.json({
    success: true,
    data: {
      total: stats[0],
      enabled: stats[1],
      disabled: stats[2],
      byDifficulty: stats[3],
      byCategory: stats[4],
      averagePrice: stats[5][0]?.avgPrice || 0
    }
  });
});

module.exports = {
  getTreks,
  getTrekById,
  createTrek,
  updateTrek,
  deleteTrek,
  toggleTrekStatus,
  getPopularTreks,
  getFeaturedTreks,
  searchTreks,
  getTrekStats
};