const mongoose = require('mongoose');

const BlogRegionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a region name'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Please provide an image URL'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Image must be a valid image URL'
    }
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
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

// Create slug from name before saving
BlogRegionSchema.pre('save', function(next) {
  // Always generate slug if it doesn't exist or if name is modified
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
  
  // Update updatedAt timestamp
  this.updatedAt = new Date();
  
  next();
});

// Create indexes for better performance
BlogRegionSchema.index({ slug: 1 }, { unique: true });
BlogRegionSchema.index({ isEnabled: 1, name: 1 });

// Add static method to find enabled regions
BlogRegionSchema.statics.findEnabled = function() {
  return this.find({ isEnabled: true }).sort({ name: 1 });
};

module.exports = mongoose.model('BlogRegion', BlogRegionSchema); 