const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};


// Send JWT token as HTTP-only cookie
const sendTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';

  // In production we often serve the frontend from a different origin
  // (e.g. a separate domain or different port). For the browser to accept
  // the cookie in that cross-site scenario we must:
  //   1. set `Secure` so it's only sent via HTTPS
  //   2. set `SameSite=None` so the cookie can be included in cross-site requests
  // For local development we keep the more permissive defaults so that we
  // can develop over http://localhost without any special setup.
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: isProd, // only transmit over HTTPS in production
    sameSite: isProd ? 'None' : 'Lax'
  };

  res.cookie('jwt', token, cookieOptions);
};

// Register a new user with OTP
exports.register = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    // Check if user already exists
    // const userExists = await User.findOne({ email });
    // if (userExists) {
    //   return res.status(400).json({ message: 'User already exists' });
    // }
    // Create new user (inactive, with OTP)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    console.log(`Register OTP for ${email}:`, otp);
    const user = await User.create({
      username,
      name,
      email,
      password,
      role: 'user',
      otp: { code: otp, expiresAt }
    });
    await sendOtpEmail(user, otp);
    res.status(201).json({
      message: 'OTP sent to your email. Please verify to activate your account.',
      userId: user._id
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP for registration
exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otp.code) {
      return res.status(400).json({ message: 'OTP not found. Please register again.' });
    }
    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    // OTP valid, clear OTP
    user.otp = undefined;
    await user.save();
    // Send successful registration email
    await sendEmail({
      to: user.email,
      subject: 'Registration Successful',
      text: `Hi ${user.name || user.username},\n\nYour registration was successful! Welcome to our platform.\n\nThank you for joining us!`
    });
    const token = generateToken(user._id);
    sendTokenCookie(res, token);
    const userObj = user.toObject();
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: false,
        role: userObj.role
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Resend OTP for registration
exports.resendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otp = { code: otp, expiresAt };
    await user.save();
    await sendOtpEmail(user, otp);
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user with OTP
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password').populate('group');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // Generate OTP and save
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    console.log(`Login OTP for ${email}:`, otp);
    user.otp = { code: otp, expiresAt };
    await user.save();
    await sendOtpEmail(user, otp);
    res.json({
      message: 'OTP sent to your email. Please verify to login.',
      userId: user._id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP for login
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).populate('group');
    if (!user || !user.otp || !user.otp.code) {
      return res.status(400).json({ message: 'OTP not found. Please login again.' });
    }
    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    // OTP valid, clear OTP
    user.otp = undefined;
    await user.save();
    const token = generateToken(user._id);
    sendTokenCookie(res, token);
    const userObj = user.toObject();
    const isAdmin = userObj.role === 'admin' ? true : !!userObj.isAdmin;
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: isAdmin,
        role: userObj.role,
        group: user.group
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Resend OTP for login
exports.resendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otp = { code: otp, expiresAt };
    await user.save();
    await sendOtpEmail(user, otp);
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    console.log('Getting user profile for ID:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'group',
        select: 'name permissions',
        model: 'UserGroup'
      });
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Log raw user data
    console.log('Raw user data:', JSON.stringify(user, null, 2));
    
    // Convert to plain object and check group data
    const userObj = user.toObject();
    console.log('User group data:', userObj.group);
    
    const isAdmin = userObj.role === 'admin' ? true : !!userObj.isAdmin;
    
    // Prepare response data
    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: isAdmin,
      role: user.role,
      group: user.group ? {
        _id: user.group._id,
        name: user.group.name,
        permissions: user.group.permissions
      } : null,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country,
      profileImage: user.profileImage
    };

    // Log final response
    console.log('Sending response:', JSON.stringify(responseData, null, 2));
    
    res.json(responseData);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    // Clear the JWT cookie – we must use the same Site/ Secure attributes that
    // were used when setting the cookie, otherwise some browsers will ignore
    // the delete request.
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax'
    });
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'group',
        select: 'name permissions' // Explicitly select permissions
      });
    
    if (user) {
      // Always prioritize role field for admin check
      const userObj = user.toObject();
      const isAdmin = userObj.role === 'admin' ? true : !!userObj.isAdmin;
      
      console.log('Current user data:', {
        _id: user._id,
        email: user.email,
        role: userObj.role,
        isAdmin: isAdmin,
        group: user.group
      });
      
      // Return user data with isAdmin field and group permissions
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: isAdmin,
        role: userObj.role,
        group: user.group,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        profileImage: user.profileImage
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.city = req.body.city || user.city;
    user.state = req.body.state || user.state;
    user.zipCode = req.body.zipCode || user.zipCode;
    user.country = req.body.country || user.country;
    
    // Update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    // Explicitly check if role is admin and set isAdmin accordingly
    const userObj = updatedUser.toObject();
    const isAdmin = userObj.role === 'admin' ? true : !!userObj.isAdmin;
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: isAdmin,
      role: userObj.role,
      phone: updatedUser.phone,
      address: updatedUser.address,
      city: updatedUser.city,
      state: updatedUser.state,
      zipCode: updatedUser.zipCode,
      country: updatedUser.country,
      profileImage: updatedUser.profileImage
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('group', 'name _id'); // Populate the group field
    
    // Map users to include isAdmin based on role
    const mappedUsers = users.map(user => {
      const userObj = user.toObject();
      userObj.isAdmin = userObj.role === 'admin' ? true : !!userObj.isAdmin;
      return userObj;
    });
    
    res.json(mappedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    // Ensure request body is properly parsed
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const { role } = req.body;
    
    // Validate role exists and is valid
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role value. Role must be either "admin" or "user"',
        received: role
      });
    }
    
    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { 
        new: true, 
        runValidators: true,
        context: 'query' // Ensure validators run in the correct context
      }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return updated user data
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.role === 'admin',
      role: user.role
    });
  } catch (error) {
    console.error('Update user role error:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid user ID format' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
};

// Helper to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to send OTP email
async function sendOtpEmail(user, otp) {
  await sendEmail({
    to: user.email,
    subject: 'Your OTP for Login',
    text: `Your OTP for login is: ${otp}`
  });
}

// Google OAuth callback with OTP
exports.googleCallback = async (req, res) => {
  try {
    console.log('Google callback received:', {
      user: req.user,
      session: req.session,
      headers: req.headers
    });

    if (!req.user) {
      console.error('No user data received from Google');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed&reason=no_user`);
    }

    // Check if email exists
    if (!req.user.email) {
      console.error('No email provided by Google');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed&reason=no_email`);
    }

    // Generate OTP and save to user
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await User.findByIdAndUpdate(req.user._id, {
      otp: { code: otp, expiresAt }
    });
    await sendOtpEmail(req.user, otp);

    // Redirect to frontend for OTP verification with email
    return res.redirect(`${process.env.FRONTEND_URL}/verify-otp?email=${encodeURIComponent(req.user.email)}`);
  } catch (error) {
    console.error('Google callback error:', error);
    let errorReason = 'unknown';
    if (error.name === 'ValidationError') {
      errorReason = 'validation_error';
    } else if (error.name === 'CastError') {
      errorReason = 'invalid_id';
    } else if (error.code === 11000) {
      errorReason = 'duplicate_email';
    }
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed&reason=${errorReason}`);
  }
};

// Verify OTP endpoint
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otp.code) {
      return res.status(400).json({ message: 'OTP not found. Please login again.' });
    }
    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    // OTP valid, clear OTP and log in user
    user.otp = undefined;
    await user.save();
    const token = generateToken(user._id);
    sendTokenCookie(res, token);
    const userObj = user.toObject();
    const isAdmin = userObj.role === 'admin' ? true : !!userObj.isAdmin;
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: isAdmin,
        role: userObj.role,
        group: user.group || null,
        username: user.username,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Resend OTP endpoint
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otp = { code: otp, expiresAt };
    await user.save();
    await sendOtpEmail(user, otp);
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile
exports.getMe = exports.getCurrentUser; 