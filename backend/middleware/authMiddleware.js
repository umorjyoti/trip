const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for token in cookies
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token and populate group with permissions
    const user = await User.findById(decoded.id)
      .populate({
        path: 'group',
        select: 'name permissions'
      });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Create a new user object with the correct isAdmin value
    const userObj = user.toObject();
    
    // Always prioritize role field for admin check
    if (userObj.role === 'admin') {
      userObj.isAdmin = true;
    }

    req.user = userObj;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  // Prioritize role field for admin check
  if (req.user.role === 'admin' || req.user.isAdmin === true) {
    next();
  } else {
    console.log('Admin check failed for user:', {
      id: req.user._id,
      role: req.user.role,
      isAdmin: req.user.isAdmin
    });
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
}; 