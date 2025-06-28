const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const { protect, admin } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/checkPermissions');

// Public route - Submit career application
router.post('/', careerController.createCareerApplication);

// Admin routes - Protected and require permissions
router.get('/admin', protect, admin, checkPermission('manageCareers'), careerController.getCareerApplications);
router.get('/admin/stats', protect, admin, checkPermission('manageCareers'), careerController.getCareerStats);
router.get('/admin/:id', protect, admin, checkPermission('manageCareers'), careerController.getCareerApplication);
router.put('/admin/:id/status', protect, admin, checkPermission('manageCareers'), careerController.updateCareerApplicationStatus);
router.delete('/admin/:id', protect, admin, checkPermission('manageCareers'), careerController.deleteCareerApplication);

module.exports = router; 