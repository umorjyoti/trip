const mongoose = require('mongoose');
const Trek = require('../models/Trek');
const Region = require('../models/Region');

// Simple migration script to add regionName to existing treks
const migrateRegionName = async () => {
  try {
    console.log('Starting regionName migration...');
    
    // Use a direct connection string - update this to match your MongoDB setup
    const mongoUri = 'mongodb://localhost:27017/trip'; // Update this to your MongoDB URI
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB successfully');
    
    // Find all treks that don't have regionName
    const treksWithoutRegionName = await Trek.find({ regionName: { $exists: false } });
    
    console.log(`Found ${treksWithoutRegionName.length} treks without regionName`);
    
    if (treksWithoutRegionName.length === 0) {
      console.log('No treks need migration. All treks already have regionName.');
      return;
    }
    
    // Get all regions for lookup
    const regions = await Region.find({});
    const regionMap = {};
    regions.forEach(region => {
      regionMap[region._id.toString()] = region.name;
    });
    
    console.log(`Found ${regions.length} regions for lookup`);
    
    // Update each trek
    for (const trek of treksWithoutRegionName) {
      // Get region name from region collection
      let regionName = 'Unknown Region';
      
      if (trek.region) {
        const regionId = trek.region.toString();
        regionName = regionMap[regionId] || 'Unknown Region';
      }
      
      await Trek.findByIdAndUpdate(trek._id, {
        $set: { regionName: regionName }
      });
      
      console.log(`Updated trek ${trek.name} with regionName: ${regionName}`);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Please update the mongoUri in this script to match your MongoDB connection string');
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  migrateRegionName();
}

module.exports = migrateRegionName; 