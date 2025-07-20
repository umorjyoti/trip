const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Settings = require('../models/Settings');

async function migratePriceToHeader() {
  try {
    console.log('Starting price to header migration...');
    
    // Find all settings documents that have enquiryBanner with price field
    const settings = await Settings.find({
      'enquiryBanner.price': { $exists: true }
    });
    
    console.log(`Found ${settings.length} settings documents to migrate`);
    
    let updatedCount = 0;
    
    for (const setting of settings) {
      // Move price value to header field
      if (setting.enquiryBanner && setting.enquiryBanner.price) {
        setting.enquiryBanner.header = setting.enquiryBanner.price;
        delete setting.enquiryBanner.price;
        await setting.save();
        updatedCount++;
        console.log(`Migrated price "${setting.enquiryBanner.header}" to header for settings document`);
      }
    }
    
    console.log(`Successfully migrated ${updatedCount} settings documents`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migratePriceToHeader(); 