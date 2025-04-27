const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);


// Protected routes
router.get('/me', protect, authController.getUserProfile);

// Admin routes
router.get('/users', protect, admin, authController.getUsers);
router.patch('/users/:id/role', protect, admin, authController.updateUserRole);

module.exports = router; 