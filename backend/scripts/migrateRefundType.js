const mongoose = require('mongoose');
const Booking = require('../models/Booking');

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Migration script to add refundType field to existing bookings
 * This script should be run on production to update existing bookings
 */

async function migrateRefundType() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trip');
    console.log('Connected to MongoDB');

    console.log('🔄 Starting refundType migration...');

    // Update all existing bookings to have refundType field
    const result = await Booking.updateMany(
      { refundType: { $exists: false } },
      { $set: { refundType: 'auto' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} bookings with refundType field`);

    // Update all participant details to have refundType field
    const participantResult = await Booking.updateMany(
      { 'participantDetails.refundType': { $exists: false } },
      { $set: { 'participantDetails.$[].refundType': 'auto' } }
    );

    console.log(`✅ Updated participant details for ${participantResult.modifiedCount} bookings`);

    // Verify the migration
    const bookingsWithoutRefundType = await Booking.countDocuments({
      $or: [
        { refundType: { $exists: false } },
        { 'participantDetails.refundType': { $exists: false } }
      ]
    });

    if (bookingsWithoutRefundType === 0) {
      console.log('✅ Migration completed successfully! All bookings now have refundType field');
    } else {
      console.log(`⚠️  Warning: ${bookingsWithoutRefundType} bookings still missing refundType field`);
    }

    // Show some sample data
    const sampleBooking = await Booking.findOne({ refundType: { $exists: true } });
    if (sampleBooking) {
      console.log('\n📊 Sample booking after migration:');
      console.log('Booking refundType:', sampleBooking.refundType);
      console.log('Participant refundTypes:', sampleBooking.participantDetails.map(p => p.refundType));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateRefundType()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateRefundType }; 