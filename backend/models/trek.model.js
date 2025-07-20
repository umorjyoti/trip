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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Difficult', 'Challenging'],
    default: 'Moderate'
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  season: {
    type: String,
    enum: ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter', 'Year-round'],
    default: 'Year-round'
  },
  startingPoint: {
    type: String,
    required: true
  },
  endingPoint: {
    type: String,
    required: true
  },
  displayPrice: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    default: 'default-trek.jpg'
  },
  images: [{
    type: String,
    required: true
  }],
  maxAltitude: {
    type: Number,
    required: true,
    min: 0
  },
  distance: {
    type: Number,
    required: true,
    min: 0
  },
  highlights: [{
    type: String,
    required: true
  }],
  isEnabled: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['all-treks', 'monsoon-treks', 'sunrise-treks', 'himalayan-treks', 'backpacking-trips', 'long-weekend'],
    default: 'all-treks'
  },
  batches: [{
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
      default: 0,
      min: 0
    }
  }],
  itinerary: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    accommodation: String,
    meals: String,
    activities: [String]
  }],
  includes: [String],
  excludes: [String],
  thingsToPack: [{
    title: String,
    description: String,
    icon: String
  }],
  faqs: [{
    question: String,
    answer: String
  }],
  customFields: [{
    fieldName: String,
    fieldType: {
      type: String,
      enum: ['text', 'number', 'select', 'checkbox']
    },
    isRequired: Boolean,
    options: [String],
    description: String,
    placeholder: String
  }],
  addOns: [{
    name: String,
    description: String,
    price: {
      type: Number,
      min: 0
    },
    isEnabled: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Add a pre-save middleware to ensure imageUrl is set from images array
trekSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0 && !this.imageUrl) {
    this.imageUrl = this.images[0];
  }
  next();
});

const Trek = mongoose.model('Trek', trekSchema);

module.exports = Trek; 