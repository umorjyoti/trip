const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', regionController.getAllRegions);
router.get('/:id', regionController.getRegionById);

// Protected routes
router.post('/', protect, admin, regionController.createRegion);
router.put('/:id', protect, admin, regionController.updateRegion);
router.delete('/:id', protect, admin, regionController.deleteRegion);

module.exports = router; 