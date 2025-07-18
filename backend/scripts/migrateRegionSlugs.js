const mongoose = require('mongoose');
const Region = require('../models/Region');
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
    
    const existing = await Region.findOne(query);
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

const migrateRegionSlugs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Get all regions without slugs
    const regions = await Region.find({ $or: [{ slug: { $exists: false } }, { slug: null }] });
    
    console.log(`Found ${regions.length} regions without slugs`);
    
    if (regions.length === 0) {
      console.log('All regions already have slugs');
      return;
    }
    
    // Update each region with a slug
    for (const region of regions) {
      const baseSlug = generateSlug(region.name);
      const uniqueSlug = await makeSlugUnique(baseSlug, region._id);
      
      await Region.findByIdAndUpdate(region._id, { slug: uniqueSlug });
      console.log(`Updated region "${region.name}" with slug: ${uniqueSlug}`);
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
  migrateRegionSlugs();
}

module.exports = { migrateRegionSlugs, generateSlug, makeSlugUnique }; 