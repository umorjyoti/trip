const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { protect, admin } = require('../middleware/authMiddleware');
const { checkDashboardAccess } = require('../middleware/checkPermissions');

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Stats routes are working' });
});

// Admin only routes
router.get('/sales', protect, admin, statsController.getSalesStats);

// Public test route for debugging
router.get('/sales-test', statsController.getSalesStats);

// Dashboard route with new middleware
router.get('/dashboard', protect, checkDashboardAccess, statsController.getDashboardStats);

module.exports = router; 