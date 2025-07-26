const { TrekSection } = require('../models');
const {
  AppError,
  asyncHandler,
  validateRequiredFields,
  validateObjectId,
  validatePagination,
  sanitizeString
} = require('../../shared');

/**
 * Get all trek sections with filtering and pagination
 */
const getSections = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    isActive,
    isFeatured,
    sortBy = 'order',
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
  
  const [sections, total] = await Promise.all([
    TrekSection.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-__v'),
    TrekSection.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    data: {
      sections,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filters: {
        search,
        isActive,
        isFeatured,
        sortBy,
        sortOrder
      }
    }
  });
});

/**
 * Get section by ID or slug
 */
const getSectionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  let section;
  
  // Check if it's a valid ObjectId or slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    section = await TrekSection.findById(id);
  } else {
    section = await TrekSection.findOne({ slug: id, isActive: true });
  }
  
  if (!section) {
    throw new AppError('Trek section not found', 404, 'SECTION_NOT_FOUND');
  }
  
  res.json({
    success: true,
    data: { section }
  });
});

/**
 * Create new trek section (admin only)
 */
const createSection = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    icon,
    color,
    order,
    config
  } = req.body;

  // Validate required fields
  validateRequiredFields({
    name,
    description
  }, ['name', 'description']);

  // Create section
  const section = await TrekSection.create({
    name: sanitizeString(name),
    description: sanitizeString(description),
    icon: icon ? sanitizeString(icon) : undefined,
    color: color || '#007bff',
    order: order ? parseInt(order) : 0,
    config: config || {}
  });

  res.status(201).json({
    success: true,
    data: { section },
    message: 'Trek section created successfully'
  });
});

/**
 * Update trek section (admin only)
 */
const updateSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'section ID');
  
  const section = await TrekSection.findById(id);
  if (!section) {
    throw new AppError('Trek section not found', 404, 'SECTION_NOT_FOUND');
  }
  
  // Update fields
  const updateData = { ...req.body };
  
  // Sanitize string fields
  const stringFields = ['name', 'description', 'icon'];
  stringFields.forEach(field => {
    if (updateData[field]) {
      updateData[field] = sanitizeString(updateData[field]);
    }
  });
  
  const updatedSection = await TrekSection.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    data: { section: updatedSection },
    message: 'Trek section updated successfully'
  });
});

/**
 * Delete trek section (admin only)
 */
const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'section ID');
  
  const section = await TrekSection.findById(id);
  if (!section) {
    throw new AppError('Trek section not found', 404, 'SECTION_NOT_FOUND');
  }
  
  // Check if section has associated treks
  const { Trek } = require('../models');
  const trekCount = await Trek.countDocuments({ category: section.slug });
  
  if (trekCount > 0) {
    throw new AppError(
      `Cannot delete section with ${trekCount} associated treks. Please reassign treks first.`,
      400,
      'SECTION_HAS_TREKS'
    );
  }
  
  await TrekSection.findByIdAndDelete(id);
  
  res.json({
    success: true,
    message: 'Trek section deleted successfully'
  });
});

/**
 * Toggle section status (admin only)
 */
const toggleSectionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'section ID');
  
  const section = await TrekSection.findById(id);
  if (!section) {
    throw new AppError('Trek section not found', 404, 'SECTION_NOT_FOUND');
  }
  
  section.isActive = !section.isActive;
  await section.save();
  
  res.json({
    success: true,
    data: { section },
    message: `Section ${section.isActive ? 'activated' : 'deactivated'} successfully`
  });
});

/**
 * Toggle section featured status (admin only)
 */
const toggleSectionFeatured = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'section ID');
  
  const section = await TrekSection.findById(id);
  if (!section) {
    throw new AppError('Trek section not found', 404, 'SECTION_NOT_FOUND');
  }
  
  section.isFeatured = !section.isFeatured;
  await section.save();
  
  res.json({
    success: true,
    data: { section },
    message: `Section ${section.isFeatured ? 'featured' : 'unfeatured'} successfully`
  });
});

/**
 * Get active sections
 */
const getActiveSections = asyncHandler(async (req, res) => {
  const sections = await TrekSection.findActive();
  
  res.json({
    success: true,
    data: { sections }
  });
});

/**
 * Get featured sections
 */
const getFeaturedSections = asyncHandler(async (req, res) => {
  const sections = await TrekSection.findFeatured();
  
  res.json({
    success: true,
    data: { sections }
  });
});

/**
 * Get sections for homepage
 */
const getHomepageSections = asyncHandler(async (req, res) => {
  const sections = await TrekSection.findForHomepage();
  
  res.json({
    success: true,
    data: { sections }
  });
});

/**
 * Get sections for navigation
 */
const getNavigationSections = asyncHandler(async (req, res) => {
  const sections = await TrekSection.findForNavigation();
  
  res.json({
    success: true,
    data: { sections }
  });
});

/**
 * Get popular sections
 */
const getPopularSections = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const sections = await TrekSection.findPopular(parseInt(limit));
  
  res.json({
    success: true,
    data: { sections }
  });
});

/**
 * Search sections
 */
const searchSections = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  
  if (!q) {
    throw new AppError('Search query is required', 400, 'MISSING_SEARCH_QUERY');
  }
  
  const sections = await TrekSection.searchSections(sanitizeString(q)).limit(parseInt(limit));
  
  res.json({
    success: true,
    data: { sections, query: q }
  });
});

/**
 * Update section statistics (admin only)
 */
const updateSectionStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'section ID');
  
  const section = await TrekSection.findById(id);
  if (!section) {
    throw new AppError('Trek section not found', 404, 'SECTION_NOT_FOUND');
  }
  
  await section.updateStatistics();
  
  res.json({
    success: true,
    data: { section },
    message: 'Section statistics updated successfully'
  });
});

/**
 * Reorder sections (admin only)
 */
const reorderSections = asyncHandler(async (req, res) => {
  const { sectionIds } = req.body;
  
  if (!Array.isArray(sectionIds)) {
    throw new AppError('Section IDs must be an array', 400, 'INVALID_SECTION_IDS');
  }
  
  // Update order for each section
  const updatePromises = sectionIds.map((sectionId, index) => {
    validateObjectId(sectionId, 'section ID');
    return TrekSection.findByIdAndUpdate(sectionId, { order: index });
  });
  
  await Promise.all(updatePromises);
  
  // Get updated sections
  const sections = await TrekSection.findActive();
  
  res.json({
    success: true,
    data: { sections },
    message: 'Sections reordered successfully'
  });
});

/**
 * Get section statistics (admin only)
 */
const getSectionStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    TrekSection.countDocuments(),
    TrekSection.countDocuments({ isActive: true }),
    TrekSection.countDocuments({ isFeatured: true }),
    TrekSection.countDocuments({ 'config.showOnHomepage': true }),
    TrekSection.countDocuments({ 'config.showInNavigation': true })
  ]);
  
  res.json({
    success: true,
    data: {
      total: stats[0],
      active: stats[1],
      featured: stats[2],
      onHomepage: stats[3],
      inNavigation: stats[4]
    }
  });
});

module.exports = {
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  toggleSectionStatus,
  toggleSectionFeatured,
  getActiveSections,
  getFeaturedSections,
  getHomepageSections,
  getNavigationSections,
  getPopularSections,
  searchSections,
  updateSectionStats,
  reorderSections,
  getSectionStats
};