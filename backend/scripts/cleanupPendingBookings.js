const mongoose = require('mongoose');
const { Booking, FailedBooking, Trek } = require('../models');
require('dotenv').config();

/**
 * Cleanup Expired Pending Payment Bookings
 * This script removes bookings that have been in pending_payment status for too long
 * and updates the batch participant counts accordingly
 */
async function cleanupExpiredPendingBookings() {
  try {
    // Only connect if not already connected (when run standalone)
    if (require.main === module) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Connected to MongoDB');
    } else {
      // Check if connection is healthy when called from server
      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB connection is not ready. Please ensure the server is properly connected.');
      }
    }

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

    console.log('\n🧹 Cleaning up expired pending payment bookings...');
    console.log(`   Current time: ${now.toISOString()}`);
    console.log(`   Expiry threshold: ${thirtyMinutesAgo.toISOString()}`);

    // Find all expired pending payment bookings
    const expiredBookings = await Booking.find({
      status: 'pending_payment',
      $or: [
        { 'bookingSession.expiresAt': { $lt: now } },
        { 
          'bookingSession.expiresAt': { $exists: false },
          createdAt: { $lt: thirtyMinutesAgo }
        }
      ]
    }).populate('trek');

    console.log(`\n📋 Found ${expiredBookings.length} expired pending payment bookings`);

    if (expiredBookings.length === 0) {
      console.log('✅ No expired bookings to clean up');
      return;
    }

    let processedCount = 0;
    let errorCount = 0;
    const batchUpdates = new Map(); // Track batch updates to avoid duplicate operations

    for (const booking of expiredBookings) {
      try {
        console.log(`\n🔄 Processing booking ${booking._id}...`);
        console.log(`   User: ${booking.user}`);
        console.log(`   Trek: ${booking.trek?.name || 'Unknown'}`);
        console.log(`   Participants: ${booking.numberOfParticipants}`);
        console.log(`   Created: ${booking.createdAt}`);
        console.log(`   Expires: ${booking.bookingSession?.expiresAt || 'No expiry set'}`);

        // Update batch participant count
        if (booking.trek && booking.batch) {
          const batchKey = `${booking.trek._id}_${booking.batch}`;
          
          if (!batchUpdates.has(batchKey)) {
            const trek = await Trek.findById(booking.trek._id);
            if (trek) {
              const batch = trek.batches.id(booking.batch);
              if (batch) {
                // Recalculate current participants by excluding expired pending bookings
                const validBookings = await Booking.find({
                  trek: booking.trek._id,
                  batch: booking.batch,
                  status: { $in: ['payment_completed', 'confirmed', 'trek_completed'] }
                });

                const totalValidParticipants = validBookings.reduce((sum, b) => sum + b.numberOfParticipants, 0);
                
                // Also include non-expired pending bookings
                const activePendingBookings = await Booking.find({
                  trek: booking.trek._id,
                  batch: booking.batch,
                  status: 'pending_payment',
                  'bookingSession.expiresAt': { $gt: now }
                });

                const totalPendingParticipants = activePendingBookings.reduce((sum, b) => sum + b.numberOfParticipants, 0);
                
                const newCurrentParticipants = totalValidParticipants + totalPendingParticipants;
                
                console.log(`   Batch ${batch._id}: ${batch.currentParticipants} → ${newCurrentParticipants}`);
                console.log(`     Valid bookings: ${validBookings.length} (${totalValidParticipants} participants)`);
                console.log(`     Active pending: ${activePendingBookings.length} (${totalPendingParticipants} participants)`);
                
                batch.currentParticipants = newCurrentParticipants;
                await trek.save();
                
                batchUpdates.set(batchKey, true);
              }
            }
          }
        }

        // Archive the expired booking instead of deleting
        const failedBooking = new FailedBooking({
          originalBookingId: booking._id,
          user: booking.user,
          trek: booking.trek._id,
          batch: booking.batch,
          numberOfParticipants: booking.numberOfParticipants,
          addOns: booking.addOns,
          userDetails: booking.userDetails,
          totalPrice: booking.totalPrice,
          bookingSession: booking.bookingSession,
          failureReason: 'session_expired',
          failureDetails: 'Booking session expired without payment completion',
          originalCreatedAt: booking.createdAt,
          originalExpiresAt: booking.bookingSession?.expiresAt || booking.createdAt,
          archivedAt: new Date(),
          archivedBy: 'system'
        });

        await failedBooking.save();
        
        // Delete the original booking after archiving
        await Booking.findByIdAndDelete(booking._id);
        console.log(`   ✅ Archived expired booking ${booking._id} to failed bookings`);
        
        processedCount++;
      } catch (error) {
        console.error(`   ❌ Error processing booking ${booking._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   Total expired bookings: ${expiredBookings.length}`);
    console.log(`   Successfully processed: ${processedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Batches updated: ${batchUpdates.size}`);

    if (errorCount > 0) {
      console.log(`\n⚠️  ${errorCount} bookings had errors during cleanup`);
    }

    console.log('\n✅ Cleanup completed successfully');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    // Only disconnect if this script is run standalone
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupExpiredPendingBookings()
    .then(() => {
      console.log('🎉 Cleanup script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupExpiredPendingBookings }; 