const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leads.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/', leadsController.createLead);

// Protected routes
router.get('/', authenticateToken, leadsController.getAllLeads);
router.get('/:id', authenticateToken, leadsController.getLead);
router.put('/:id', authenticateToken, leadsController.updateLead);
router.delete('/:id', authenticateToken, isAdmin, leadsController.deleteLead);
router.patch('/:id/status', authenticateToken, leadsController.updateLeadStatus);
router.patch('/:id/assign', authenticateToken, leadsController.assignLead);
router.patch('/:id/callback', authenticateToken, leadsController.updateCallbackStatus);

module.exports = router; 