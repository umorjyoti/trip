const mongoose = require('mongoose');
const { Booking, Trek, User } = require('../models');
const path = require('path');

// Load .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testBatchId() {
  try {
    console.log('🔍 Environment Check:');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found. Please check your .env file.');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const now = new Date();
    const twoDaysFromNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2));
    const threeDaysFromNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 3));

    const bookings = await Booking.find({ status: 'confirmed' })
      .populate('user', 'name email')
      .populate('trek');

    if (!bookings.length) {
      console.log('❌ No confirmed bookings found.');
      return;
    }

    for (const booking of bookings) {
      console.log('\n📋 Booking Details:');
      console.log(`Booking ID: ${booking._id}`);
      console.log(`User: ${booking.user?.email}`);
      console.log(`Trek: ${booking.trek?.name}`);
      console.log(`Status: ${booking.status}`);

      const batchId = booking.batch;
      if (!batchId) {
        console.log('❌ No batch ID in this booking.');
        continue;
      }

      const trek = booking.trek;
      if (!trek || !trek.batches) {
        console.log('❌ Trek or batches not found.');
        continue;
      }

      console.log('\n🔍 Comparing Batch IDs:');
      console.log('Booking Batch ID:', batchId.toString());
      trek.batches.forEach((b, i) => {
        console.log(` [${i}] Trek Batch ID: ${b._id.toString()} ➤ Match: ${b._id.toString() === batchId.toString() ? '✅' : '❌'}`);
      });

      const batch = trek.batches.find(b => b?._id?.toString() === batchId.toString());

      if (!batch) {
        console.log('❌ No matching batch found inside trek.batches.');
        continue;
      }

      const batchStartDate = new Date(batch.startDate);
      const batchEndDate = new Date(batch.endDate);

      console.log('\n✅ Matched Batch Details:');
      console.log(`Batch ID: ${batch._id}`);
      console.log(`Start: ${batchStartDate.toDateString()}`);
      console.log(`End: ${batchEndDate.toDateString()}`);
      console.log(`Participants: ${batch.currentParticipants}/${batch.maxParticipants}`);

      const isInTwoDays = batchStartDate >= twoDaysFromNow && batchStartDate < threeDaysFromNow;
      console.log('\n⏱️ Date Comparison:');
      console.log('Batch Start:', batchStartDate.toISOString());
      console.log('Two Days From Now:', twoDaysFromNow.toISOString());
      console.log('Three Days From Now:', threeDaysFromNow.toISOString());
      console.log(`📅 Starts in 2 days? ${isInTwoDays ? '✅ YES' : '❌ NO'}`);

      // Optional: log all confirmed bookings for the same batch
      const relatedBookings = await Booking.find({
        trek: trek._id,
        batch: batchId,
        status: 'confirmed'
      }).populate('user', 'name email');

      console.log(`\n🔍 Confirmed Bookings for This Batch: Total ${relatedBookings.length}`);
      relatedBookings.forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.user?.email} (${b._id})`);
      });
    }

    console.log('\n🎉 Script completed successfully!');
  } catch (err) {
    console.error('❌ Script Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testBatchId().catch(err => {
  console.error('❌ Uncaught Error:', err);
  process.exit(1);
});
