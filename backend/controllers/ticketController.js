const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

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
    
    // Send email notification if admin is responding
    if (req.user.isAdmin || req.user.role === 'admin') {
      try {
        // Populate ticket with user, booking, and trek details for email
        const populatedTicket = await Ticket.findById(req.params.id)
          .populate('user', 'name email')
          .populate({
            path: 'booking',
            populate: {
              path: 'trek',
              select: 'name'
            }
          });
        
        if (populatedTicket && populatedTicket.user) {
          const emailSubject = `📧 New Response on Support Ticket - ${populatedTicket.subject}`;
          
          const emailContent = `
Dear ${populatedTicket.user.name},

You have received a new response on your support ticket.

📋 TICKET DETAILS:
Subject: ${populatedTicket.subject}
Ticket ID: ${populatedTicket._id}
Status: ${populatedTicket.status}
Priority: ${populatedTicket.priority}

📝 LATEST RESPONSE:
${message}

📖 ORIGINAL DESCRIPTION:
${populatedTicket.description}

${populatedTicket.booking?.trek ? `🏔️ RELATED TREK: ${populatedTicket.booking.trek.name}` : ''}

📞 NEXT STEPS:
Please log into your account to view the complete conversation and respond if needed.

❓ NEED HELP?
If you have any questions, please don't hesitate to contact us.

Best regards,
The Bengaluru Trekkers Support Team

---
This is an automated notification. Please do not reply to this email.
For support, contact us through our website or mobile app.
          `;

          const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailSubject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .response-container {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .ticket-details {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .ticket-details h3 {
            margin-top: 0;
            color: #374151;
        }
        .ticket-details p {
            margin: 8px 0;
            color: #6b7280;
        }
        .ticket-details strong {
            color: #374151;
        }
        .response-message {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📧 Support Ticket Update</div>
            <div class="subtitle">You have a new response on your ticket</div>
        </div>

        <h2>Dear ${populatedTicket.user.name},</h2>
        
        <div class="response-container">
            <h3 style="margin-top: 0;">New Response Received</h3>
            <p>Our support team has responded to your ticket. Please review the details below.</p>
        </div>

        <div class="ticket-details">
            <h3>📋 Ticket Details</h3>
            <p><strong>Subject:</strong> ${populatedTicket.subject}</p>
            <p><strong>Ticket ID:</strong> ${populatedTicket._id}</p>
            <p><strong>Status:</strong> ${populatedTicket.status}</p>
            <p><strong>Priority:</strong> ${populatedTicket.priority}</p>
            ${populatedTicket.booking?.trek ? `<p><strong>Related Trek:</strong> ${populatedTicket.booking.trek.name}</p>` : ''}
        </div>

        <div class="response-message">
            <h3>📝 Latest Response</h3>
            <p style="white-space: pre-wrap; margin: 0;">${message}</p>
        </div>

        <div class="ticket-details">
            <h3>📖 Original Description</h3>
            <p style="white-space: pre-wrap; margin: 0;">${populatedTicket.description}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 18px; color: #10b981;">
                📞 Please log into your account to view the complete conversation and respond if needed.
            </p>
        </div>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Bengaluru Trekkers Support Team</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #9ca3af;">
                This is an automated notification. Please do not reply to this email.<br>
                For support, contact us through our website or mobile app.
            </p>
        </div>
    </div>
</body>
</html>
          `;

          await sendEmail({
            to: populatedTicket.user.email,
            subject: emailSubject,
            text: emailContent,
            html: htmlContent
          });
          
          console.log(`Email notification sent to ${populatedTicket.user.email} for ticket response`);
        }
      } catch (emailError) {
        console.error('Error sending ticket response email notification:', emailError);
        // Don't fail the response if email fails
      }
    }
    
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
    
    const oldStatus = ticket.status;
    ticket.status = status;
    await ticket.save();
    
    // Send email notification for status change
    try {
      // Populate ticket with user, booking, and trek details for email
      const populatedTicket = await Ticket.findById(req.params.id)
        .populate('user', 'name email')
        .populate({
          path: 'booking',
          populate: {
            path: 'trek',
            select: 'name'
          }
        });
      
      if (populatedTicket && populatedTicket.user) {
        const statusMessages = {
          'open': 'Your ticket has been reopened and is now under review.',
          'in-progress': 'Your ticket is now being actively worked on by our support team.',
          'resolved': 'Your ticket has been resolved. Please let us know if you need any further assistance.',
          'closed': 'Your ticket has been closed. If you have any new issues, please create a new ticket.'
        };
        
        const emailSubject = `📊 Support Ticket Status Updated - ${populatedTicket.subject}`;
        
        const emailContent = `
Dear ${populatedTicket.user.name},

Your support ticket status has been updated.

📋 TICKET DETAILS:
Subject: ${populatedTicket.subject}
Ticket ID: ${populatedTicket._id}
Previous Status: ${oldStatus}
New Status: ${status}
Priority: ${populatedTicket.priority}

📝 STATUS UPDATE:
${statusMessages[status] || 'Your ticket status has been updated.'}

📖 ORIGINAL DESCRIPTION:
${populatedTicket.description}

${populatedTicket.booking?.trek ? `🏔️ RELATED TREK: ${populatedTicket.booking.trek.name}` : ''}

📞 NEXT STEPS:
Please log into your account to view the complete conversation and any additional details.

❓ NEED HELP?
If you have any questions about this status change, please don't hesitate to contact us.

Best regards,
The Bengaluru Trekkers Support Team

---
This is an automated notification. Please do not reply to this email.
For support, contact us through our website or mobile app.
        `;

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailSubject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .status-container {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .status-change {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .ticket-details {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .ticket-details h3 {
            margin-top: 0;
            color: #374151;
        }
        .ticket-details p {
            margin: 8px 0;
            color: #6b7280;
        }
        .ticket-details strong {
            color: #374151;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📊 Status Update</div>
            <div class="subtitle">Your support ticket status has changed</div>
        </div>

        <h2>Dear ${populatedTicket.user.name},</h2>
        
        <div class="status-container">
            <h3 style="margin-top: 0;">Status Updated</h3>
            <p>Your support ticket status has been updated by our team.</p>
        </div>

        <div class="status-change">
            <h3>🔄 Status Change</h3>
            <p><strong>Previous Status:</strong> ${oldStatus}</p>
            <p><strong>New Status:</strong> ${status}</p>
            <p style="margin-top: 15px;"><strong>Update:</strong> ${statusMessages[status] || 'Your ticket status has been updated.'}</p>
        </div>

        <div class="ticket-details">
            <h3>📋 Ticket Details</h3>
            <p><strong>Subject:</strong> ${populatedTicket.subject}</p>
            <p><strong>Ticket ID:</strong> ${populatedTicket._id}</p>
            <p><strong>Priority:</strong> ${populatedTicket.priority}</p>
            ${populatedTicket.booking?.trek ? `<p><strong>Related Trek:</strong> ${populatedTicket.booking.trek.name}</p>` : ''}
        </div>

        <div class="ticket-details">
            <h3>📖 Original Description</h3>
            <p style="white-space: pre-wrap; margin: 0;">${populatedTicket.description}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 18px; color: #10b981;">
                📞 Please log into your account to view the complete conversation and any additional details.
            </p>
        </div>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Bengaluru Trekkers Support Team</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #9ca3af;">
                This is an automated notification. Please do not reply to this email.<br>
                For support, contact us through our website or mobile app.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        await sendEmail({
          to: populatedTicket.user.email,
          subject: emailSubject,
          text: emailContent,
          html: htmlContent
        });
        
        console.log(`Email notification sent to ${populatedTicket.user.email} for ticket status change`);
      }
    } catch (emailError) {
      console.error('Error sending ticket status change email notification:', emailError);
      // Don't fail the status update if email fails
    }
    
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
    
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'all';
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Get total count for pagination
    const totalTickets = await Ticket.countDocuments(filter);
    const totalPages = Math.ceil(totalTickets / limit);
    
    // Get paginated tickets
    const tickets = await Ticket.find(filter)
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        populate: {
          path: 'trek',
          select: 'name'
        }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalTickets,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 