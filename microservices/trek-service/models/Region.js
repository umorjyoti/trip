const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a region name'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Please add a region description']
  },
  state: {
    type: String,
    required: [true, 'Please add a state'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Please add a country'],
    default: 'India',
    trim: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  },
  images: [String],
  coverImage: {
    type: String
  },
  highlights: [String],
  bestTimeToVisit: {
    type: String,
    trim: true
  },
  climate: {
    type: String,
    enum: ['Tropical', 'Subtropical', 'Temperate', 'Alpine', 'Desert', 'Coastal'],
    default: 'Temperate'
  },
  averageTemperature: {
    min: {
      type: Number
    },
    max: {
      type: Number
    }
  },
  nearestAirport: {
    type: String,
    trim: true
  },
  nearestRailway: {
    type: String,
    trim: true
  },
  accessibility: {
    type: String,
    enum: ['Easy', 'Moderate', 'Difficult'],
    default: 'Moderate'
  },
  popularActivities: [String],
  localCuisine: [String],
  culturalSignificance: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // SEO fields
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  metaKeywords: [String],
  // Statistics
  trekCount: {
    type: Number,
    default: 0
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
RegionSchema.index({ slug: 1 });
RegionSchema.index({ state: 1 });
RegionSchema.index({ country: 1 });
RegionSchema.index({ isActive: 1 });
RegionSchema.index({ isFeatured: 1 });
RegionSchema.index({ name: 'text', description: 'text' });

// Virtual for region URL
RegionSchema.virtual('url').get(function() {
  return `/regions/${this.slug}`;
});

// Virtual for location string
RegionSchema.virtual('location').get(function() {
  return `${this.name}, ${this.state}, ${this.country}`;
});

// Virtual for coordinate string
RegionSchema.virtual('coordinateString').get(function() {
  if (this.coordinates.latitude && this.coordinates.longitude) {
    return `${this.coordinates.latitude}, ${this.coordinates.longitude}`;
  }
  return null;
});

// Pre-save middleware to generate slug from name
RegionSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim('-'); // Remove leading/trailing hyphens
  }
  next();
});

// Pre-save middleware to update meta fields if not set
RegionSchema.pre('save', function(next) {
  if (!this.metaTitle) {
    this.metaTitle = `${this.name} - Trekking Region`;
  }
  if (!this.metaDescription) {
    this.metaDescription = this.description.substring(0, 160);
  }
  next();
});

// Instance method to increment view count
RegionSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method to update trek count
RegionSchema.methods.updateTrekCount = async function() {
  const Trek = mongoose.model('Trek');
  this.trekCount = await Trek.countDocuments({ region: this._id, isEnabled: true });
  return this.save();
};

// Instance method to update statistics
RegionSchema.methods.updateStatistics = async function() {
  const Trek = mongoose.model('Trek');
  
  // Get all treks in this region
  const treks = await Trek.find({ region: this._id, isEnabled: true });
  
  // Update trek count
  this.trekCount = treks.length;
  
  // Calculate total bookings and average rating
  let totalBookings = 0;
  let totalRating = 0;
  let ratedTreks = 0;
  
  treks.forEach(trek => {
    totalBookings += trek.bookingCount || 0;
    if (trek.averageRating > 0) {
      totalRating += trek.averageRating;
      ratedTreks++;
    }
  });
  
  this.totalBookings = totalBookings;
  this.averageRating = ratedTreks > 0 ? totalRating / ratedTreks : 0;
  
  return this.save();
};

// Static method to find active regions
RegionSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find featured regions
RegionSchema.statics.findFeatured = function() {
  return this.find({ isActive: true, isFeatured: true });
};

// Static method to find by state
RegionSchema.statics.findByState = function(state) {
  return this.find({ state, isActive: true });
};

// Static method to find by climate
RegionSchema.statics.findByClimate = function(climate) {
  return this.find({ climate, isActive: true });
};

// Static method to search regions
RegionSchema.statics.searchRegions = function(searchTerm) {
  return this.find({
    $text: { $search: searchTerm },
    isActive: true
  }).sort({ score: { $meta: 'textScore' } });
};

// Static method to find popular regions
RegionSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ totalBookings: -1, averageRating: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Region', RegionSchema);