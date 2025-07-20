const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  trekId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek',
    required: false
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'],
    default: 'New'
  },
  source: {
    type: String,
    enum: ['Trek Detail Page', 'Landing Page', 'Newsletter', 'Referral', 'Social Media', 'Other'],
    default: 'Trek Detail Page'
  },
  notes: {
    type: String,
    default: ''
  },
  requestCallback: {
    type: Boolean,
    default: false
  },
  callbackStatus: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastContactedAt: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead; 