const mongoose = require('mongoose');
const Trek = require('../models/Trek');
const Region = require('../models/Region');
// require('dotenv').config({ path: '../.env'});
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

console.log('.env file exists:', envExists);

require('dotenv').config({ path: envPath });

// Migration script to add regionName to existing treks
const migrateRegionName = async () => {
  try {
    console.log('Starting regionName migration...');
    
    // Get MongoDB URI from environment or use default
    const mongoUri = process.env.MONGODB_URI ;
    console.log(mongoUri);
    
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
    console.error('Please make sure your .env file contains MONGODB_URI or MongoDB is running on localhost:27017');
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