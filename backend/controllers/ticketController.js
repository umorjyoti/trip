const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Create a new support ticket
exports.createTicket = async (req, res) => {
  try {
    const { bookingId, subject, description, priority } = req.body;
    
    // Validate required fields
    if (!bookingId || !subject || !description) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if booking exists and belongs to the user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create a ticket for this booking' });
    }
    
    // Create the ticket
    const ticket = await Ticket.create({
      user: req.user._id,
      booking: bookingId,
      subject,
      description,
      priority: priority || 'medium',
      status: 'open'
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tickets for a user
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate('booking', 'trek totalPrice status')
      .sort({ updatedAt: -1 });
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        populate: {
          path: 'trek',
          select: 'name'
        }
      })
      .populate('responses.user', 'name');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if the user is authorized to view this ticket
    if (!req.user.isAdmin && ticket.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a response to a ticket
exports.addResponse = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Please provide a message' });
    }
    
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if the user is authorized to respond to this ticket
    if (!req.user.isAdmin && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this ticket' });
    }
    
    // Add the response
    ticket.responses.push({
      user: req.user._id,
      message,
      isAdmin: req.user.isAdmin || req.user.role === 'admin'
    });
    
    // Update ticket status if admin is responding
    if (req.user.isAdmin || req.user.role === 'admin') {
      if (ticket.status === 'open') {
        ticket.status = 'in-progress';
      }
    }
    
    await ticket.save();
    
    // Populate the user information for the new response
    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        populate: {
          path: 'trek',
          select: 'name'
        }
      })
      .populate('responses.user', 'name');
    
    res.json(updatedTicket);
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update ticket status (admin only)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Only admins can update ticket status
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update ticket status' });
    }
    
    ticket.status = status;
    await ticket.save();
    
    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tickets (admin only)
exports.getAllTickets = async (req, res) => {
  try {
    // Only admins can view all tickets
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view all tickets' });
    }
    
    const tickets = await Ticket.find()
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        populate: {
          path: 'trek',
          select: 'name'
        }
      })
      .sort({ updatedAt: -1 });
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 