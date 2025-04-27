const express = require('express');
const router = express.Router();
const userGroupController = require('../controllers/userGroupController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// Get all user groups
router.get('/', userGroupController.getAllUserGroups);

// Get single user group
router.get('/:id', userGroupController.getUserGroup);

// Create user group
router.post('/', userGroupController.createUserGroup);

// Update user group
router.put('/:id', userGroupController.updateUserGroup);

// Delete user group
router.delete('/:id', userGroupController.deleteUserGroup);

// Get users in a group
router.get('/:id/users', userGroupController.getUsersInGroup);

module.exports = router; 