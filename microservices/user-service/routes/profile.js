const express = require('express');
const router = express.Router();
const {
  getDetailedProfile,
  updateProfileImage,
  updateContactInfo,
  getUserActivity,
  deleteAccount,
  exportUserData,
  updateNotificationPreferences
} = require('../controllers/profileController');

const { verifyToken } = require('../../shared');

/**
 * @route   GET /profile
 * @desc    Get detailed user profile
 * @access  Private
 */
router.get('/', verifyToken, getDetailedProfile);

/**
 * @route   PUT /profile/image
 * @desc    Update profile image
 * @access  Private
 */
router.put('/image', verifyToken, updateProfileImage);

/**
 * @route   PUT /profile/contact
 * @desc    Update contact information
 * @access  Private
 */
router.put('/contact', verifyToken, updateContactInfo);

/**
 * @route   GET /profile/activity
 * @desc    Get user activity log
 * @access  Private
 */
router.get('/activity', verifyToken, getUserActivity);

/**
 * @route   DELETE /profile
 * @desc    Delete user account (self-deletion)
 * @access  Private
 */
router.delete('/', verifyToken, deleteAccount);

/**
 * @route   GET /profile/export
 * @desc    Export user data (GDPR compliance)
 * @access  Private
 */
router.get('/export', verifyToken, exportUserData);

/**
 * @route   PUT /profile/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/preferences', verifyToken, updateNotificationPreferences);

module.exports = router;