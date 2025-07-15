const express = require('express');
const router = express.Router();
const trekController = require('../controllers/trekController');
const { protect, admin } = require('../middleware/authMiddleware');
const { checkPermission, checkMultiplePermissions } = require('../middleware/checkPermissions');
const { sendCustomTrekLink } = require('../controllers/trekController');

// Add this before your routes
router.use((req, res, next) => {
  console.log(`Trek route requested: ${req.method} ${req.originalUrl}`);
  next();
});

// Public routes - ORDER IS CRITICAL
router.get('/stats', trekController.getTrekStats);
router.get('/all', trekController.getAllTreks);
router.get('/by-region/:regionId', trekController.getTreksByExactRegion);

// Weekend getaway routes - MUST come before general :id route
router.get('/weekend-getaways', (req, res, next) => {
  console.log('Weekend getaways route matched!');
  next();
}, trekController.getWeekendGetaways);
router.get('/weekend-getaways/galleries', trekController.getWeekendGetawayGalleries);
router.get('/weekend-getaways/blogs', trekController.getWeekendGetawayBlogs);
router.get('/weekend-getaways/activities', trekController.getWeekendGetawayActivities);
router.get('/weekend-getaways/:id/details', trekController.getWeekendGetawayDetails);

// Custom trek routes - must come before general ID route
router.get('/custom/:token', trekController.getTrekByCustomToken);

// Weekend getaway toggle route - keep this before the general ID route
router.put('/weekend-getaway/:id', [protect, admin], trekController.toggleWeekendGetaway);
router.put('/weekend-getaways/:id/gallery', protect, admin, trekController.updateWeekendGetawayGallery);

// Toggle trek status route - accept both PUT and PATCH
router.put('/:id/toggle-status', [protect, admin], trekController.toggleTrekStatus);
router.patch('/:id/toggle-status', [protect, admin], trekController.toggleTrekStatus);

// Performance route - must come before general ID route
router.get('/:id/performance', [protect, admin], trekController.getTrekPerformance);

// General routes - these should come AFTER more specific routes
router.get('/:id', (req, res, next) => {
  console.log(`ID route matched with id: ${req.params.id}`);
  next();
}, trekController.getTrekById);
router.get('/', trekController.getTreks);

// Protected routes with permission checks
router.post('/', 
  protect, 
  checkPermission('quickActions', 'createTrek'), 
  trekController.createTrek
);

router.put('/:id', 
  protect, 
  checkPermission('sections', 'treks'), 
  trekController.updateTrek
);

router.delete('/:id', 
  protect, 
  checkPermission('sections', 'treks'), 
  trekController.deleteTrek
);

// Batch management with permission checks
router.post('/:id/batches', 
  protect, 
  checkMultiplePermissions([
    { category: 'sections', name: 'treks' },
    { category: 'quickActions', name: 'createBatch' }
  ]), 
  trekController.addBatch
);

router.put('/:id/batches/:batchId', 
  protect, 
  checkMultiplePermissions([
    { category: 'sections', name: 'treks' },
    { category: 'quickActions', name: 'createBatch' }
  ]), 
  trekController.updateBatch
);

router.patch('/:id/batches/:batchId', 
  protect, 
  checkMultiplePermissions([
    { category: 'sections', name: 'treks' },
    { category: 'quickActions', name: 'createBatch' }
  ]), 
  trekController.updateBatch
);

router.delete('/:id/batches/:batchId', 
  protect, 
  checkMultiplePermissions([
    { category: 'sections', name: 'treks' },
    { category: 'quickActions', name: 'createBatch' }
  ]), 
  trekController.removeBatch
);

router.get('/:id/batches/:batchId/performance', 
  protect, 
  checkMultiplePermissions([
    { category: 'sections', name: 'treks' },
    { category: 'quickActions', name: 'createBatch' }
  ]), 
  trekController.getBatchPerformance
);

router.get('/:id/batches/:batchId/export-participants', 
  protect, 
  checkMultiplePermissions([
    { category: 'sections', name: 'treks' },
    { category: 'quickActions', name: 'createBatch' }
  ]), 
  trekController.exportBatchParticipants
);

router.post('/:id/send-custom-link', protect, admin, sendCustomTrekLink);

module.exports = router; 