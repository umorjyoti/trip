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

// Public batch details route (must come before :id route)
router.get('/batches/:batchId', trekController.getBatchById);

// Weekend getaway routes - MUST come before general :id route
router.get('/weekend-getaways', (req, res, next) => {
  console.log('Weekend getaways route matched!');
  next();
}, trekController.getWeekendGetaways);
router.get('/weekend-getaways/galleries', trekController.getWeekendGetawayGalleries);
router.get('/weekend-getaways/blogs', trekController.getWeekendGetawayBlogs);
router.get('/weekend-getaways/activities', trekController.getWeekendGetawayActivities);
router.get('/weekend-getaways/:id/details', trekController.getWeekendGetawayDetails);

router.get('/by-region/:regionId', trekController.getTreksByExactRegion);

// Weekend getaway toggle route - keep this before the general ID route
router.put('/weekend-getaway/:id', [protect, admin], trekController.toggleWeekendGetaway);
router.put('/weekend-getaways/:id/gallery', protect, admin, trekController.updateWeekendGetawayGallery);

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
router.patch('/:id/batches/:batchId', protect, admin, trekController.updateBatch);
// router.put('/:id/batches/:batchId', protect, admin, trekController.updateBatch);
// router.delete('/:id/batches/:batchId', protect, admin, trekController.deleteBatch);

module.exports = router; 