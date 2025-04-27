const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a region name'],
    trim: true
  },
  trekSectionTitle: {
    type: String,
    default: '',
    trim: true
  },
  welcomeMessage: {
    type: String,
    default: '',
    trim: true
  },
  detailedDescription: {
    type: String,
    default: '',
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Please provide a location'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  bestSeason: {
    type: String,
    trim: true
  },
  avgTrekDuration: {
    type: Number
  },
  coverImage: {
    type: String
  },
  images: [String],
  descriptionImages: [String],
  videos: [String],
  isEnabled: {
    type: Boolean,
    default: true
  },
  relatedRegions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

RegionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Region', RegionSchema); 