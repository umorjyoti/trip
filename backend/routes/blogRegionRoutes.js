const express = require('express');
const router = express.Router();
const blogRegionController = require('../controllers/blogRegionController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/enabled', blogRegionController.getEnabledBlogRegions);
router.get('/slug/:slug', blogRegionController.getBlogRegionBySlug);

// Protected routes (admin only)
router.get('/', protect, admin, blogRegionController.getAllBlogRegions);
router.get('/:id', protect, admin, blogRegionController.getBlogRegionById);
router.post('/', protect, admin, blogRegionController.createBlogRegion);
router.put('/:id', protect, admin, blogRegionController.updateBlogRegion);
router.delete('/:id', protect, admin, blogRegionController.deleteBlogRegion);

module.exports = router; 