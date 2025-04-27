const express = require('express');
const router = express.Router();
const {
  createTicket,
  getUserTickets,
  getTicketById,
  addResponse,
  updateTicketStatus,
  getAllTickets
} = require('../controllers/ticketController');
const { protect, admin } = require('../middleware/authMiddleware');

// Apply protect middleware to all ticket routes
router.use(protect);

// Create a new ticket
router.post('/', createTicket);

// Get user's tickets
router.get('/user', getUserTickets);

// Get a specific ticket
router.get('/:id', getTicketById);

// Add a response to a ticket
router.post('/:id/responses', addResponse);

// Update ticket status (admin only)
router.patch('/:id/status', admin, updateTicketStatus);

// Get all tickets (admin only)
router.get('/', admin, getAllTickets);

module.exports = router; 