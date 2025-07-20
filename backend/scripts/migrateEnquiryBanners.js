const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Trek = require('../models/Trek');

async function migrateEnquiryBanners() {
  try {
    console.log('Starting enquiry banner migration...');
    
    // Find all treks that don't have enquiryBanner field
    const treks = await Trek.find({
      $or: [
        { enquiryBanner: { $exists: false } },
        { enquiryBanner: null }
      ]
    });
    
    console.log(`Found ${treks.length} treks to migrate`);
    
    let updatedCount = 0;
    
    for (const trek of treks) {
      // Add default enquiry banner configuration
      trek.enquiryBanner = {
        isActive: false,
        title: '',
        subtitle: '',
        image: '',
        price: '',
        discountText: ''
      };
      
      await trek.save();
      updatedCount++;
      console.log(`Updated trek: ${trek.name}`);
    }
    
    console.log(`Migration completed! Updated ${updatedCount} treks`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateEnquiryBanners();
}

module.exports = migrateEnquiryBanners; 