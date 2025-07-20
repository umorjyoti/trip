const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Trek = require('../models/Trek');

// Category mapping from old to new
const categoryMapping = {
  'mountains': 'himalayan-treks',
  'coastal': 'long-weekend',
  'desert': 'backpacking-trips',
  'adventure': 'backpacking-trips',
  'relaxing': 'long-weekend',
  'cultural': 'long-weekend',
  'party': 'long-weekend'
};

async function migrateTrekCategories() {
  try {
    console.log('Starting trek category migration...');
    
    // Get all treks
    const treks = await Trek.find({});
    console.log(`Found ${treks.length} treks to migrate`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const trek of treks) {
      const oldCategory = trek.category;
      
      if (categoryMapping[oldCategory]) {
        // Update to new category
        trek.category = categoryMapping[oldCategory];
        await trek.save();
        console.log(`Updated trek "${trek.name}" from "${oldCategory}" to "${trek.category}"`);
        updatedCount++;
      } else if (oldCategory && !['all-treks', 'monsoon-treks', 'sunrise-treks', 'himalayan-treks', 'backpacking-trips', 'long-weekend'].includes(oldCategory)) {
        // Set to default if unknown category
        trek.category = 'all-treks';
        await trek.save();
        console.log(`Set trek "${trek.name}" to default category "all-treks" (was "${oldCategory}")`);
        updatedCount++;
      } else {
        console.log(`Skipped trek "${trek.name}" - already has valid category: "${oldCategory}"`);
        skippedCount++;
      }
    }
    
    console.log('\nMigration completed!');
    console.log(`Updated: ${updatedCount} treks`);
    console.log(`Skipped: ${skippedCount} treks`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration
migrateTrekCategories(); 