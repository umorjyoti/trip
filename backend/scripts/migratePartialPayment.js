const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Trek = require('../models/Trek');

const migratePartialPayment = async () => {
  try {
    console.log('Starting partial payment migration...');
    
    // Find all treks that don't have partial payment configuration
    const treks = await Trek.find({
      $or: [
        { partialPayment: { $exists: false } },
        { 'partialPayment.enabled': { $exists: false } }
      ]
    });

    console.log(`Found ${treks.length} treks to migrate`);

    for (const trek of treks) {
      try {
        // Add default partial payment configuration
        trek.partialPayment = {
          enabled: false,
          amount: 0,
          amountType: 'fixed',
          finalPaymentDueDays: 3,
          autoCancelOnDueDate: true
        };

        await trek.save();
        console.log(`Migrated trek: ${trek.name}`);
      } catch (error) {
        console.error(`Error migrating trek ${trek.name}:`, error);
      }
    }

    console.log('Partial payment migration completed successfully');
  } catch (error) {
    console.error('Error in partial payment migration:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the migration
migratePartialPayment(); 