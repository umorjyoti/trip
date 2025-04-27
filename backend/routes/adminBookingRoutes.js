const express = require('express');
const router = express.Router();
const { cancelBooking } = require('../controllers/adminBookingController');
const { protect, admin } = require('../middleware/authMiddleware');

router.patch('/bookings/:id/cancel', protect, admin, cancelBooking);

module.exports = router; 