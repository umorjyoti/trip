const express = require('express');
const router = express.Router();
const {
  getUserGroups,
  getUserGroupById,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  addPermissionToGroup,
  removePermissionFromGroup,
  getDefaultPermissions
} = require('../controllers/groupController');

const { verifyToken, requireAdmin } = require('../../shared');

/**
 * @route   GET /groups
 * @desc    Get all user groups with pagination
 * @access  Admin
 */
router.get('/', verifyToken, requireAdmin, getUserGroups);

/**
 * @route   GET /groups/permissions/:type
 * @desc    Get default permissions for group type
 * @access  Admin
 */
router.get('/permissions/:type', verifyToken, requireAdmin, getDefaultPermissions);

/**
 * @route   GET /groups/:id
 * @desc    Get user group by ID
 * @access  Admin
 */
router.get('/:id', verifyToken, requireAdmin, getUserGroupById);

/**
 * @route   POST /groups
 * @desc    Create new user group
 * @access  Admin
 */
router.post('/', verifyToken, requireAdmin, createUserGroup);

/**
 * @route   PUT /groups/:id
 * @desc    Update user group
 * @access  Admin
 */
router.put('/:id', verifyToken, requireAdmin, updateUserGroup);

/**
 * @route   DELETE /groups/:id
 * @desc    Delete user group
 * @access  Admin
 */
router.delete('/:id', verifyToken, requireAdmin, deleteUserGroup);

/**
 * @route   POST /groups/:id/permissions
 * @desc    Add permission to group
 * @access  Admin
 */
router.post('/:id/permissions', verifyToken, requireAdmin, addPermissionToGroup);

/**
 * @route   DELETE /groups/:id/permissions
 * @desc    Remove permission from group
 * @access  Admin
 */
router.delete('/:id/permissions', verifyToken, requireAdmin, removePermissionFromGroup);

module.exports = router;