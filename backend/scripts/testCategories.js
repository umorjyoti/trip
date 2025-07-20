const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Trek = require('../models/Trek');

async function testCategories() {
  try {
    console.log('Testing category migration and filtering...');
    
    // Get all treks
    const allTreks = await Trek.find({});
    console.log(`\nTotal treks: ${allTreks.length}`);
    
    // Check categories
    const categories = [...new Set(allTreks.map(trek => trek.category))];
    console.log('\nAvailable categories:', categories);
    
    // Test filtering for each category
    for (const category of categories) {
      const filteredTreks = await Trek.find({ category });
      console.log(`\nCategory "${category}": ${filteredTreks.length} treks`);
      filteredTreks.forEach(trek => {
        console.log(`  - ${trek.name} (${trek.category})`);
      });
    }
    
    // Test specific categories
    const testCategories = ['all-treks', 'monsoon-treks', 'sunrise-treks', 'himalayan-treks', 'backpacking-trips', 'long-weekend'];
    
    console.log('\n=== Testing New Categories ===');
    for (const category of testCategories) {
      const count = await Trek.countDocuments({ category });
      console.log(`${category}: ${count} treks`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run test
testCategories(); 