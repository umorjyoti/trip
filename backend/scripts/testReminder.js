const mongoose = require('mongoose');
const { Booking, Trek, User } = require('../models');
const { sendBookingReminderEmail } = require('../utils/email');
const path = require('path');

// Load .env file from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testReminder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Calculate today and 2 days from today (both at midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysFromToday = new Date(today);
    twoDaysFromToday.setDate(today.getDate() + 2);

    // Fetch all confirmed bookings
    const bookings = await Booking.find({ status: 'confirmed' })
      .populate('user', 'name email')
      .populate('trek');

    if (!bookings.length) {
      console.log('❌ No confirmed bookings found');
      return;
    }

    let remindersSent = 0;
    let skipped = 0;

    for (const booking of bookings) {
      console.log('\n📋 Booking:');
      console.log(`Booking ID: ${booking._id}`);
      console.log(`User: ${booking.user?.email}`);
      console.log(`Trek: ${booking.trek?.name}`);

      const batchId = booking.batch;
      const trek = booking.trek;

      if (!batchId || !trek || !trek.batches || !Array.isArray(trek.batches)) {
        console.log('❌ Invalid trek or batch data. Skipping...');
        skipped++;
        continue;
      }

      // Debug: Show all batch IDs in trek.batches and the booking.batch
      const batchIdStr = batchId.toString();
      const trekBatchIds = trek.batches.map(b => b._id.toString());
      console.log('Booking batch:', batchIdStr);
      console.log('Trek batches:', trekBatchIds);

      // Always compare as strings
      const batch = trek.batches.find(b => b._id.toString() === batchIdStr);

      if (!batch) {
        console.log(`❌ Batch ID ${batchIdStr} not found in trek "${trek.name}". Trek batches:`, trekBatchIds);
        skipped++;
        continue;
      }

      // Compare batch start date to two days from today (both at midnight)
      const batchStart = new Date(batch.startDate);
      batchStart.setHours(0, 0, 0, 0);
      console.log(`Batch start: ${batchStart.toISOString()} | 2 days from today: ${twoDaysFromToday.toISOString()}`);

      if (batchStart.getTime() !== twoDaysFromToday.getTime()) {
        console.log('⏩ Skipping: Batch does not start in exactly 2 days.');
        skipped++;
        continue;
      }

      // Send reminder email
      console.log('📧 Sending test reminder email...');
      await sendBookingReminderEmail(booking, trek, booking.user, batch);
      console.log('✅ Reminder email sent successfully');
      remindersSent++;
    }

    console.log(`\n🎉 All test reminder emails processed. Sent: ${remindersSent}, Skipped: ${skipped}`);

  } catch (error) {
    console.error('❌ Error in test reminder:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testReminder().catch(err => {
  console.error('❌ Fatal error in test reminder:', err);
  process.exit(1);
});
