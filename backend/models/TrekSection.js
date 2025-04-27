const mongoose = require('mongoose');

const trekSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Section title is required'],
    trim: true
  },
  treks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek'
  }],
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

const TrekSection = mongoose.model('TrekSection', trekSectionSchema);

module.exports = TrekSection; 