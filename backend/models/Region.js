const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a region name'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
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

// Pre-save middleware to generate slug from name
RegionSchema.pre('save', async function(next) {
  // Always generate slug if name is provided
  if (this.name) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    // Handle uniqueness
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingRegion = await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } });
      if (!existingRegion) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

module.exports = mongoose.model('Region', RegionSchema); 