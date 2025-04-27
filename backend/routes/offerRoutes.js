const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes
router.get('/', protect, admin, offerController.getAllOffers);
router.post('/', protect, admin, offerController.createOffer);
router.put('/:id', protect, admin, offerController.updateOffer);
router.delete('/:id', protect, admin, offerController.deleteOffer);

// Public routes
router.get('/active', offerController.getActiveOffers);

module.exports = router; 