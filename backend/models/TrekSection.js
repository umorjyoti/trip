const mongoose = require('mongoose');

const trekSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Section title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['trek', 'banner'],
    default: 'trek',
    required: true
  },
  // Trek section fields
  treks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek'
  }],
  // Banner section fields
  bannerImage: {
    type: String,
    required: function() { return this.type === 'banner'; }
  },
  overlayText: {
    type: String,
    required: function() { return this.type === 'banner'; },
    trim: true
  },
  overlayColor: {
    type: String,
    default: '#000000',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Overlay color must be a valid hex color'
    }
  },
  overlayOpacity: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  },
  textColor: {
    type: String,
    default: '#FFFFFF',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Text color must be a valid hex color'
    }
  },
  linkToTrek: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek'
  },
  couponCode: {
    type: String,
    trim: true
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  mobileOptimized: {
    type: Boolean,
    default: true
  },
  // Common fields
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
trekSectionSchema.index({ type: 1, isActive: 1, displayOrder: 1 });

const TrekSection = mongoose.model('TrekSection', trekSectionSchema);

module.exports = TrekSection; 