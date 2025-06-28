const mongoose = require('mongoose');

const careerApplicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  skillsAndExperience: {
    type: String,
    required: true,
    trim: true
  },
  resumeUrl: {
    type: String, // URL to uploaded file
    required: true
  },
  resumeFileName: {
    type: String, // Original filename
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  statusUpdatedAt: {
    type: Date
  },
  statusUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Update the updatedAt field before saving
careerApplicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const CareerApplication = mongoose.model('CareerApplication', careerApplicationSchema);

module.exports = CareerApplication; 