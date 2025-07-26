const mongoose = require('mongoose');

const TrekSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a section name'],
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
    required: [true, 'Please add a section description']
  },
  icon: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true,
    default: '#007bff'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Configuration for this section
  config: {
    showOnHomepage: {
      type: Boolean,
      default: true
    },
    showInNavigation: {
      type: Boolean,
      default: true
    },
    requiresSpecialPermission: {
      type: Boolean,
      default: false
    },
    minAge: {
      type: Number,
      default: 18
    },
    maxAge: {
      type: Number,
      default: 65
    }
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
TrekSectionSchema.index({ slug: 1 });
TrekSectionSchema.index({ order: 1 });
TrekSectionSchema.index({ isActive: 1 });
TrekSectionSchema.index({ isFeatured: 1 });
TrekSectionSchema.index({ name: 'text', description: 'text' });

// Virtual for section URL
TrekSectionSchema.virtual('url').get(function() {
  return `/sections/${this.slug}`;
});

// Pre-save middleware to generate slug from name
TrekSectionSchema.pre('save', function(next) {
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
TrekSectionSchema.pre('save', function(next) {
  if (!this.metaTitle) {
    this.metaTitle = `${this.name} - Trek Section`;
  }
  if (!this.metaDescription) {
    this.metaDescription = this.description.substring(0, 160);
  }
  next();
});

// Instance method to update trek count
TrekSectionSchema.methods.updateTrekCount = async function() {
  const Trek = mongoose.model('Trek');
  this.trekCount = await Trek.countDocuments({ 
    category: this.slug, 
    isEnabled: true 
  });
  return this.save();
};

// Instance method to update statistics
TrekSectionSchema.methods.updateStatistics = async function() {
  const Trek = mongoose.model('Trek');
  
  // Get all treks in this section
  const treks = await Trek.find({ 
    category: this.slug, 
    isEnabled: true 
  });
  
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

// Static method to find active sections
TrekSectionSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

// Static method to find featured sections
TrekSectionSchema.statics.findFeatured = function() {
  return this.find({ 
    isActive: true, 
    isFeatured: true 
  }).sort({ order: 1 });
};

// Static method to find sections for homepage
TrekSectionSchema.statics.findForHomepage = function() {
  return this.find({ 
    isActive: true, 
    'config.showOnHomepage': true 
  }).sort({ order: 1 });
};

// Static method to find sections for navigation
TrekSectionSchema.statics.findForNavigation = function() {
  return this.find({ 
    isActive: true, 
    'config.showInNavigation': true 
  }).sort({ order: 1 });
};

// Static method to search sections
TrekSectionSchema.statics.searchSections = function(searchTerm) {
  return this.find({
    $text: { $search: searchTerm },
    isActive: true
  }).sort({ score: { $meta: 'textScore' } });
};

// Static method to find popular sections
TrekSectionSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ totalBookings: -1, averageRating: -1 })
    .limit(limit);
};

module.exports = mongoose.model('TrekSection', TrekSectionSchema);