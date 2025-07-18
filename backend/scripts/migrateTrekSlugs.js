const mongoose = require('mongoose');
const Trek = require('../models/Trek');
require('dotenv').config();

// Function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Function to make slug unique
const makeSlugUnique = async (baseSlug, existingId = null) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const query = { slug };
    if (existingId) {
      query._id = { $ne: existingId };
    }
    
    const existing = await Trek.findOne(query);
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

const migrateTrekSlugs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Get all treks without slugs
    const treks = await Trek.find({ $or: [{ slug: { $exists: false } }, { slug: null }] });
    
    console.log(`Found ${treks.length} treks without slugs`);
    
    if (treks.length === 0) {
      console.log('All treks already have slugs');
      return;
    }
    
    // Update each trek with a slug
    for (const trek of treks) {
      const baseSlug = generateSlug(trek.name);
      const uniqueSlug = await makeSlugUnique(baseSlug, trek._id);
      
      await Trek.findByIdAndUpdate(trek._id, { slug: uniqueSlug });
      console.log(`Updated trek "${trek.name}" with slug: ${uniqueSlug}`);
    }
    
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  migrateTrekSlugs();
}

module.exports = { migrateTrekSlugs, generateSlug, makeSlugUnique }; 