const { Region } = require('../models');
const {
  AppError,
  asyncHandler,
  validateRequiredFields,
  validateObjectId,
  validatePagination,
  sanitizeString
} = require('../../shared');

/**
 * Get all regions with filtering and pagination
 */
const getRegions = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    state, 
    climate,
    isActive,
    isFeatured,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;
  
  // Validate pagination
  const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
  
  // Build query
  const query = {};
  
  // Search functionality
  if (search) {
    query.$text = { $search: sanitizeString(search) };
  }
  
  // Filter by state
  if (state) {
    query.state = state;
  }
  
  // Filter by climate
  if (climate) {
    query.climate = climate;
  }
  
  // Filter by active status
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  // Filter by featured status
  if (isFeatured !== undefined) {
    query.isFeatured = isFeatured === 'true';
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
  
  const [regions, total] = await Promise.all([
    Region.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-__v'),
    Region.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    data: {
      regions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filters: {
        search,
        state,
        climate,
        isActive,
        isFeatured,
        sortBy,
        sortOrder
      }
    }
  });
});

/**
 * Get region by ID or slug
 */
const getRegionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  let region;
  
  // Check if it's a valid ObjectId or slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    region = await Region.findById(id);
  } else {
    region = await Region.findOne({ slug: id, isActive: true });
  }
  
  if (!region) {
    throw new AppError('Region not found', 404, 'REGION_NOT_FOUND');
  }
  
  // Increment view count
  region.incrementViewCount().catch(err => 
    console.error('Failed to increment view count:', err)
  );
  
  res.json({
    success: true,
    data: { region }
  });
});

/**
 * Create new region (admin only)
 */
const createRegion = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    state,
    country,
    coordinates,
    highlights,
    bestTimeToVisit,
    climate,
    nearestAirport,
    nearestRailway,
    accessibility,
    popularActivities,
    localCuisine,
    culturalSignificance,
    images,
    coverImage
  } = req.body;

  // Validate required fields
  validateRequiredFields({
    name,
    description,
    state
  }, ['name', 'description', 'state']);

  // Create region
  const region = await Region.create({
    name: sanitizeString(name),
    description: sanitizeString(description),
    state: sanitizeString(state),
    country: country ? sanitizeString(country) : 'India',
    coordinates: coordinates || {},
    highlights: highlights ? highlights.map(h => sanitizeString(h)) : [],
    bestTimeToVisit: bestTimeToVisit ? sanitizeString(bestTimeToVisit) : undefined,
    climate: climate || 'Temperate',
    nearestAirport: nearestAirport ? sanitizeString(nearestAirport) : undefined,
    nearestRailway: nearestRailway ? sanitizeString(nearestRailway) : undefined,
    accessibility: accessibility || 'Moderate',
    popularActivities: popularActivities ? popularActivities.map(a => sanitizeString(a)) : [],
    localCuisine: localCuisine ? localCuisine.map(c => sanitizeString(c)) : [],
    culturalSignificance: culturalSignificance ? sanitizeString(culturalSignificance) : undefined,
    images: images || [],
    coverImage: coverImage || undefined
  });

  res.status(201).json({
    success: true,
    data: { region },
    message: 'Region created successfully'
  });
});

/**
 * Update region (admin only)
 */
const updateRegion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'region ID');
  
  const region = await Region.findById(id);
  if (!region) {
    throw new AppError('Region not found', 404, 'REGION_NOT_FOUND');
  }
  
  // Update fields
  const updateData = { ...req.body };
  
  // Sanitize string fields
  const stringFields = ['name', 'description', 'state', 'country', 'bestTimeToVisit', 'nearestAirport', 'nearestRailway', 'culturalSignificance'];
  stringFields.forEach(field => {
    if (updateData[field]) {
      updateData[field] = sanitizeString(updateData[field]);
    }
  });
  
  // Sanitize array fields
  if (updateData.highlights) {
    updateData.highlights = updateData.highlights.map(h => sanitizeString(h));
  }
  if (updateData.popularActivities) {
    updateData.popularActivities = updateData.popularActivities.map(a => sanitizeString(a));
  }
  if (updateData.localCuisine) {
    updateData.localCuisine = updateData.localCuisine.map(c => sanitizeString(c));
  }
  
  const updatedRegion = await Region.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    data: { region: updatedRegion },
    message: 'Region updated successfully'
  });
});

/**
 * Delete region (admin only)
 */
const deleteRegion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'region ID');
  
  const region = await Region.findById(id);
  if (!region) {
    throw new AppError('Region not found', 404, 'REGION_NOT_FOUND');
  }
  
  // Check if region has associated treks
  const { Trek } = require('../models');
  const trekCount = await Trek.countDocuments({ region: id });
  
  if (trekCount > 0) {
    throw new AppError(
      `Cannot delete region with ${trekCount} associated treks. Please reassign treks first.`,
      400,
      'REGION_HAS_TREKS'
    );
  }
  
  await Region.findByIdAndDelete(id);
  
  res.json({
    success: true,
    message: 'Region deleted successfully'
  });
});

/**
 * Toggle region status (admin only)
 */
const toggleRegionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'region ID');
  
  const region = await Region.findById(id);
  if (!region) {
    throw new AppError('Region not found', 404, 'REGION_NOT_FOUND');
  }
  
  region.isActive = !region.isActive;
  await region.save();
  
  res.json({
    success: true,
    data: { region },
    message: `Region ${region.isActive ? 'activated' : 'deactivated'} successfully`
  });
});

/**
 * Toggle region featured status (admin only)
 */
const toggleRegionFeatured = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'region ID');
  
  const region = await Region.findById(id);
  if (!region) {
    throw new AppError('Region not found', 404, 'REGION_NOT_FOUND');
  }
  
  region.isFeatured = !region.isFeatured;
  await region.save();
  
  res.json({
    success: true,
    data: { region },
    message: `Region ${region.isFeatured ? 'featured' : 'unfeatured'} successfully`
  });
});

/**
 * Get active regions
 */
const getActiveRegions = asyncHandler(async (req, res) => {
  const regions = await Region.findActive();
  
  res.json({
    success: true,
    data: { regions }
  });
});

/**
 * Get featured regions
 */
const getFeaturedRegions = asyncHandler(async (req, res) => {
  const regions = await Region.findFeatured();
  
  res.json({
    success: true,
    data: { regions }
  });
});

/**
 * Get popular regions
 */
const getPopularRegions = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const regions = await Region.findPopular(parseInt(limit));
  
  res.json({
    success: true,
    data: { regions }
  });
});

/**
 * Search regions
 */
const searchRegions = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  
  if (!q) {
    throw new AppError('Search query is required', 400, 'MISSING_SEARCH_QUERY');
  }
  
  const regions = await Region.searchRegions(sanitizeString(q)).limit(parseInt(limit));
  
  res.json({
    success: true,
    data: { regions, query: q }
  });
});

/**
 * Update region statistics (admin only)
 */
const updateRegionStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'region ID');
  
  const region = await Region.findById(id);
  if (!region) {
    throw new AppError('Region not found', 404, 'REGION_NOT_FOUND');
  }
  
  await region.updateStatistics();
  
  res.json({
    success: true,
    data: { region },
    message: 'Region statistics updated successfully'
  });
});

/**
 * Get region statistics (admin only)
 */
const getRegionStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    Region.countDocuments(),
    Region.countDocuments({ isActive: true }),
    Region.countDocuments({ isFeatured: true }),
    Region.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } }
    ]),
    Region.aggregate([
      { $group: { _id: '$climate', count: { $sum: 1 } } }
    ])
  ]);
  
  res.json({
    success: true,
    data: {
      total: stats[0],
      active: stats[1],
      featured: stats[2],
      byState: stats[3],
      byClimate: stats[4]
    }
  });
});

module.exports = {
  getRegions,
  getRegionById,
  createRegion,
  updateRegion,
  deleteRegion,
  toggleRegionStatus,
  toggleRegionFeatured,
  getActiveRegions,
  getFeaturedRegions,
  getPopularRegions,
  searchRegions,
  updateRegionStats,
  getRegionStats
};