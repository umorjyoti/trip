const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};


// Set cookie with JWT token
const sendTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax'
  };
  
  res.cookie('jwt', token, cookieOptions);
};

// Register a new user
exports.register = async (req, res) => {
  try {
    console.log(req.body)
    const { username, name, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = await User.create({
      username, 
      name,
      email,
      password,
      role: 'user' // Default role
    });
    
    if (user) {
      // Generate token
      const token = generateToken(user._id);
      
      // Set cookie
      sendTokenCookie(res, token);

      const userObj = user.toObject();
      
      // Return user data
      res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: false, // New users are not admins by default
          role: userObj.role
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });

    // Check if user exists and populate group
    const user = await User.findOne({ email }).populate('group');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Set cookie
    sendTokenCookie(res, token);

    // Always prioritize role field for admin check
    const userObj = user.toObject();
    const isAdmin = userObj.role === 'admin' ? true : !!userObj.isAdmin;
    
    console.log('User login successful:', {
      _id: user._id,
      email: user.email,
      role: userObj.role,
      isAdmin: isAdmin,
      group: user.group
    });

    // Return user data with isAdmin field and group
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
    console.error('Login error:', error);
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
    // Clear the JWT cookie
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
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