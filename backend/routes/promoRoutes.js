const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes
router.get('/', protect, admin, promoController.getAllPromoCodes);
router.post('/', protect, admin, promoController.createPromoCode);
router.put('/:id', protect, admin, promoController.updatePromoCode);
router.delete('/:id', protect, admin, promoController.deletePromoCode);

// Public routes
router.post('/validate', protect, promoController.validatePromoCode);

module.exports = router; 