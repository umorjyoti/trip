const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leads.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

// Public routes
router.post('/', leadsController.createLead);

// Protected routes
router.get('/', protect, leadsController.getAllLeads);
router.get('/:id', protect, leadsController.getLead);
router.put('/:id', protect, leadsController.updateLead);
router.delete('/:id', protect, admin, leadsController.deleteLead);
router.patch('/:id/status', protect, leadsController.updateLeadStatus);
router.patch('/:id/assign', protect, leadsController.assignLead);
router.patch('/:id/callback', protect, leadsController.updateCallbackStatus);

module.exports = router; 