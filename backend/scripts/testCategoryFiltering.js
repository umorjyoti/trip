const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Trek = require('../models/Trek');

async function testCategoryFiltering() {
  try {
    console.log('Testing category filtering...');
    
    // Test each category
    const categories = ['all-treks', 'monsoon-treks', 'sunrise-treks', 'himalayan-treks', 'backpacking-trips', 'long-weekend'];
    
    for (const category of categories) {
      console.log(`\n=== Testing category: ${category} ===`);
      
      if (category === 'all-treks') {
        // For all-treks, get all treks
        const allTreks = await Trek.find({ isEnabled: true });
        console.log(`All treks: ${allTreks.length} treks`);
        allTreks.forEach(trek => {
          console.log(`  - ${trek.name} (${trek.category})`);
        });
      } else {
        // For specific categories, filter by category
        const filteredTreks = await Trek.find({ 
          category: category,
          isEnabled: true 
        });
        console.log(`${category}: ${filteredTreks.length} treks`);
        filteredTreks.forEach(trek => {
          console.log(`  - ${trek.name} (${trek.category})`);
        });
      }
    }
    
    // Test URL parameter format
    console.log('\n=== URL Parameter Test ===');
    console.log('Expected URL formats:');
    categories.forEach(category => {
      console.log(`  /treks?category=${category}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run test
testCategoryFiltering(); 