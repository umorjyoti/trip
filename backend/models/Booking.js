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

// Schema for custom field responses
const CustomFieldResponseSchema = new mongoose.Schema({
  fieldId: String,
  fieldName: String,
  fieldType: String,
  value: mongoose.Schema.Types.Mixed, // Can store string, number, or array for checkbox
  options: [String] // Store options for reference if it's a select/checkbox field
}, { _id: false });

const ParticipantDetailSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: String,
  age: Number,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  contactNumber: String,
  medicalConditions: String,
  specialRequests: String,
  customFieldResponses: [CustomFieldResponseSchema],
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date
  },
  // Refund fields
  refundStatus: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'not_applicable'],
    default: 'not_applicable'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundDate: {
    type: Date
  },
  refundType: {
    type: String,
    enum: ['auto', 'custom', 'full'],
    default: 'auto'
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['confirmed', 'bookingCancelled'],
    default: 'confirmed'
  }
}, { _id: false });

const ContactInfoSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String
}, { _id: false });

// Add payment details schema
const PaymentDetailsSchema = new mongoose.Schema({
  paymentId: String,
  orderId: String,
  signature: String,
  paidAt: Date,
  amount: Number,
  method: String
}, { _id: false });

// Add promo code details schema
const PromoCodeDetailsSchema = new mongoose.Schema({
  promoCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode'
  },
  code: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed']
  },
  discountValue: Number,
  discountAmount: Number,
  originalPrice: Number
}, { _id: false });

const BookingSchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId, // This is ID of one of trek.batches
    required: true,
    validate: {
      validator: async function (batchId) {
        const trek = await mongoose.model('Trek').findById(this.trek).select('batches');
        if (!trek) return false;
        return trek.batches.some(batch => batch._id.toString() === batchId.toString());
      },
      message: 'Batch is not part of the selected trek.'
    }
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
  // Single emergency contact for the entire booking (filled during participant details step)
  emergencyContact: {
    name: {
      type: String,
      required: false
    },
    phone: {
      type: String,
      required: false
    },
    relation: {
      type: String,
      required: false
    }
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'pending_payment', 'payment_completed', 'payment_confirmed_partial', 'confirmed', 'trek_completed', 'cancelled'],
    default: 'pending'
  },
  // Partial payment fields
  paymentMode: {
    type: String,
    enum: ['full', 'partial'],
    default: 'full'
  },
  partialPaymentDetails: {
    initialAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    },
    finalPaymentDueDate: {
      type: Date
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: {
      type: Date
    }
  },
  // Add booking session tracking
  bookingSession: {
    sessionId: {
      type: String,
      required: false
    },
    expiresAt: {
      type: Date,
      required: false
    },
    paymentAttempts: {
      type: Number,
      default: 0
    },
    lastPaymentAttempt: {
      type: Date,
      required: false
    }
  },
  cancelledAt: {
    type: Date
  },
  // Refund fields
  refundStatus: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'not_applicable'],
    default: 'not_applicable'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundDate: {
    type: Date
  },
  refundType: {
    type: String,
    enum: ['auto', 'custom', 'full'],
    default: 'auto'
  },
  // Add payment details field
  paymentDetails: PaymentDetailsSchema,
  // Add promo code details field
  promoCodeDetails: PromoCodeDetailsSchema,
  // This will be filled after payment success
  participantDetails: [{
    name: String,
    email: String,
    phone: String,
    age: Number,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    allergies: String,
    extraComment: String,
    customFields: {
      type: Map,
      of: String
    },
    medicalConditions: String,
    specialRequests: String,
    customFieldResponses: [{
      fieldId: String,
      fieldName: String,
      fieldType: String,
      value: mongoose.Schema.Types.Mixed,
      options: [String]
    }],
    status: {
      type: String,
      enum: ['confirmed', 'bookingCancelled'],
      default: 'confirmed'
    },
    // Add cancellation fields
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    // Add refund fields
    refundStatus: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'not_applicable'],
      default: 'not_applicable'
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundDate: {
      type: Date
    },
    refundType: {
      type: String,
      enum: ['auto', 'custom', 'full'],
      default: 'auto'
    }
  }],

  additionalRequests: {
    type: String,
    trim: true
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  // Admin remarks field
  adminRemarks: {
    type: String,
    trim: true,
    default: ''
  },
  // Flag to identify admin-created bookings
  adminCreated: {
    type: Boolean,
    default: false
  },
  // Cancellation/Reschedule request fields
  cancellationRequest: {
    type: {
      type: String,
      enum: ['cancellation', 'reschedule', null],
      default: null
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    preferredBatch: {
      type: mongoose.Schema.Types.ObjectId, // For reschedule requests
      default: null
    },
    requestedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', null],
      default: null
    },
    adminResponse: {
      type: String,
      trim: true,
      default: ''
    },
    respondedAt: {
      type: Date,
      default: null
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual for formatted dates
BookingSchema.virtual('formattedDates').get(function() {
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
BookingSchema.virtual('bookingId').get(function() {
  return `BT${this._id.toString().slice(-8).toUpperCase()}`;
});

// Add virtual for batch details
BookingSchema.virtual('batchDetails', {
  ref: 'Batch',
  localField: 'batch',
  foreignField: '_id',
  justOne: true
});

// Ensure batch is populated when toJSON or toObject is called
BookingSchema.set('toJSON', { virtuals: true });
BookingSchema.set('toObject', { virtuals: true });

// Add pre-find middleware to populate batch
BookingSchema.pre('find', function() {
  this.populate('batch', 'startDate endDate price maxParticipants currentParticipants');
});

BookingSchema.pre('findOne', function() {
  this.populate('batch', 'startDate endDate price maxParticipants currentParticipants');
});

module.exports = mongoose.model('Booking', BookingSchema); 