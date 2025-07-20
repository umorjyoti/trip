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
      }
    });
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', SettingsSchema); 