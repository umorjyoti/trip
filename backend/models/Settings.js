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
  // About Page Configuration
  aboutPage: {
    stats: [
      {
        value: {
          type: String,
          trim: true,
          maxlength: [20, 'Stat value cannot exceed 20 characters']
        },
        label: {
          type: String,
          trim: true,
          maxlength: [50, 'Stat label cannot exceed 50 characters']
        },
        isActive: {
          type: Boolean,
          default: true
        }
      }
    ],
    companyProfiles: [
      {
        company: {
          type: String,
          trim: true,
          maxlength: [100, 'Company name cannot exceed 100 characters']
        },
        logo: {
          type: String,
          trim: true,
          maxlength: [10, 'Logo emoji cannot exceed 10 characters']
        },
        logoImage: {
          type: String,
          validate: {
            validator: function(v) {
              if (!v) return true; // Allow empty
              return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: 'Logo image must be a valid image URL'
          }
        },
        description: {
          type: String,
          trim: true,
          maxlength: [200, 'Description cannot exceed 200 characters']
        },
        details: {
          type: String,
          trim: true,
          maxlength: [100, 'Details cannot exceed 100 characters']
        },
        isActive: {
          type: Boolean,
          default: true
        }
      }
    ]
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
      },
      aboutPage: {
        stats: [
          {
            value: '500+',
            label: 'Treks Completed',
            isActive: true
          },
          {
            value: '10K+',
            label: 'Happy Trekkers',
            isActive: true
          },
          {
            value: '50+',
            label: 'Destinations',
            isActive: true
          }
        ],
        companyProfiles: [
          {
            company: 'Infosys',
            logo: '🏢',
            description: 'Team building trek to Kudremukh',
            details: '50+ employees, 3-day adventure',
            isActive: true
          },
          {
            company: 'Wipro',
            logo: '🏢',
            description: 'Corporate retreat to Coorg',
            details: '75+ participants, weekend getaway',
            isActive: true
          },
          {
            company: 'TCS',
            logo: '🏢',
            description: 'Leadership trek to Kodachadri',
            details: '30+ managers, team bonding',
            isActive: true
          },
          {
            company: 'Accenture',
            logo: '🏢',
            description: 'Adventure challenge in Sakleshpur',
            details: '40+ employees, outdoor training',
            isActive: true
          },
          {
            company: 'Cognizant',
            logo: '🏢',
            description: 'Wellness trek to Chikmagalur',
            details: '60+ staff, health & fitness focus',
            isActive: true
          },
          {
            company: 'Tech Mahindra',
            logo: '🏢',
            description: 'Corporate expedition to Mullayanagiri',
            details: '45+ team members, peak climbing',
            isActive: true
          }
        ]
      }
    });
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', SettingsSchema); 