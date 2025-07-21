const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes (protected)
router.get('/', [protect, admin], settingsController.getSettings);
router.put('/', [protect, admin], settingsController.updateSettings);

// Public route for enquiry banner settings
router.get('/enquiry-banner', settingsController.getEnquiryBannerSettings);

// Public route for landing page settings
router.get('/landing-page', settingsController.getLandingPageSettings);

// Public route for blog page settings
router.get('/blog-page', settingsController.getBlogPageSettings);

// Public route for weekend getaway page settings
router.get('/weekend-getaway-page', settingsController.getWeekendGetawayPageSettings);

// Public route for about page settings
router.get('/about-page', settingsController.getAboutPageSettings);

module.exports = router; 