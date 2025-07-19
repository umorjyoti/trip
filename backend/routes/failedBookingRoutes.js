const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/checkPermissions');
const failedBookingController = require('../controllers/failedBookingController');

/**
 * @swagger
 * tags:
 *   name: Failed Bookings
 *   description: Failed booking management endpoints
 */

/**
 * @swagger
 * /failed-bookings:
 *   get:
 *     summary: Get all failed bookings (admin only)
 *     tags: [Failed Bookings]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: failureReason
 *         schema:
 *           type: string
 *           enum: [session_expired, payment_failed, user_cancelled, system_error]
 *         description: Filter by failure reason
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: List of failed bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 failedBookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FailedBooking'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 stats:
 *                   $ref: '#/components/schemas/FailedBookingStats'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */

// Get all failed bookings (admin only)
router.get('/', 
  protect, 
  admin, 
  failedBookingController.getFailedBookings
);

/**
 * @swagger
 * /failed-bookings/{id}:
 *   get:
 *     summary: Get failed booking by ID (admin only)
 *     tags: [Failed Bookings]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Failed booking ID
 *     responses:
 *       200:
 *         description: Failed booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FailedBooking'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Failed booking not found
 */

// Get failed booking by ID (admin only)
router.get('/:id', 
  protect, 
  admin, 
  failedBookingController.getFailedBookingById
);

/**
 * @swagger
 * /failed-bookings/{id}/restore:
 *   post:
 *     summary: Restore failed booking (admin only)
 *     tags: [Failed Bookings]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Failed booking ID
 *     responses:
 *       200:
 *         description: Failed booking restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 booking:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Cannot restore booking - batch is full
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Failed booking not found
 */

// Restore failed booking (admin only)
router.post('/:id/restore', 
  protect, 
  admin, 
  failedBookingController.restoreFailedBooking
);

/**
 * @swagger
 * /failed-bookings/{id}:
 *   delete:
 *     summary: Delete failed booking permanently (admin only)
 *     tags: [Failed Bookings]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Failed booking ID
 *     responses:
 *       200:
 *         description: Failed booking deleted permanently
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Failed booking not found
 */

// Delete failed booking permanently (admin only)
router.delete('/:id', 
  protect, 
  admin, 
  failedBookingController.deleteFailedBooking
);

/**
 * @swagger
 * /failed-bookings/export:
 *   get:
 *     summary: Export failed bookings to Excel (admin only)
 *     tags: [Failed Bookings]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: failureReason
 *         schema:
 *           type: string
 *           enum: [session_expired, payment_failed, user_cancelled, system_error]
 *         description: Filter by failure reason
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */

// Export failed bookings to Excel (admin only)
router.get('/export/excel', 
  protect, 
  admin, 
  failedBookingController.exportFailedBookings
);

module.exports = router; 