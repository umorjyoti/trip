const mongoose = require('mongoose');

const UserDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  }
}, { _id: false });

const FailedBookingSchema = new mongoose.Schema({
  // Original booking ID for reference
  originalBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trek: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  numberOfParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  addOns: [{
    name: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  userDetails: {
    type: UserDetailsSchema,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // Session information from original booking
  bookingSession: {
    sessionId: String,
    expiresAt: Date,
    paymentAttempts: {
      type: Number,
      default: 0
    },
    lastPaymentAttempt: Date
  },
  // Failure reason and metadata
  failureReason: {
    type: String,
    enum: ['session_expired', 'payment_failed', 'user_cancelled', 'system_error'],
    default: 'session_expired'
  },
  failureDetails: {
    type: String,
    default: ''
  },
  // Original booking creation and expiration dates
  originalCreatedAt: {
    type: Date,
    required: true
  },
  originalExpiresAt: {
    type: Date,
    required: true
  },
  // Archive metadata
  archivedAt: {
    type: Date,
    default: Date.now
  },
  archivedBy: {
    type: String,
    enum: ['system', 'admin'],
    default: 'system'
  },
  // Additional metadata
  userAgent: String,
  ipAddress: String,
  // Payment attempt history
  paymentAttempts: [{
    attemptNumber: Number,
    attemptedAt: Date,
    paymentMethod: String,
    errorMessage: String,
    razorpayOrderId: String
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual for formatted dates
FailedBookingSchema.virtual('formattedDates').get(function() {
  if (!this.batch) return { startDate: 'N/A', endDate: 'N/A' };
  
  // If batch is populated
  if (this.batch.startDate && this.batch.endDate) {
    return {
      startDate: new Date(this.batch.startDate).toISOString(),
      endDate: new Date(this.batch.endDate).toISOString()
    };
  }
  
  return { startDate: 'N/A', endDate: 'N/A' };
});

// Add virtual for booking ID
FailedBookingSchema.virtual('bookingId').get(function() {
  return `FB${this._id.toString().slice(-8).toUpperCase()}`;
});

// Add virtual for batch details
FailedBookingSchema.virtual('batchDetails', {
  ref: 'Batch',
  localField: 'batch',
  foreignField: '_id',
  justOne: true
});

// Ensure batch is populated when toJSON or toObject is called
FailedBookingSchema.set('toJSON', { virtuals: true });
FailedBookingSchema.set('toObject', { virtuals: true });

// Add pre-find middleware to populate batch
FailedBookingSchema.pre('find', function() {
  this.populate('batch', 'startDate endDate price maxParticipants currentParticipants');
});

FailedBookingSchema.pre('findOne', function() {
  this.populate('batch', 'startDate endDate price maxParticipants currentParticipants');
});

module.exports = mongoose.model('FailedBooking', FailedBookingSchema); 