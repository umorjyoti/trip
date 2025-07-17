const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../../middleware/authMiddleware');
const blogController = require('../controllers/blogController');

// Configure multer for memory storage with validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// SEO and Feed routes (must come before other routes)
router.get('/sitemap.xml', blogController.getSitemap);
router.get('/robots.txt', blogController.getRobotsTxt);
router.get('/rss.xml', blogController.getRSSFeed);

// Protected routes (admin only)
router.get('/admin', protect, admin, blogController.getAdminBlogs);
router.get('/admin/:id', protect, admin, blogController.getAdminBlog);
router.post('/', protect, admin, blogController.createBlog);
router.put('/:id', protect, admin, blogController.updateBlog);
router.delete('/:id', protect, admin, blogController.deleteBlog);
router.post('/upload-image', protect, admin, upload.single('image'), handleMulterError, blogController.uploadImage);

// Public routes (must come after admin routes to prevent conflicts)
router.get('/', blogController.getAllBlogs);
router.get('/region/:regionId', blogController.getBlogsByRegion);
router.get('/:slug', blogController.getBlogBySlug);

module.exports = router; 