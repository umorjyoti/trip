const mongoose = require('mongoose');

const trekSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  season: {
    type: String,
    enum: ['Spring', 'Summer', 'Autumn', 'Winter', 'All Year'],
    required: true
  },
  duration: {
    type: Number, // in days
    required: true,
    min: 1
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Difficult', 'Very Difficult'],
    required: true
  },
  maxAltitude: {
    type: Number, // in meters
    required: true
  },
  distance: {
    type: Number, // in kilometers
    required: true
  },
  imageUrl: {
    type: String,
    default: 'default-trek.jpg'
  },
  startingPoint: {
    type: String,
    required: true
  },
  endingPoint: {
    type: String,
    required: true
  },
  highlights: [String],
  bestTimeToVisit: {
    type: String,
    required: true
  },
  thingsToPack: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: ''
    }
  }]
}, {
  timestamps: true
});

const Trek = mongoose.model('Trek', trekSchema);

module.exports = Trek; 