const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Trek = require('../models/Trek');
require('dotenv').config();

const migrateRemarksHistory = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all bookings with adminRemarks but no remarksHistory
    const bookings = await Booking.find({
      adminRemarks: { $exists: true, $ne: '' },
      $or: [
        { remarksHistory: { $exists: false } },
        { remarksHistory: { $size: 0 } }
      ]
    });

    console.log(`Found ${bookings.length} bookings with adminRemarks to migrate`);

    let migratedCount = 0;
    for (const booking of bookings) {
      if (booking.adminRemarks && booking.adminRemarks.trim()) {
        try {
          // Create a default remarks history entry
          const defaultEntry = {
            remarks: booking.adminRemarks.trim(),
            addedBy: new mongoose.Types.ObjectId(), // Create a dummy ObjectId for migration
            addedByUsername: 'System Migration',
            addedAt: booking.updatedAt || booking.createdAt || new Date()
          };

          // Initialize remarksHistory array if it doesn't exist
          if (!booking.remarksHistory) {
            booking.remarksHistory = [];
          }

          // Add the default entry
          booking.remarksHistory.push(defaultEntry);
          
          await booking.save();
          migratedCount++;
          
          if (migratedCount % 100 === 0) {
            console.log(`Migrated ${migratedCount} bookings...`);
          }
        } catch (error) {
          console.error(`Failed to migrate booking ${booking._id}:`, error.message);
        }
      }
    }

    console.log(`Successfully migrated ${migratedCount} bookings`);
    
    // Verify the migration
    const totalBookingsWithHistory = await Booking.countDocuments({
      remarksHistory: { $exists: true, $ne: [] }
    });
    console.log(`Total bookings with remarksHistory: ${totalBookingsWithHistory}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateRemarksHistory();
}

module.exports = migrateRemarksHistory;
