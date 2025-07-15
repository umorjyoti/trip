const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { checkPermission, checkMultiplePermissions } = require('../middleware/checkPermissions');
const userController = require('../controllers/userController');

// Get all users (admin or users with users section permission)
router.get('/', 
  protect, 
  checkPermission('sections', 'users'), 
  userController.getAllUsers
);

// Get all admins (admin only) - MUST be before /:id route
router.get('/admins', 
  protect, 
  checkPermission('quickActions', 'manageTeam'), 
  userController.getAdmins
);

// Get user by ID (admin or users with users section permission)
router.get('/:id', 
  protect, 
  checkPermission('sections', 'users'), 
  userController.getUserById
);

// Update user role (admin only)
router.patch('/:id/role', 
  protect, 
  checkPermission('quickActions', 'manageUsers'), 
  userController.updateUserRole
);

// Update user group (admin only)
router.put('/:id/group', 
  protect, 
  checkPermission('quickActions', 'manageUsers'), 
  userController.updateUserGroupAssignment
);

// Get all user groups (admin or users with users section permission)
router.get('/groups/all', 
  protect, 
  checkPermission('sections', 'users'), 
  userController.getAllUserGroups
);

// Get single user group (admin or users with users section permission)
router.get('/groups/:id', 
  protect, 
  checkPermission('sections', 'users'), 
  userController.getUserGroup
);

// Create user group (admin only)
router.post('/groups', 
  protect, 
  checkPermission('quickActions', 'manageUsers'), 
  userController.createUserGroup
);

// Update user group (admin only)
router.put('/groups/:id', 
  protect, 
  checkPermission('quickActions', 'manageUsers'), 
  userController.updateUserGroup
);

// Delete user group (admin only)
router.delete('/groups/:id', 
  protect, 
  checkPermission('quickActions', 'manageUsers'), 
  userController.deleteUserGroup
);



module.exports = router; 