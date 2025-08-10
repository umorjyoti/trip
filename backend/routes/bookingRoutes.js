const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { checkPermission, checkMultiplePermissions } = require('../middleware/checkPermissions');
const bookingController = require('../controllers/bookingController');
const adminBookingController = require('../controllers/adminBookingController');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management and user booking endpoints
 */

/**
 * @swagger
 * /bookings/user:
 *   get:
 *     summary: Get bookings for the current user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of bookings for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Handle the /user route (redirect to /user/mybookings)
router.get('/user', protect, bookingController.getUserBookings);

/**
 * @swagger
 * /bookings/user/mybookings:
 *   get:
 *     summary: Get bookings for the current user (alias)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of bookings for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get user bookings - this needs to come BEFORE the /:id route
router.get('/user/mybookings', protect, bookingController.getUserBookings);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (admin or users with bookings permission)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get all bookings (admin or users with bookings permission)
router.get('/', 
  protect, 
  checkMultiplePermissions([
    { category: 'stats', name: 'bookings' },
    { category: 'actions', name: 'manageBookings' }
  ]), 
  bookingController.getBookings
);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */



// Get booking by ID
router.get('/:id', 
 
  protect, 
  bookingController.getBookingById
);

// Create new booking
router.post('/', protect, bookingController.createBooking);

// Create custom trek booking (simplified flow)
router.post('/custom', protect, bookingController.createCustomTrekBooking);

// Update booking status
router.put('/:id/status', 
  protect, 
  bookingController.updateBookingStatus
);

// Update admin-created booking status and payment status
router.put('/:id/admin-status', 
  protect, 
  admin, 
  bookingController.updateAdminCreatedBookingStatus
);

// Cancel booking
router.put('/:id/cancel', 
  protect, 
  admin, 
  adminBookingController.cancelBooking
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
  bookingController.cancelParticipant
);

// Restore a cancelled participant
router.put('/:id/participants/:participantId/restore', 
  protect, 
  bookingController.restoreParticipant
);

// Update booking details
router.put('/:id', 
  protect, 
  bookingController.updateBooking
);

// Update participant details after payment
router.put('/:id/participants', protect, bookingController.updateParticipantDetails);

// Mark trek as completed (admin only)
router.put('/:id/complete-trek', 
  protect, 
  checkPermission('actions', 'manageBookings'), 
  bookingController.markTrekCompleted
);

// Export bookings
router.get('/admin/export', protect, admin, bookingController.exportBookings);

// Download invoice for a booking
router.get('/:id/invoice', protect, bookingController.downloadInvoice);

// Update admin remarks (admin only)
router.put('/:id/remarks', protect, admin, bookingController.updateAdminRemarks);

// Send reminder email (admin only)
router.post('/:bookingId/send-reminder', protect, admin, bookingController.sendReminderEmail);

// Send partial payment reminder (admin only)
router.post('/:bookingId/send-partial-reminder', protect, admin, bookingController.sendPartialPaymentReminder);

// Mark partial payment as complete (admin only)
router.put('/:bookingId/mark-partial-complete', protect, admin, bookingController.markPartialPaymentComplete);

// Send confirmation email (admin only)
router.post('/:bookingId/send-confirmation', protect, admin, bookingController.sendConfirmationEmail);

// Send invoice email (admin only)
router.post('/:bookingId/send-invoice', protect, admin, bookingController.sendInvoiceEmail);

// Shift booking to another batch (admin only)
router.put('/:bookingId/shift-batch', protect, admin, bookingController.shiftBookingToBatch);

// Create cancellation/reschedule request
router.post('/:bookingId/cancellation-request', 
  protect, 
  bookingController.createCancellationRequest
);

// Admin: Update cancellation/reschedule request status
router.put('/:bookingId/cancellation-request', 
  protect, 
  checkPermission('actions', 'manageBookings'), 
  bookingController.updateCancellationRequest
);

// Calculate refund amount for cancellation
router.post('/:bookingId/calculate-refund', 
  protect, 
  bookingController.calculateRefund
);

// Cleanup expired pending bookings (admin only)
router.post('/cleanup-expired', 
  protect, 
  admin, 
  bookingController.cleanupExpiredBookings
);

// Manual Booking Routes (Admin Only)

// Validate user by phone number
router.post('/manual/validate-user', 
  protect, 
  admin, 
  bookingController.validateUserByPhone
);

// Create new user for manual booking
router.post('/manual/create-user', 
  protect, 
  admin, 
  bookingController.createUserForManualBooking
);

// Create manual booking
router.post('/manual/create-booking', 
  protect, 
  admin, 
  bookingController.createManualBooking
);

module.exports = router; 