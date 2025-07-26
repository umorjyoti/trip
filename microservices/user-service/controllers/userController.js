const { User, UserGroup } = require('../models');
const {
  AppError,
  asyncHandler,
  validateRequiredFields,
  validateEmail,
  validateObjectId,
  validatePagination,
  sanitizeString
} = require('../../shared');

/**
 * Get all users with pagination and filtering
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role, isActive } = req.query;
  
  // Validate pagination
  const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
  
  // Build query
  const query = {};
  
  if (search) {
    const searchRegex = new RegExp(sanitizeString(search), 'i');
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { username: searchRegex }
    ];
  }
  
  if (role) {
    query.role = role;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  // Execute query with pagination
  const skip = (pageNum - 1) * limitNum;
  
  const [users, total] = await Promise.all([
    User.find(query)
      .populate('group', 'name description')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    data: {
      users,
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
 * Get user by ID
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'user ID');
  
  const user = await User.findById(id)
    .populate('group', 'name description permissions')
    .select('-password');
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  res.json({
    success: true,
    data: { user }
  });
});

/**
 * Update user profile
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone,
    address,
    city,
    state,
    zipCode,
    country,
    profileImage
  } = req.body;
  
  validateObjectId(id, 'user ID');
  
  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  // Check authorization (users can only update their own profile, admins can update any)
  if (req.user.id !== id && !req.user.isAdmin) {
    throw new AppError('Not authorized to update this user', 403, 'INSUFFICIENT_PERMISSIONS');
  }
  
  // Update fields
  const updateData = {};
  if (name) updateData.name = sanitizeString(name);
  if (phone) updateData.phone = sanitizeString(phone);
  if (address) updateData.address = sanitizeString(address);
  if (city) updateData.city = sanitizeString(city);
  if (state) updateData.state = sanitizeString(state);
  if (zipCode) updateData.zipCode = sanitizeString(zipCode);
  if (country) updateData.country = sanitizeString(country);
  if (profileImage) updateData.profileImage = profileImage;
  
  const updatedUser = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('group', 'name description');
  
  res.json({
    success: true,
    data: { user: updatedUser },
    message: 'Profile updated successfully'
  });
});

/**
 * Update user role (admin only)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  validateObjectId(id, 'user ID');
  validateRequiredFields({ role }, ['role']);
  
  if (!['user', 'admin'].includes(role)) {
    throw new AppError('Invalid role. Must be either "user" or "admin"', 400, 'INVALID_ROLE');
  }
  
  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  // Prevent self-demotion
  if (req.user.id === id && role === 'user') {
    throw new AppError('Cannot demote yourself', 400, 'SELF_DEMOTION_NOT_ALLOWED');
  }
  
  // Update role
  user.role = role;
  user.isAdmin = role === 'admin';
  await user.save();
  
  res.json({
    success: true,
    data: { user },
    message: `User role updated to ${role}`
  });
});

/**
 * Update user group (admin only)
 */
const updateUserGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { groupId } = req.body;
  
  validateObjectId(id, 'user ID');
  
  if (groupId) {
    validateObjectId(groupId, 'group ID');
    
    // Check if group exists
    const group = await UserGroup.findById(groupId);
    if (!group) {
      throw new AppError('User group not found', 404, 'GROUP_NOT_FOUND');
    }
  }
  
  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  // Update group
  user.group = groupId || null;
  await user.save();
  
  const updatedUser = await User.findById(id).populate('group', 'name description');
  
  res.json({
    success: true,
    data: { user: updatedUser },
    message: 'User group updated successfully'
  });
});

/**
 * Deactivate user (admin only)
 */
const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'user ID');
  
  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  // Prevent self-deactivation
  if (req.user.id === id) {
    throw new AppError('Cannot deactivate yourself', 400, 'SELF_DEACTIVATION_NOT_ALLOWED');
  }
  
  // Deactivate user
  user.isActive = false;
  await user.save();
  
  res.json({
    success: true,
    data: { user },
    message: 'User deactivated successfully'
  });
});

/**
 * Activate user (admin only)
 */
const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'user ID');
  
  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  // Activate user
  user.isActive = true;
  await user.save();
  
  res.json({
    success: true,
    data: { user },
    message: 'User activated successfully'
  });
});

/**
 * Delete user (admin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  validateObjectId(id, 'user ID');
  
  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  // Prevent self-deletion
  if (req.user.id === id) {
    throw new AppError('Cannot delete yourself', 400, 'SELF_DELETION_NOT_ALLOWED');
  }
  
  // Delete user
  await User.findByIdAndDelete(id);
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * Get user statistics (admin only)
 */
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ 
      createdAt: { 
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
      } 
    })
  ]);
  
  res.json({
    success: true,
    data: {
      total: stats[0],
      active: stats[1],
      admins: stats[2],
      verified: stats[3],
      newThisMonth: stats[4]
    }
  });
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserGroup,
  deactivateUser,
  activateUser,
  deleteUser,
  getUserStats
};