const mongoose = require('mongoose');
const { sendPartialPaymentReminderEmail } = require('../utils/email');
require('dotenv').config();

const Booking = require('../models/Booking');

const sendPartialPaymentReminders = async () => {
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

    console.log('Starting partial payment reminder process...');
    
    // Find bookings with partial payment that are due in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const dueBookings = await Booking.find({
      paymentMode: 'partial',
      status: 'payment_confirmed_partial',
      'partialPaymentDetails.finalPaymentDueDate': {
        $lte: threeDaysFromNow,
        $gte: new Date() // Only future dates
      },
      'partialPaymentDetails.reminderSent': false
    }).populate('trek').populate('user');

    console.log(`Found ${dueBookings.length} bookings with due partial payments`);

    for (const booking of dueBookings) {
      try {
        // Find the actual batch object from trek's batches array
        const batch = booking.trek?.batches?.find(
          (b) => b._id.toString() === booking.batch?.toString()
        );

        // Send reminder email using standard template
        const emailResult = await sendPartialPaymentReminderEmail(
          booking,
          booking.trek,
          booking.user,
          batch
        );

        if (emailResult) {
          // Mark reminder as sent
          booking.partialPaymentDetails.reminderSent = true;
          booking.partialPaymentDetails.reminderSentAt = new Date();
          await booking.save();

          console.log(`Reminder sent for booking ${booking._id}`);
        } else {
          console.error(`Failed to send reminder for booking ${booking._id}`);
        }
      } catch (error) {
        console.error(`Error sending reminder for booking ${booking._id}:`, error);
      }
    }

    console.log('Partial payment reminder process completed');
  } catch (error) {
    console.error('Error in partial payment reminder process:', error);
  } finally {
    // Only disconnect if this script is run standalone
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
};

// Export the function for use in cron jobs
module.exports = { sendPartialPaymentReminders };

// Run the script if called directly
if (require.main === module) {
  sendPartialPaymentReminders()
    .then(() => {
      console.log('🎉 Partial payment reminder script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Partial payment reminder script failed:', error);
      process.exit(1);
    });
} 