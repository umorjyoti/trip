const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserGroup,
  deactivateUser,
  activateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

const { verifyToken, requireAdmin } = require('../../shared');

/**
 * @route   GET /users
 * @desc    Get all users with pagination and filtering
 * @access  Admin
 */
router.get('/', verifyToken, requireAdmin, getUsers);

/**
 * @route   GET /users/stats
 * @desc    Get user statistics
 * @access  Admin
 */
router.get('/stats', verifyToken, requireAdmin, getUserStats);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Private (own profile) / Admin (any profile)
 */
router.get('/:id', verifyToken, getUserById);

/**
 * @route   PUT /users/:id
 * @desc    Update user profile
 * @access  Private (own profile) / Admin (any profile)
 */
router.put('/:id', verifyToken, updateUser);

/**
 * @route   PATCH /users/:id/role
 * @desc    Update user role
 * @access  Admin
 */
router.patch('/:id/role', verifyToken, requireAdmin, updateUserRole);

/**
 * @route   PATCH /users/:id/group
 * @desc    Update user group
 * @access  Admin
 */
router.patch('/:id/group', verifyToken, requireAdmin, updateUserGroup);

/**
 * @route   PATCH /users/:id/deactivate
 * @desc    Deactivate user
 * @access  Admin
 */
router.patch('/:id/deactivate', verifyToken, requireAdmin, deactivateUser);

/**
 * @route   PATCH /users/:id/activate
 * @desc    Activate user
 * @access  Admin
 */
router.patch('/:id/activate', verifyToken, requireAdmin, activateUser);

/**
 * @route   DELETE /users/:id
 * @desc    Delete user
 * @access  Admin
 */
router.delete('/:id', verifyToken, requireAdmin, deleteUser);

module.exports = router;