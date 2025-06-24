const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: Lead management and enquiry endpoints
 */

/**
 * @swagger
 * /leads:
 *   post:
 *     summary: Create a new lead (public enquiry)
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: '+1234567890'
 *               message:
 *                 type: string
 *                 example: 'I am interested in the Himalayan trek.'
 *     responses:
 *       201:
 *         description: Lead created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lead created successfully
 *                 lead:
 *                   type: object
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Public route for creating leads
router.post('/', leadController.createLead);

// Protected routes for admin/sales team
router.get('/', protect, admin, leadController.getLeads);
router.get('/:id', protect, admin, leadController.getLead);
router.put('/:id', protect, admin, leadController.updateLead);
router.delete('/:id', protect, admin, leadController.deleteLead);

// Export route
router.post('/export', protect, admin, leadController.exportLeads);

/**
 * @swagger
 * /leads:
 *   get:
 *     summary: Get all leads (admin only)
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all leads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
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

/**
 * @swagger
 * /leads/{id}:
 *   get:
 *     summary: Get lead by ID (admin only)
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     responses:
 *       200:
 *         description: Lead details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
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
 *         description: Lead not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

module.exports = router; 