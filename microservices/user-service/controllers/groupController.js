const { UserGroup } = require('../models');
const {
  AppError,
  asyncHandler,
  validateRequiredFields,
  validateObjectId,
  validatePagination,
  sanitizeString
} = require('../../shared');

/**
 * Get all user groups with pagination
 */
const getUserGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, isActive } = req.query;
  
  // Validate pagination
  const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
  
  // Build query
  const query = {};
  
  if (search) {
    const searchRegex = new RegExp(sanitizeString(search), 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex }
    ];
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  // Execute query with pagination
  const skip = (pageNum - 1) * limitNum;
  
  const [groups, total] = await Promise.all([
    UserGroup.find(query)
      .populate('parentGroup', 'name')
      .populate('userCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    UserGroup.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    data: {
      groups,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});

/**
 * Get user group by ID
 */
const getUserGroupById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'group ID');
  
  const group = await UserGroup.findById(id)
    .populate('parentGroup', 'name description')
    .populate('userCount');
  
  if (!group) {
    throw new AppError('User group not found', 404, 'GROUP_NOT_FOUND');
  }
  
  res.json({
    success: true,
    data: { group }
  });
});

/**
 * Create new user group (admin only)
 */
const createUserGroup = asyncHandler(async (req, res) => {
  const { name, description, permissions, parentGroup, settings } = req.body;
  
  validateRequiredFields({ name }, ['name']);
  
  // Check if group name already exists
  const existingGroup = await UserGroup.findOne({ name: sanitizeString(name) });
  if (existingGroup) {
    throw new AppError('Group name already exists', 409, 'GROUP_NAME_EXISTS');
  }
  
  // Validate parent group if provided
  if (parentGroup) {
    validateObjectId(parentGroup, 'parent group ID');
    const parent = await UserGroup.findById(parentGroup);
    if (!parent) {
      throw new AppError('Parent group not found', 404, 'PARENT_GROUP_NOT_FOUND');
    }
  }
  
  // Create group
  const groupData = {
    name: sanitizeString(name),
    description: description ? sanitizeString(description) : undefined,
    permissions: permissions || [],
    parentGroup: parentGroup || undefined,
    settings: settings || {}
  };
  
  const group = await UserGroup.create(groupData);
  
  res.status(201).json({
    success: true,
    data: { group },
    message: 'User group created successfully'
  });
});

/**
 * Update user group (admin only)
 */
const updateUserGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions, parentGroup, settings, isActive } = req.body;
  
  validateObjectId(id, 'group ID');
  
  // Check if group exists
  const group = await UserGroup.findById(id);
  if (!group) {
    throw new AppError('User group not found', 404, 'GROUP_NOT_FOUND');
  }
  
  // Check if new name already exists (if name is being changed)
  if (name && name !== group.name) {
    const existingGroup = await UserGroup.findOne({ name: sanitizeString(name) });
    if (existingGroup) {
      throw new AppError('Group name already exists', 409, 'GROUP_NAME_EXISTS');
    }
  }
  
  // Validate parent group if provided
  if (parentGroup) {
    validateObjectId(parentGroup, 'parent group ID');
    
    // Prevent circular reference
    if (parentGroup === id) {
      throw new AppError('Group cannot be its own parent', 400, 'CIRCULAR_REFERENCE');
    }
    
    const parent = await UserGroup.findById(parentGroup);
    if (!parent) {
      throw new AppError('Parent group not found', 404, 'PARENT_GROUP_NOT_FOUND');
    }
  }
  
  // Update fields
  const updateData = {};
  if (name) updateData.name = sanitizeString(name);
  if (description !== undefined) updateData.description = description ? sanitizeString(description) : '';
  if (permissions) updateData.permissions = permissions;
  if (parentGroup !== undefined) updateData.parentGroup = parentGroup || null;
  if (settings) updateData.settings = { ...group.settings, ...settings };
  if (isActive !== undefined) updateData.isActive = isActive;
  
  const updatedGroup = await UserGroup.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('parentGroup', 'name');
  
  res.json({
    success: true,
    data: { group: updatedGroup },
    message: 'User group updated successfully'
  });
});

/**
 * Delete user group (admin only)
 */
const deleteUserGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'group ID');
  
  // Check if group exists
  const group = await UserGroup.findById(id);
  if (!group) {
    throw new AppError('User group not found', 404, 'GROUP_NOT_FOUND');
  }
  
  // Check if group has users
  const { User } = require('../models');
  const userCount = await User.countDocuments({ group: id });
  if (userCount > 0) {
    throw new AppError(
      `Cannot delete group with ${userCount} users. Please reassign users first.`,
      400,
      'GROUP_HAS_USERS'
    );
  }
  
  // Check if group has child groups
  const childCount = await UserGroup.countDocuments({ parentGroup: id });
  if (childCount > 0) {
    throw new AppError(
      `Cannot delete group with ${childCount} child groups. Please reassign child groups first.`,
      400,
      'GROUP_HAS_CHILDREN'
    );
  }
  
  // Delete group
  await UserGroup.findByIdAndDelete(id);
  
  res.json({
    success: true,
    message: 'User group deleted successfully'
  });
});

/**
 * Add permission to group (admin only)
 */
const addPermissionToGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, name, description } = req.body;
  
  validateObjectId(id, 'group ID');
  validateRequiredFields({ category, name }, ['category', 'name']);
  
  // Validate category
  const validCategories = ['stats', 'actions', 'content', 'system'];
  if (!validCategories.includes(category)) {
    throw new AppError(
      `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      400,
      'INVALID_CATEGORY'
    );
  }
  
  // Check if group exists
  const group = await UserGroup.findById(id);
  if (!group) {
    throw new AppError('User group not found', 404, 'GROUP_NOT_FOUND');
  }
  
  // Add permission
  group.addPermission(category, sanitizeString(name), description ? sanitizeString(description) : '');
  await group.save();
  
  res.json({
    success: true,
    data: { group },
    message: 'Permission added to group successfully'
  });
});

/**
 * Remove permission from group (admin only)
 */
const removePermissionFromGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, name } = req.body;
  
  validateObjectId(id, 'group ID');
  validateRequiredFields({ category, name }, ['category', 'name']);
  
  // Check if group exists
  const group = await UserGroup.findById(id);
  if (!group) {
    throw new AppError('User group not found', 404, 'GROUP_NOT_FOUND');
  }
  
  // Remove permission
  group.removePermission(category, sanitizeString(name));
  await group.save();
  
  res.json({
    success: true,
    data: { group },
    message: 'Permission removed from group successfully'
  });
});

/**
 * Get default permissions for group type
 */
const getDefaultPermissions = asyncHandler(async (req, res) => {
  const { type } = req.params;
  
  const validTypes = ['admin', 'moderator', 'user'];
  if (!validTypes.includes(type)) {
    throw new AppError(
      `Invalid group type. Must be one of: ${validTypes.join(', ')}`,
      400,
      'INVALID_GROUP_TYPE'
    );
  }
  
  const permissions = UserGroup.getDefaultPermissions(type);
  
  res.json({
    success: true,
    data: { permissions, type }
  });
});

module.exports = {
  getUserGroups,
  getUserGroupById,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  addPermissionToGroup,
  removePermissionFromGroup,
  getDefaultPermissions
};