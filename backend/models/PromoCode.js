const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxUses: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  applicableTreks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PromoCode', PromoCodeSchema); 