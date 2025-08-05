const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function
const migrateUsers = async () => {
  try {
    console.log('Starting migration: Adding adminCreated field to users...');
    
    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find all users that don't have the adminCreated field
    const usersToUpdate = await usersCollection.find({
      adminCreated: { $exists: false }
    }).toArray();
    
    console.log(`Found ${usersToUpdate.length} users without adminCreated field`);
    
    if (usersToUpdate.length > 0) {
      // Update all users to add adminCreated: false
      const result = await usersCollection.updateMany(
        { adminCreated: { $exists: false } },
        { $set: { adminCreated: false } }
      );
      
      console.log(`Successfully updated ${result.modifiedCount} users`);
      console.log('Migration completed successfully!');
    } else {
      console.log('No users found that need updating. Migration completed!');
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the migration
const runMigration = async () => {
  await connectDB();
  await migrateUsers();
};

// Execute migration
runMigration().catch(console.error); 