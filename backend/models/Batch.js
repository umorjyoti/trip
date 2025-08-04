const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  trek: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  reservedSlots: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add virtual for formatted dates
BatchSchema.virtual('formattedDates').get(function() {
  return {
    startDate: this.startDate ? new Date(this.startDate).toISOString() : 'N/A',
    endDate: this.endDate ? new Date(this.endDate).toISOString() : 'N/A'
  };
});

// Ensure virtuals are included in JSON
BatchSchema.set('toJSON', { virtuals: true });
BatchSchema.set('toObject', { virtuals: true });

// Check if model is already registered
const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);

module.exports = Batch; 