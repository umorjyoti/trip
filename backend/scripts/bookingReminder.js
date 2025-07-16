const mongoose = require('mongoose');
const { Booking, Trek, User } = require('../models');
const { sendBookingReminderEmail } = require('../utils/email');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Booking Reminder Script
 * Sends reminder emails to users 2 days before their trek starts
 */
async function sendBookingReminders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate 2 days from today
    const twoDaysFromToday = new Date(today);
    twoDaysFromToday.setDate(today.getDate() + 2);

    // Calculate 3 days from today (for range check)
    const threeDaysFromToday = new Date(today);
    threeDaysFromToday.setDate(today.getDate() + 3);

    console.log('\n📅 Date Range for Reminders:');
    console.log(`   Today: ${today.toDateString()}`);
    console.log(`   2 days from today: ${twoDaysFromToday.toDateString()}`);
    console.log(`   3 days from today: ${threeDaysFromToday.toDateString()}`);

    // Get all confirmed bookings
    const confirmedBookings = await Booking.find({ 
      status: 'confirmed' 
    }).populate('user', 'name email').populate('trek');

    console.log(`\n📋 Found ${confirmedBookings.length} confirmed bookings`);

    let processedBookings = 0;
    let eligibleBookings = 0;
    let remindersSent = 0;
    let errors = 0;

    // Process each booking
    for (const booking of confirmedBookings) {
      try {
        processedBookings++;

        // Get booking details
        const bookingId = booking._id;
        const userId = booking.user?._id;
        const userEmail = booking.user?.email;
        const userName = booking.user?.name;
        const trekId = booking.trek?._id;
        const trekName = booking.trek?.name;
        const batchId = booking.batch;

        console.log(`\n📦 Processing Booking ${processedBookings}/${confirmedBookings.length}:`);
        console.log(`   Booking ID: ${bookingId}`);
        console.log(`   User: ${userName} (${userEmail})`);
        console.log(`   Trek: ${trekName}`);
        console.log(`   Batch ID: ${batchId}`);

        // Validate required data
        if (!userId || !userEmail || !trekId || !trekName || !batchId) {
          console.log(`   ❌ Missing required data - skipping`);
          continue;
        }

        // Get trek and find the specific batch
        const trek = booking.trek;
        if (!trek || !trek.batches || !Array.isArray(trek.batches)) {
          console.log(`   ❌ Trek or batches data missing - skipping`);
          continue;
        }

        // Find the batch in trek.batches array
        const batch = trek.batches.find(b => b._id.toString() === batchId.toString());
        if (!batch) {
          console.log(`   ❌ Batch ${batchId} not found in trek "${trekName}" - skipping`);
          continue;
        }

        // Get batch start date
        const batchStartDate = new Date(batch.startDate);
        const batchEndDate = new Date(batch.endDate);

        console.log(`   📅 Batch Start: ${batchStartDate.toDateString()}`);
        console.log(`   📅 Batch End: ${batchEndDate.toDateString()}`);

        // Check if batch starts in exactly 2 days
        const isStartingInTwoDays = batchStartDate >= twoDaysFromToday && batchStartDate < threeDaysFromToday;

        if (!isStartingInTwoDays) {
          const daysUntilTrip = Math.ceil((batchStartDate - today) / (1000 * 60 * 60 * 24));
          console.log(`   ⏰ Not starting in 2 days (${daysUntilTrip} days until trip) - skipping`);
          continue;
        }

        // Additional check: Ensure batch starts in the future
        if (batchStartDate <= today) {
          console.log(`   ⚠️  Batch starts today or in the past - skipping`);
          continue;
        }

        eligibleBookings++;
        console.log(`   🎯 ELIGIBLE: Batch starts in exactly 2 days!`);

        // Send reminder email
        try {
          console.log(`   📧 Sending reminder email to ${userEmail}...`);
          
          await sendBookingReminderEmail(booking, trek, booking.user, batch);
          
          console.log(`   ✅ Reminder sent successfully to ${userEmail}`);
          remindersSent++;

        } catch (emailError) {
          console.log(`   ❌ Failed to send email to ${userEmail}: ${emailError.message}`);
          errors++;
        }

      } catch (bookingError) {
        console.log(`   ❌ Error processing booking: ${bookingError.message}`);
        errors++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BOOKING REMINDER SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Total bookings processed: ${processedBookings}`);
    console.log(`   Eligible bookings (starting in 2 days): ${eligibleBookings}`);
    console.log(`   Reminders sent successfully: ${remindersSent}`);
    console.log(`   Errors encountered: ${errors}`);
    console.log(`   Success rate: ${eligibleBookings > 0 ? Math.round((remindersSent / eligibleBookings) * 100) : 0}%`);

    if (remindersSent === 0) {
      console.log('\n💡 No reminders sent. Possible reasons:');
      console.log('   • No confirmed bookings have trips starting in exactly 2 days');
      console.log('   • All eligible bookings failed to send emails');
      console.log('   • Trips might be starting today, tomorrow, or in the past');
      console.log('   • Check your booking dates and email configuration');
    } else {
      console.log(`\n🎉 Successfully sent ${remindersSent} reminder emails!`);
    }

  } catch (error) {
    console.error('❌ Fatal error in booking reminder script:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
sendBookingReminders().catch(error => {
  console.error('❌ Uncaught error:', error);
  process.exit(1);
});
