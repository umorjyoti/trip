const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  // Enquiry Banner Configuration
  enquiryBanner: {
    isActive: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Banner title cannot exceed 100 characters']
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Banner subtitle cannot exceed 200 characters']
    },
    image: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Banner image must be a valid image URL'
      }
    },
    header: {
      type: String,
      trim: true,
      maxlength: [50, 'Header cannot exceed 50 characters']
    },
    discountText: {
      type: String,
      trim: true,
      maxlength: [100, 'Discount text cannot exceed 100 characters']
    },
    showOverlay: {
      type: Boolean,
      default: true
    }
  },
  // Landing Page Configuration
  landingPage: {
    heroImage: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Hero image must be a valid image URL'
      }
    },
    heroTitle: {
      type: String,
      trim: true,
      maxlength: [100, 'Hero title cannot exceed 100 characters']
    },
    heroSubtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Hero subtitle cannot exceed 200 characters']
    }
  },
  // Blog Page Configuration
  blogPage: {
    heroImage: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Blog hero image must be a valid image URL'
      }
    },
    heroTitle: {
      type: String,
      trim: true,
      maxlength: [100, 'Blog hero title cannot exceed 100 characters']
    },
    heroSubtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Blog hero subtitle cannot exceed 200 characters']
    }
  },
  // Weekend Getaway Page Configuration
  weekendGetawayPage: {
    heroImage: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Weekend getaway hero image must be a valid image URL'
      }
    },
    heroTitle: {
      type: String,
      trim: true,
      maxlength: [100, 'Weekend getaway hero title cannot exceed 100 characters']
    },
    heroSubtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Weekend getaway hero subtitle cannot exceed 200 characters']
    }
  },
  // Add other global settings here in the future
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

// Ensure only one settings document exists
SettingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this({
      enquiryBanner: {
        isActive: false,
        title: '',
        subtitle: '',
        image: '',
        header: '',
        discountText: '',
        showOverlay: true
      },
      landingPage: {
        heroImage: '',
        heroTitle: 'Discover Your Next Adventure',
        heroSubtitle: 'Explore breathtaking trails and create unforgettable memories with Bengaluru Trekkers'
      },
      blogPage: {
        heroImage: '',
        heroTitle: 'Adventure Stories',
        heroSubtitle: 'Discover amazing trekking experiences and travel tales'
      },
      weekendGetawayPage: {
        heroImage: '',
        heroTitle: 'Weekend Escapes',
        heroSubtitle: 'Discover curated short trips designed for maximum refreshment'
      }
    });
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', SettingsSchema); 