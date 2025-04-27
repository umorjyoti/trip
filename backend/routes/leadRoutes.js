const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route for creating leads
router.post('/', leadController.createLead);

// Protected routes for admin/sales team
router.get('/', protect, admin, leadController.getLeads);
router.get('/:id', protect, admin, leadController.getLead);
router.put('/:id', protect, admin, leadController.updateLead);
router.delete('/:id', protect, admin, leadController.deleteLead);

// Export route
router.post('/export', protect, admin, leadController.exportLeads);

module.exports = router; 