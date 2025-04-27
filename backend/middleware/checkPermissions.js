const User = require('../models/User');
const UserGroup = require('../models/UserGroup');

const checkPermission = (permissionCategory, permissionName) => {
  return async (req, res, next) => {
    try {
      // Get user with populated group
      const user = await User.findById(req.user._id).populate('group');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Allow access if user is admin
      if (user.role === 'admin') {
        return next();
      }

      // If user has no group, deny access
      if (!user.group) {
        return res.status(403).json({ message: 'Access denied. No user group assigned.' });
      }

      // Check if the user's group has the required permission
      const hasPermission = user.group.permissions?.[permissionCategory]?.[permissionName];

      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Access denied. Your user group does not have the required permissions.',
          requiredPermission: `${permissionCategory}.${permissionName}`,
          currentGroup: user.group.name
        });
      }

      // Add user's permissions to the request object for use in controllers
      req.userPermissions = user.group.permissions;

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

// Helper function to check multiple permissions
const checkMultiplePermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      // Get user with populated group
      const user = await User.findById(req.user._id).populate('group');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Allow access if user is admin
      if (user.role === 'admin') {
        return next();
      }

      // If user has no group, deny access
      if (!user.group) {
        return res.status(403).json({ message: 'Access denied. No user group assigned.' });
      }

      // Check if user has any of the required permissions
      const hasAnyPermission = permissions.some(({ category, name }) => 
        user.group.permissions?.[category]?.[name]
      );

      if (!hasAnyPermission) {
        return res.status(403).json({ 
          message: 'Access denied. Your user group does not have any of the required permissions.',
          requiredPermissions: permissions.map(p => `${p.category}.${p.name}`),
          currentGroup: user.group.name
        });
      }

      // Add user's permissions to the request object for use in controllers
      req.userPermissions = user.group.permissions;

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

// Special middleware for dashboard access
const checkDashboardAccess = async (req, res, next) => {
  try {
    // Get user with populated group
    const user = await User.findById(req.user._id).populate('group');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow access if user is admin
    if (user.role === 'admin') {
      return next();
    }

    // For non-admin users, check if they have any dashboard-related permissions
    const hasDashboardAccess = user.group?.permissions?.stats || user.group?.permissions?.actions;

    if (!hasDashboardAccess) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission to access the dashboard.',
        currentGroup: user.group?.name
      });
    }

    // Add user's permissions to the request object for use in controllers
    req.userPermissions = user.group.permissions;

    next();
  } catch (error) {
    console.error('Dashboard access check error:', error);
    res.status(500).json({ message: 'Error checking dashboard access' });
  }
};

module.exports = {
  checkPermission,
  checkMultiplePermissions,
  checkDashboardAccess
}; 