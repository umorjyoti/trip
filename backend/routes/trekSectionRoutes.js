const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const trekSectionController = require('../controllers/trekSectionController');

// Public routes
router.get('/active', trekSectionController.getActiveSections);

// Protected routes
router.get('/', protect, admin, trekSectionController.getTrekSections);
router.post('/', protect, admin, trekSectionController.createTrekSection);
router.get('/:id', protect, admin, trekSectionController.getTrekSectionById);
router.put('/:id', protect, admin, trekSectionController.updateTrekSection);
router.delete('/:id', protect, admin, trekSectionController.deleteTrekSection);

module.exports = router; 