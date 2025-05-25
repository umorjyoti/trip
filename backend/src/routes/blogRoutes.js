const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../../middleware/authMiddleware');
const blogController = require('../controllers/blogController');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/:slug', blogController.getBlogBySlug);

// Protected routes (admin only)
router.get('/admin', protect, admin, blogController.getAdminBlogs);
router.post('/', protect, admin, blogController.createBlog);
router.put('/:id', protect, admin, blogController.updateBlog);
router.delete('/:id', protect, admin, blogController.deleteBlog);
router.post('/upload-image', protect, admin, upload.single('image'), blogController.uploadImage);

module.exports = router; 