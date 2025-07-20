const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Trek = require('../models/Trek');

async function removeEnquiryBannerFromTreks() {
  try {
    console.log('Starting removal of enquiry banner fields from treks...');
    
    // Find all treks that have enquiryBanner field
    const treks = await Trek.find({
      enquiryBanner: { $exists: true }
    });
    
    console.log(`Found ${treks.length} treks with enquiry banner fields`);
    
    let updatedCount = 0;
    
    for (const trek of treks) {
      // Remove the enquiryBanner field
      delete trek.enquiryBanner;
      await trek.save();
      updatedCount++;
      console.log(`Removed enquiry banner from trek: ${trek.name}`);
    }
    
    console.log(`Successfully removed enquiry banner fields from ${updatedCount} treks`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
removeEnquiryBannerFromTreks(); 