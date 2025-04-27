const express = require('express');
const router = express.Router();
const trekController = require('../controllers/trekController');
const { protect, admin } = require('../middleware/authMiddleware');

// Add this before your routes
router.use((req, res, next) => {
  console.log(`Trek route requested: ${req.method} ${req.originalUrl}`);
  next();
});

// Public routes - ORDER IS CRITICAL
router.get('/stats', trekController.getTrekStats);
router.get('/all', trekController.getAllTreks);

// Make the weekend-getaways path more explicit with a prefix
router.get('/weekend-getaways', (req, res, next) => {
  console.log('Weekend getaways route matched!');
  next();
}, trekController.getWeekendGetaways);
router.get('/by-region/:regionId', trekController.getTreksByExactRegion);

// Weekend getaway toggle route - keep this before the general ID route
router.put('/weekend-getaway/:id', [protect, admin], trekController.toggleWeekendGetaway);

// General routes - these should come AFTER more specific routes
router.get('/:id', (req, res, next) => {
  console.log(`ID route matched with id: ${req.params.id}`);
  next();
}, trekController.getTrekById);
router.get('/', trekController.getTreks);

// Protected routes
router.post('/', protect, admin, trekController.createTrek);
router.put('/:id', protect, admin, trekController.updateTrek);
router.delete('/:id', protect, admin, trekController.deleteTrek);

// Batch routes
router.post('/:id/batches', protect, admin, trekController.addBatch);
// router.put('/:id/batches/:batchId', protect, admin, trekController.updateBatch);
// router.delete('/:id/batches/:batchId', protect, admin, trekController.deleteBatch);

// Weekend getaway specific routes
router.get('/weekend-getaways/:id/details', trekController.getWeekendGetawayDetails);
router.get('/weekend-getaways/galleries', trekController.getWeekendGetawayGalleries);
router.get('/weekend-getaways/blogs', trekController.getWeekendGetawayBlogs);
router.get('/weekend-getaways/activities', trekController.getWeekendGetawayActivities);
router.put('/weekend-getaways/:id/gallery', protect, admin, trekController.updateWeekendGetawayGallery);

module.exports = router; 