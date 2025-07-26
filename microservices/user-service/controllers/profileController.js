const { User } = require('../models');
const {
  AppError,
  asyncHandler,
  validateRequiredFields,
  validateEmail,
  validatePhone,
  validateObjectId,
  sanitizeString
} = require('../../shared');

/**
 * Get user profile with detailed information
 */
const getDetailedProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('group', 'name description permissions')
    .select('-password');
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Calculate profile completion percentage
  const profileFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'country'];
  const completedFields = profileFields.filter(field => user[field] && user[field].trim() !== '');
  const profileCompletion = Math.round((completedFields.length / profileFields.length) * 100);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isAdmin: user.isAdminUser,
        isVerified: user.isVerified,
        isActive: user.isActive,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        profileImage: user.profileImage,
        group: user.group,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        termsAccepted: user.termsAccepted,
        termsAcceptedAt: user.termsAcceptedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profileCompletion
      }
    }
  });
});

/**
 * Update profile image
 */
const updateProfileImage = asyncHandler(async (req, res) => {
  const { profileImage } = req.body;

  validateRequiredFields({ profileImage }, ['profileImage']);

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  user.profileImage = profileImage;
  await user.save();

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        profileImage: user.profileImage
      }
    },
    message: 'Profile image updated successfully'
  });
});

/**
 * Update contact information
 */
const updateContactInfo = asyncHandler(async (req, res) => {
  const { phone, address, city, state, zipCode, country } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Validate phone if provided
  if (phone) {
    validatePhone(phone);
    user.phone = sanitizeString(phone);
  }

  // Update other fields
  if (address) user.address = sanitizeString(address);
  if (city) user.city = sanitizeString(city);
  if (state) user.state = sanitizeString(state);
  if (zipCode) user.zipCode = sanitizeString(zipCode);
  if (country) user.country = sanitizeString(country);

  await user.save();

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country
      }
    },
    message: 'Contact information updated successfully'
  });
});

/**
 * Get user activity log
 */
const getUserActivity = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('lastLogin loginCount createdAt updatedAt');
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Calculate account age
  const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  res.json({
    success: true,
    data: {
      activity: {
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        accountCreated: user.createdAt,
        lastUpdated: user.updatedAt,
        accountAgeDays: accountAge
      }
    }
  });
});

/**
 * Delete user account (self-deletion)
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const { password, confirmDelete } = req.body;

  validateRequiredFields({ password, confirmDelete }, ['password', 'confirmDelete']);

  if (confirmDelete !== 'DELETE') {
    throw new AppError('Please type "DELETE" to confirm account deletion', 400, 'INVALID_CONFIRMATION');
  }

  // Find user with password
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Verify password
  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid password', 400, 'INVALID_PASSWORD');
  }

  // Instead of deleting, deactivate the account
  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  user.username = `deleted_${Date.now()}_${user.username}`;
  await user.save();

  res.json({
    success: true,
    message: 'Account has been deactivated successfully'
  });
});

/**
 * Export user data (GDPR compliance)
 */
const exportUserData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('group', 'name description')
    .select('-password -resetPasswordToken -resetPasswordExpire -otp');
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const userData = {
    personalInfo: {
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country
    },
    accountInfo: {
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      group: user.group,
      termsAccepted: user.termsAccepted,
      termsAcceptedAt: user.termsAcceptedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    activityInfo: {
      lastLogin: user.lastLogin,
      loginCount: user.loginCount
    },
    exportInfo: {
      exportedAt: new Date().toISOString(),
      exportedBy: user._id
    }
  };

  res.json({
    success: true,
    data: userData,
    message: 'User data exported successfully'
  });
});

/**
 * Update notification preferences
 */
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { emailNotifications, smsNotifications, pushNotifications } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Initialize preferences if not exists
  if (!user.preferences) {
    user.preferences = {};
  }

  // Update notification preferences
  if (emailNotifications !== undefined) {
    user.preferences.emailNotifications = emailNotifications;
  }
  if (smsNotifications !== undefined) {
    user.preferences.smsNotifications = smsNotifications;
  }
  if (pushNotifications !== undefined) {
    user.preferences.pushNotifications = pushNotifications;
  }

  await user.save();

  res.json({
    success: true,
    data: {
      preferences: user.preferences
    },
    message: 'Notification preferences updated successfully'
  });
});

module.exports = {
  getDetailedProfile,
  updateProfileImage,
  updateContactInfo,
  getUserActivity,
  deleteAccount,
  exportUserData,
  updateNotificationPreferences
};