const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { checkPermission, checkMultiplePermissions } = require('../middleware/checkPermissions');
const bookingController = require('../controllers/bookingController');

// Handle the /user route (redirect to /user/mybookings)
router.get('/user', protect, bookingController.getUserBookings);

// Get user bookings - this needs to come BEFORE the /:id route
router.get('/user/mybookings', protect, bookingController.getUserBookings);

// Get all bookings (admin or users with bookings permission)
router.get('/', 
  protect, 
  checkMultiplePermissions([
    { category: 'stats', name: 'bookings' },
    { category: 'actions', name: 'manageBookings' }
  ]), 
  bookingController.getBookings
);

// Get booking by ID
router.get('/:id', 
  protect, 
  checkMultiplePermissions([
    { category: 'stats', name: 'bookings' },
    { category: 'actions', name: 'manageBookings' }
  ]), 
  bookingController.getBookingById
);

// Create new booking
router.post('/', protect, bookingController.createBooking);

// Update booking status
router.put('/:id/status', 
  protect, 
  checkPermission('actions', 'manageBookings'), 
  bookingController.updateBookingStatus
);

// Cancel booking
router.put('/:id/cancel', 
  protect, 
  checkPermission('actions', 'manageBookings'), 
  bookingController.cancelBooking
);

// Restore booking
router.put('/:id/restore', 
  protect, 
  checkPermission('actions', 'manageBookings'), 
  bookingController.restoreBooking
);

// Delete booking (admin only)
router.delete('/:id', protect, admin, bookingController.deleteBooking);

// Cancel a participant from a booking
router.put('/:id/participants/:participantId/cancel', 
  protect, 
  checkPermission('actions', 'manageBookings'), 
  bookingController.cancelParticipant
);

// Restore a cancelled participant
router.put('/:id/participants/:participantId/restore', 
  protect, 
  checkPermission('actions', 'manageBookings'), 
  bookingController.restoreParticipant
);

// Update booking details
router.put('/:id', 
  protect, 
  checkPermission('actions', 'manageBookings'), 
  bookingController.updateBooking
);

// Export bookings
router.get('/admin/export', protect, admin, bookingController.exportBookings);

module.exports = router; 