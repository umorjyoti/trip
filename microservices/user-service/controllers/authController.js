const axios = require('axios');
const { User } = require('../models');
const {
  AppError,
  asyncHandler,
  validateRequiredFields,
  validateEmail,
  validatePassword,
  sanitizeString,
  generateToken,
  setTokenCookie
} = require('../../shared');

/**
 * Send OTP via Notification Service
 */
const sendOTP = async (email, otp, type = 'login') => {
  try {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL;
    if (!notificationServiceUrl) {
      throw new Error('Notification service URL not configured');
    }

    await axios.post(`${notificationServiceUrl}/send-otp`, {
      email,
      otp,
      type
    });
  } catch (error) {
    console.error('Failed to send OTP:', error.message);
    // Don't throw error to prevent blocking user registration/login
    // In production, you might want to implement retry logic
  }
};

/**
 * Register new user
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, username, password, termsAccepted } = req.body;

  // Validate required fields
  validateRequiredFields({ name, email, username, password }, ['name', 'email', 'username', 'password']);
  
  // Validate email format
  validateEmail(email);
  
  // Validate password strength
  validatePassword(password);

  // Check terms acceptance
  if (!termsAccepted) {
    throw new AppError('You must accept the terms and conditions', 400, 'TERMS_NOT_ACCEPTED');
  }

  // Sanitize inputs
  const sanitizedData = {
    name: sanitizeString(name),
    email: email.toLowerCase().trim(),
    username: sanitizeString(username),
    password,
    termsAccepted: true,
    termsAcceptedAt: new Date()
  };

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: sanitizedData.email },
      { username: sanitizedData.username }
    ]
  });

  if (existingUser) {
    if (existingUser.email === sanitizedData.email) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    } else {
      throw new AppError('Username already taken', 409, 'USERNAME_EXISTS');
    }
  }

  // Create user
  const user = await User.create(sanitizedData);

  // Generate OTP for email verification
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  await sendOTP(user.email, otp, 'registration');

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email with the OTP sent.',
    data: {
      userId: user._id,
      email: user.email,
      otpSent: true
    }
  });
});

/**
 * Verify registration OTP
 */
const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  validateRequiredFields({ email, otp }, ['email', 'otp']);
  validateEmail(email);

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Verify OTP
  if (!user.verifyOTP(otp)) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  // Mark user as verified and clear OTP
  user.isVerified = true;
  user.clearOTP();
  user.updateLoginInfo();
  await user.save();

  // Generate JWT token
  const token = generateToken(user);

  // Set cookie
  setTokenCookie(res, token);

  res.json({
    success: true,
    message: 'Email verified successfully. You are now logged in.',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isAdmin: user.isAdminUser,
        isVerified: user.isVerified
      }
    }
  });
});

/**
 * Resend registration OTP
 */
const resendRegisterOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  validateRequiredFields({ email }, ['email']);
  validateEmail(email);

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Check if user is already verified
  if (user.isVerified) {
    throw new AppError('User is already verified', 400, 'ALREADY_VERIFIED');
  }

  // Generate new OTP
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  await sendOTP(user.email, otp, 'registration');

  res.json({
    success: true,
    message: 'OTP resent successfully',
    data: {
      otpSent: true
    }
  });
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  validateRequiredFields({ email, password }, ['email', 'password']);
  validateEmail(email);

  // Find user by email and include password
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact support.', 401, 'ACCOUNT_DEACTIVATED');
  }

  // Check password
  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Generate OTP for login verification
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  await sendOTP(user.email, otp, 'login');

  res.json({
    success: true,
    message: 'OTP sent to your email. Please verify to complete login.',
    data: {
      userId: user._id,
      email: user.email,
      otpSent: true
    }
  });
});

/**
 * Verify login OTP
 */
const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  validateRequiredFields({ email, otp }, ['email', 'otp']);
  validateEmail(email);

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact support.', 401, 'ACCOUNT_DEACTIVATED');
  }

  // Verify OTP
  if (!user.verifyOTP(otp)) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  // Clear OTP and update login info
  user.clearOTP();
  user.updateLoginInfo();
  await user.save();

  // Generate JWT token
  const token = generateToken(user);

  // Set cookie
  setTokenCookie(res, token);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isAdmin: user.isAdminUser,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      }
    }
  });
});

/**
 * Resend login OTP
 */
const resendLoginOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  validateRequiredFields({ email }, ['email']);
  validateEmail(email);

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact support.', 401, 'ACCOUNT_DEACTIVATED');
  }

  // Generate new OTP
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  await sendOTP(user.email, otp, 'login');

  res.json({
    success: true,
    message: 'OTP resent successfully',
    data: {
      otpSent: true
    }
  });
});

/**
 * Generic OTP verification (for backward compatibility)
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  validateRequiredFields({ email, otp }, ['email', 'otp']);
  validateEmail(email);

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Verify OTP
  if (!user.verifyOTP(otp)) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  // Clear OTP and update login info
  user.clearOTP();
  user.updateLoginInfo();
  
  // Mark as verified if not already
  if (!user.isVerified) {
    user.isVerified = true;
  }
  
  await user.save();

  // Generate JWT token
  const token = generateToken(user);

  // Set cookie
  setTokenCookie(res, token);

  res.json({
    success: true,
    message: 'OTP verified successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isAdmin: user.isAdminUser,
        isVerified: user.isVerified
      }
    }
  });
});

/**
 * Generic resend OTP (for backward compatibility)
 */
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  validateRequiredFields({ email }, ['email']);
  validateEmail(email);

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Generate new OTP
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  await sendOTP(user.email, otp, 'verification');

  res.json({
    success: true,
    message: 'OTP resent successfully',
    data: {
      otpSent: true
    }
  });
});

/**
 * Get current user
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  // User is already attached to req by verifyToken middleware
  const user = await User.findById(req.user.id).populate('group', 'name description permissions');
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

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
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * Update user profile
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    address,
    city,
    state,
    zipCode,
    country,
    profileImage,
    currentPassword,
    newPassword
  } = req.body;

  // Find user
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Handle password update
  if (currentPassword && newPassword) {
    // Verify current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
    }

    // Validate new password
    validatePassword(newPassword);
    user.password = newPassword;
  }

  // Update profile fields
  if (name) user.name = sanitizeString(name);
  if (phone) user.phone = sanitizeString(phone);
  if (address) user.address = sanitizeString(address);
  if (city) user.city = sanitizeString(city);
  if (state) user.state = sanitizeString(state);
  if (zipCode) user.zipCode = sanitizeString(zipCode);
  if (country) user.country = sanitizeString(country);
  if (profileImage) user.profileImage = profileImage;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        profileImage: user.profileImage
      }
    }
  });
});

/**
 * Forgot password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  validateRequiredFields({ email }, ['email']);
  validateEmail(email);

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    // Don't reveal if email exists or not for security
    return res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();
  await user.save();

  // Send reset email via notification service
  try {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL;
    if (notificationServiceUrl) {
      await axios.post(`${notificationServiceUrl}/send-password-reset`, {
        email: user.email,
        resetToken,
        name: user.name
      });
    }
  } catch (error) {
    console.error('Failed to send password reset email:', error.message);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    throw new AppError('Failed to send password reset email', 500, 'EMAIL_SEND_FAILED');
  }

  res.json({
    success: true,
    message: 'Password reset email sent successfully'
  });
});

/**
 * Reset password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  validateRequiredFields({ token, password }, ['token', 'password']);
  validatePassword(password);

  // Hash the token to match stored version
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by reset token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.updateLoginInfo();
  await user.save();

  // Generate JWT token
  const jwtToken = generateToken(user);

  // Set cookie
  setTokenCookie(res, jwtToken);

  res.json({
    success: true,
    message: 'Password reset successful. You are now logged in.',
    data: {
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isAdmin: user.isAdminUser
      }
    }
  });
});

/**
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  // Clear JWT cookie
  res.cookie('jwt', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Get all users (admin only)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role, isActive } = req.query;
  
  // Validate pagination
  const { validatePagination } = require('../../shared');
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
 * Update user role (admin only)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  const { validateObjectId } = require('../../shared');
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

module.exports = {
  register,
  verifyRegisterOtp,
  resendRegisterOtp,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  verifyOtp,
  resendOtp,
  getCurrentUser,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  logout,
  getUsers,
  updateUserRole
};