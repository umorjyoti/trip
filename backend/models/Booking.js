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
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  numberOfParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  addOns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AddOn'
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
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
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
  // Add payment details field
  paymentDetails: PaymentDetailsSchema,
  // This will be filled after payment success
  participantDetails: [{
    name: String,
    age: Number,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    medicalConditions: String,
    specialRequests: String,
    customFieldResponses: [{
      fieldId: String,
      fieldName: String,
      fieldType: String,
      value: mongoose.Schema.Types.Mixed,
      options: [String]
    }]
  }],
  // Add pickup and drop location fields
  pickupLocation: {
    type: String,
    trim: true
  },
  dropLocation: {
    type: String,
    trim: true
  },
  additionalRequests: {
    type: String,
    trim: true
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