const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  responses: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: {
        type: String,
        required: true
      },
      isAdmin: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
TicketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema); 