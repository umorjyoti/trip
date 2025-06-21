const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Trek = require('../models/Trek');
const Batch = require('../models/Batch');
const { sendBookingReminderEmail } = require('../controllers/bookingController');
require('dotenv').config({ path: '../.env' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Find all confirmed bookings with a batch starting in 1 day
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

  // Find batches starting tomorrow
  const batches = await Batch.find({
    startDate: { $gte: tomorrow, $lt: dayAfter }
  });
  const batchIds = batches.map(b => b._id);

  // Find bookings for those batches
  const bookings = await Booking.find({
    batch: { $in: batchIds },
    status: 'confirmed'
  }).populate('trek').populate('batch');

  for (const booking of bookings) {
    const trek = booking.trek;
    const batch = booking.batch;
    await sendBookingReminderEmail(booking, trek, batch);
    console.log(`Sent reminder to ${booking.userDetails.email} for trek ${trek.name}`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error sending booking reminders:', err);
  process.exit(1);
}); 