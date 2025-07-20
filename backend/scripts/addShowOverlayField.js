const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Settings = require('../models/Settings');

async function addShowOverlayField() {
  try {
    console.log('Starting showOverlay field migration...');
    
    // Find all settings documents that don't have showOverlay field
    const settings = await Settings.find({
      $or: [
        { 'enquiryBanner.showOverlay': { $exists: false } },
        { enquiryBanner: { $exists: false } }
      ]
    });
    
    console.log(`Found ${settings.length} settings documents to migrate`);
    
    let updatedCount = 0;
    
    for (const setting of settings) {
      // Add showOverlay field with default value true
      if (!setting.enquiryBanner) {
        setting.enquiryBanner = {
          isActive: false,
          title: '',
          subtitle: '',
          image: '',
          header: '',
          discountText: '',
          showOverlay: true
        };
      } else if (setting.enquiryBanner.showOverlay === undefined) {
        setting.enquiryBanner.showOverlay = true;
      }
      
      await setting.save();
      updatedCount++;
      console.log(`Added showOverlay field to settings document`);
    }
    
    console.log(`Successfully updated ${updatedCount} settings documents`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
addShowOverlayField(); 