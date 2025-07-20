const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes (protected)
router.get('/', [protect, admin], settingsController.getSettings);
router.put('/', [protect, admin], settingsController.updateSettings);

// Public route for enquiry banner settings
router.get('/enquiry-banner', settingsController.getEnquiryBannerSettings);

module.exports = router; 