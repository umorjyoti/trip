const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

// Temporary storage for pending registrations (in production, use Redis)
const pendingRegistrations = new Map();

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
    const { username, name, email, password, phone } = req.body;
    
    // Check if user already exists in database
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        message: 'An account with this email already exists. Please try logging in instead.' 
      });
    }

    // Check if username already exists in database
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ 
        message: 'This username is already taken. Please choose a different username.' 
      });
    }

    // Check if email is already in pending registrations
    if (pendingRegistrations.has(email)) {
      return res.status(400).json({ 
        message: 'Registration already in progress for this email. Please check your email for OTP.' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store registration data temporarily
    const registrationData = {
      username,
      name,
      email,
      password,
      phone,
      otp,
      expiresAt,
      createdAt: new Date()
    };
    
    pendingRegistrations.set(email, registrationData);
    
    // Clean up expired registrations
    setTimeout(() => {
      if (pendingRegistrations.has(email)) {
        pendingRegistrations.delete(email);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    console.log(`Register OTP for ${email}:`, otp);
    
    // Send OTP email
    await sendOtpEmail({ email, name }, otp);
    
    res.status(201).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: email
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'email') {
        return res.status(400).json({ 
          message: 'An account with this email already exists. Please try logging in instead.' 
        });
      } else if (field === 'username') {
        return res.status(400).json({ 
          message: 'This username is already taken. Please choose a different username.' 
        });
      }
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP for registration
exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Get registration data from temporary storage
    const registrationData = pendingRegistrations.get(email);
    
    if (!registrationData) {
      return res.status(400).json({ message: 'Registration not found or expired. Please register again.' });
    }
    
    if (registrationData.expiresAt < new Date()) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ message: 'OTP expired. Please register again.' });
    }
    
    if (registrationData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    
    // OTP is valid, create user in database
    const user = await User.create({
      username: registrationData.username,
      name: registrationData.name,
      email: registrationData.email,
      password: registrationData.password,
      phone: registrationData.phone,
      role: 'user',
      isVerified: true
    });
    
    // Remove from pending registrations
    pendingRegistrations.delete(email);
    
    // Send successful registration email
    await sendEmail({
      to: user.email,
      subject: '🎉 Welcome to Trek Adventures - Registration Successful!',
      text: `Hi ${user.name || user.username},

🎉 CONGRATULATIONS! Your registration is complete!

Welcome to Trek Adventures - your gateway to amazing outdoor experiences and unforgettable adventures.

ACCOUNT DETAILS:
Username: ${user.username}
Email: ${user.email}
Status: Verified ✅

WHAT'S NEXT?
1. Explore our exciting trek destinations
2. Book your first adventure
3. Join our community of outdoor enthusiasts
4. Stay updated with our latest offers and events

GETTING STARTED:
• Browse our trek catalog to find your perfect adventure
• Check out our upcoming batches and availability
• Read trek reviews and experiences from fellow adventurers
• Follow us on social media for updates and inspiration

SAFETY & SUPPORT:
• All our treks are led by experienced guides
• Safety equipment is provided for all activities
• 24/7 support available for any questions
• Emergency contact information provided before each trek

We're excited to have you join our community of adventure seekers!

Happy Trekking!
The Trek Adventures Team

---
Need help? Contact our support team anytime.
This is an automated message. Please do not reply to this email.`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Trek Adventures!</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 18px;
        }
        .success-banner {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        .section-title {
            font-weight: bold;
            color: #10b981;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .info-list {
            list-style: none;
            padding: 0;
        }
        .info-list li {
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
        }
        .info-list li:last-child {
            border-bottom: none;
        }
        .info-list li:before {
            content: "✅";
            margin-right: 10px;
            font-size: 16px;
        }
        .account-details {
            background-color: #e0f2fe;
            border: 1px solid #0284c7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 5px;
        }
        .btn:hover {
            background-color: #059669;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏔️ Trek Adventures</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <div class="success-banner">
            <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Trek Adventures!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your registration is complete and you're ready to start your journey!</p>
        </div>

        <h2>Hi ${user.name || user.username},</h2>
        
        <p>Welcome to Trek Adventures - your gateway to amazing outdoor experiences and unforgettable adventures. We're thrilled to have you join our community of adventure seekers!</p>

        <div class="account-details">
            <div class="section-title">📋 Account Details</div>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">✅ Verified</span></p>
        </div>

        <div class="section">
            <div class="section-title">🚀 What's Next?</div>
            <ul class="info-list">
                <li>Explore our exciting trek destinations</li>
                <li>Book your first adventure</li>
                <li>Join our community of outdoor enthusiasts</li>
                <li>Stay updated with our latest offers and events</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">🎯 Getting Started</div>
            <ul class="info-list">
                <li>Browse our trek catalog to find your perfect adventure</li>
                <li>Check out our upcoming batches and availability</li>
                <li>Read trek reviews and experiences from fellow adventurers</li>
                <li>Follow us on social media for updates and inspiration</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">🛡️ Safety & Support</div>
            <ul class="info-list">
                <li>All our treks are led by experienced guides</li>
                <li>Safety equipment is provided for all activities</li>
                <li>24/7 support available for any questions</li>
                <li>Emergency contact information provided before each trek</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="#" class="btn">Explore Treks</a>
            <a href="#" class="btn">View Profile</a>
        </div>

        <p style="text-align: center; font-size: 18px; color: #10b981; margin: 30px 0;">
            🏔️ We're excited to have you join our community of adventure seekers!
        </p>

        <div class="footer">
            <p><strong>Happy Trekking!</strong><br>
            The Trek Adventures Team</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #9ca3af;">
                Need help? Contact our support team anytime.<br>
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>`
    });
    
    // Generate JWT token
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
        role: userObj.role,
        isVerified: userObj.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'email') {
        return res.status(400).json({ 
          message: 'An account with this email already exists. Please try logging in instead.' 
        });
      } else if (field === 'username') {
        return res.status(400).json({ 
          message: 'This username is already taken. Please choose a different username.' 
        });
      }
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Resend OTP for registration
exports.resendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Get registration data from temporary storage
    const registrationData = pendingRegistrations.get(email);
    
    if (!registrationData) {
      return res.status(404).json({ message: 'Registration not found. Please register again.' });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Update registration data with new OTP
    registrationData.otp = otp;
    registrationData.expiresAt = expiresAt;
    pendingRegistrations.set(email, registrationData);
    
    // Clean up expired registrations
    setTimeout(() => {
      if (pendingRegistrations.has(email)) {
        pendingRegistrations.delete(email);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    console.log(`Resend Register OTP for ${email}:`, otp);
    
    // Send OTP email
    await sendOtpEmail({ email, name: registrationData.name }, otp);
    
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user (OTP only for unverified users)
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
    
    // If user is not verified, require OTP verification
    if (!user.isVerified) {
      // Generate OTP and save
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      console.log(`Login OTP for unverified user ${email}:`, otp);
      user.otp = { code: otp, expiresAt };
      await user.save();
      await sendOtpEmail(user, otp);
      res.json({
        message: 'OTP sent to your email. Please verify to login.',
        userId: user._id,
        requiresOtp: true
      });
      return;
    }
    
    // For verified users, login directly without OTP
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
        profileImage: user.profileImage,
        isVerified: user.isVerified
      },
      requiresOtp: false
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
  const userName = user.name || user.username || 'there';
  const isRegistration = !user._id; // If no _id, it's a registration OTP
  
  const emailSubject = isRegistration 
    ? 'Complete Your Registration - Verify Your Email' 
    : 'Secure Login - Your Verification Code';
  
  const emailContent = `
Dear ${userName},

${isRegistration ? 
  'Thank you for choosing to join our trekking community! To complete your registration, please verify your email address.' :
  'You\'ve requested to log in to your account. To ensure your security, please use the verification code below.'
}

🔐 YOUR VERIFICATION CODE:
${otp}

⏰ VALIDITY:
This code will expire in 10 minutes for security reasons.

📱 HOW TO USE:
1. Copy the 6-digit code above
2. Enter it in the verification page
3. Complete your ${isRegistration ? 'registration' : 'login'} process

🔒 SECURITY REMINDERS:
• Never share this code with anyone
• Our team will never ask for this code via phone or email
• If you didn't request this code, please ignore this email
• For security, this code can only be used once

❓ NEED HELP?
If you're having trouble:
• Check your spam/junk folder
• Ensure you're using the correct email address
• Contact our support team if issues persist

⏳ EXPIRY NOTICE:
This verification code expires in 10 minutes. If it expires, you can request a new one.

${isRegistration ? 
  'Welcome to our trekking community! We\'re excited to have you join us for amazing adventures.' :
  'Thank you for using our secure login system. We\'re committed to keeping your account safe.'
}

Best regards,
The Trek Team
Your Adventure Awaits!

---
This is an automated message. Please do not reply to this email.
For support, contact us through our website or mobile app.
  `;

  // HTML version for better visual appeal
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailSubject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .otp-container {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .otp-code {
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        .section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        .section-title {
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .info-list {
            list-style: none;
            padding: 0;
        }
        .info-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-list li:last-child {
            border-bottom: none;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 5px;
        }
        .btn:hover {
            background-color: #059669;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .otp-code {
                font-size: 36px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏔️ Trek Adventures</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <h2>Dear ${userName},</h2>
        
        <p>${isRegistration ? 
          'Thank you for choosing to join our trekking community! To complete your registration, please verify your email address.' :
          'You\'ve requested to log in to your account. To ensure your security, please use the verification code below.'
        }</p>

        <div class="otp-container">
            <div class="section-title">🔐 YOUR VERIFICATION CODE</div>
            <div class="otp-code">${otp}</div>
            <p><strong>⏰ Valid for 10 minutes</strong></p>
        </div>

        <div class="section">
            <div class="section-title">📱 How to Use</div>
            <ol>
                <li>Copy the 6-digit code above</li>
                <li>Enter it in the verification page</li>
                <li>Complete your ${isRegistration ? 'registration' : 'login'} process</li>
            </ol>
        </div>

        <div class="section">
            <div class="section-title">🔒 Security Reminders</div>
            <ul class="info-list">
                <li>✅ Never share this code with anyone</li>
                <li>✅ Our team will never ask for this code via phone or email</li>
                <li>✅ If you didn't request this code, please ignore this email</li>
                <li>✅ For security, this code can only be used once</li>
            </ul>
        </div>

        <div class="warning">
            <strong>⏳ Expiry Notice:</strong> This verification code expires in 10 minutes. If it expires, you can request a new one.
        </div>

        <div class="section">
            <div class="section-title">❓ Need Help?</div>
            <p>If you're having trouble:</p>
            <ul class="info-list">
                <li>📧 Check your spam/junk folder</li>
                <li>📧 Ensure you're using the correct email address</li>
                <li>📧 Contact our support team if issues persist</li>
            </ul>
        </div>

        <p style="text-align: center; font-size: 18px; color: #10b981; margin: 30px 0;">
            ${isRegistration ? 
              '🎉 Welcome to our trekking community! We\'re excited to have you join us for amazing adventures.' :
              '🔐 Thank you for using our secure login system. We\'re committed to keeping your account safe.'
            }
        </p>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Trek Team<br>
            Your Adventure Awaits!</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #9ca3af;">
                This is an automated message. Please do not reply to this email.<br>
                For support, contact us through our website or mobile app.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  await sendEmail({
    to: user.email,
    subject: emailSubject,
    text: emailContent,
    html: htmlContent
  });
}

// Helper to send welcome email for Google registrations
async function sendWelcomeEmail(user) {
  const userName = user.name || user.username || 'there';
  
  const emailSubject = 'Welcome to Trek Adventures - Your Account is Ready!';
  
  const emailContent = `
Dear ${userName},

🎉 Welcome to Trek Adventures! Your account has been successfully created and verified.

Your account details:
• Name: ${user.name}
• Email: ${user.email}
• Username: ${user.username}

🔐 ACCOUNT STATUS:
✅ Email verified
✅ Account activated
✅ Ready to book treks

🚀 GET STARTED:
1. Browse our amazing trek destinations
2. Book your first adventure
3. Join our community of trekkers

📱 FEATURES AVAILABLE:
• Book treks and adventures
• Manage your bookings
• View trek details and itineraries
• Access exclusive offers
• Join our community

🔒 SECURITY:
Your account is secured with Google authentication. You can sign in anytime using your Google account.

❓ NEED HELP?
If you have any questions or need assistance:
• Visit our website
• Contact our support team
• Check our FAQ section

🎯 NEXT STEPS:
Explore our trek destinations and start planning your next adventure!

Best regards,
The Trek Adventures Team
Your Adventure Awaits!

---
This is an automated message. Please do not reply to this email.
For support, contact us through our website or mobile app.
  `;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Trek Adventures</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 5px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .welcome-section {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .welcome-title {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .account-details {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-item {
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
        }
        .detail-label {
            font-weight: bold;
            color: #374151;
        }
        .detail-value {
            color: #10b981;
        }
        .features-section {
            margin: 25px 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 8px 0;
            padding-left: 25px;
            position: relative;
        }
        .feature-list li:before {
            content: "✅";
            position: absolute;
            left: 0;
            color: #10b981;
        }
        .cta-button {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏔️ Trek Adventures</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <div class="welcome-section">
            <div class="welcome-title">🎉 Welcome to Trek Adventures!</div>
            <p>Your account has been successfully created and verified.</p>
        </div>

        <div class="account-details">
            <div class="section-title">📋 Your Account Details</div>
            <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${user.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${user.email}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Username:</span>
                <span class="detail-value">${user.username}</span>
            </div>
        </div>

        <div class="features-section">
            <div class="section-title">🚀 What You Can Do Now</div>
            <ul class="feature-list">
                <li>Browse our amazing trek destinations</li>
                <li>Book your first adventure</li>
                <li>Manage your bookings</li>
                <li>View trek details and itineraries</li>
                <li>Access exclusive offers</li>
                <li>Join our community of trekkers</li>
            </ul>
        </div>

        <div class="features-section">
            <div class="section-title">🔒 Account Security</div>
            <ul class="feature-list">
                <li>Email verified and account activated</li>
                <li>Secured with Google authentication</li>
                <li>Sign in anytime using your Google account</li>
            </ul>
        </div>

        <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}" class="cta-button">Start Exploring Treks</a>
        </div>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Trek Adventures Team<br>
            Your Adventure Awaits!</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px;">
                This is an automated message. Please do not reply to this email.<br>
                For support, contact us through our website or mobile app.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  await sendEmail({
    to: user.email,
    subject: emailSubject,
    text: emailContent,
    html: htmlContent
  });
}

// Google OAuth callback with direct login (no OTP)
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

    // Check if this is a new user (recently created)
    const isNewUser = !req.user.isVerified || (new Date() - new Date(req.user.createdAt)) < 60000; // Within 1 minute

    // Ensure user is verified (Google users are automatically verified)
    if (!req.user.isVerified) {
      await User.findByIdAndUpdate(req.user._id, { isVerified: true });
    }

    // Send welcome email for new users
    if (isNewUser) {
      try {
        await sendWelcomeEmail(req.user);
        console.log('Welcome email sent to:', req.user.email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the registration if email fails
      }
    }

    // Generate JWT token for direct login
    const token = generateToken(req.user._id);
    
    // Set token in cookie
    sendTokenCookie(res, token);

    // Prepare user data for frontend
    const userObj = req.user.toObject();
    const isAdmin = userObj.role === 'admin' ? true : !!userObj.isAdmin;
    
    const userData = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: isAdmin,
      role: userObj.role,
      group: req.user.group || null,
      username: req.user.username,
      phone: req.user.phone,
      address: req.user.address,
      city: req.user.city,
      state: req.user.state,
      zipCode: req.user.zipCode,
      country: req.user.country,
      profileImage: req.user.profileImage,
      isVerified: true,
      createdAt: req.user.createdAt
    };

    // Encode the data for URL parameter
    const encodedData = encodeURIComponent(JSON.stringify({
      token,
      user: userData,
      isNewUser: isNewUser
    }));

    // Redirect to frontend success page with authentication data
    return res.redirect(`${process.env.FRONTEND_URL}/login/success?data=${encodedData}`);
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

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email address' });
    }
    
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    
    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    // Send email
    await sendPasswordResetEmail(user, resetUrl);
    
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Reset user fields if email fails
    if (error.message.includes('email')) {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }
    
    res.status(500).json({ message: 'Email could not be sent' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    // Generate JWT token
    const jwtToken = generateToken(user._id);
    sendTokenCookie(res, jwtToken);
    
    const userObj = user.toObject();
    const isAdmin = userObj.role === 'admin' ? true : !!userObj.isAdmin;
    
    res.json({
      token: jwtToken,
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
        profileImage: user.profileImage,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send password reset email
async function sendPasswordResetEmail(user, resetUrl) {
  const emailSubject = '🔐 Password Reset Request - Trek Adventures';
  const emailContent = `Hi ${user.name || user.username},

You requested a password reset for your Trek Adventures account.

Please click the link below to reset your password:
${resetUrl}

This link will expire in 10 minutes.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
The Trek Adventures Team`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Trek Adventures</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 18px;
        }
        .reset-banner {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }
        .section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        .section-title {
            font-weight: bold;
            color: #10b981;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .btn {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
            font-size: 16px;
        }
        .btn:hover {
            background-color: #059669;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏔️ Trek Adventures</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <div class="reset-banner">
            <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset Request</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">We received a request to reset your password</p>
        </div>

        <h2>Hi ${user.name || user.username},</h2>
        
        <p>You requested a password reset for your Trek Adventures account. Click the button below to reset your password:</p>

        <div style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
        </div>

        <div class="warning">
            <strong>⚠️ Important:</strong> This link will expire in 10 minutes for security reasons.
        </div>

        <div class="section">
            <div class="section-title">🔒 Security Notice</div>
            <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged and your account is secure.</p>
        </div>

        <div class="section">
            <div class="section-title">💡 Need Help?</div>
            <p>If you're having trouble with the reset link or have any questions, please contact our support team. We're here to help!</p>
        </div>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Trek Adventures Team<br>
            Your Adventure Awaits!</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #9ca3af;">
                This is an automated message. Please do not reply to this email.<br>
                For support, contact us through our website or mobile app.
            </p>
        </div>
    </div>
</body>
</html>`;

  await sendEmail({
    to: user.email,
    subject: emailSubject,
    text: emailContent,
    html: htmlContent
  });
} 