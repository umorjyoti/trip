const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Get Razorpay key (protected route)
router.get('/get-key', protect, paymentController.getRazorpayKey);

// Create a new Razorpay order
router.post('/create-order', protect, paymentController.createOrder);

// Verify Razorpay payment
router.post('/verify', protect, paymentController.verifyPayment);

// Handle Razorpay webhook events
router.post('/webhook', paymentController.handleWebhook);

module.exports = router; 