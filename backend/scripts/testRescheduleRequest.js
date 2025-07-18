const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Trek = require('../models/Trek');
require('dotenv').config();

async function createTestRescheduleRequest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a booking that doesn't have a cancellation request
    const booking = await Booking.findOne({ 
      cancellationRequest: { $exists: false } 
    }).populate('user trek');

    if (!booking) {
      console.log('No booking found without cancellation request');
      return;
    }

    console.log('Found booking:', booking._id);
    console.log('User:', booking.user ? booking.user.name : 'No user');
    console.log('Trek:', booking.trek ? booking.trek.name : 'No trek');
    console.log('Current batch:', booking.batch);

    // Get the trek with full batch details
    const trek = await Trek.findById(booking.trek._id);
    if (!trek || !trek.batches || trek.batches.length === 0) {
      console.log('No batches found for trek');
      return;
    }

    // Find a different batch to use as preferred batch
    const currentBatchId = booking.batch.toString();
    const availableBatches = trek.batches.filter(batch => 
      batch._id.toString() !== currentBatchId && 
      batch.currentParticipants < batch.maxParticipants
    );

    if (availableBatches.length === 0) {
      console.log('No available batches for rescheduling');
      return;
    }

    const preferredBatch = availableBatches[0];
    console.log('Selected preferred batch:', preferredBatch._id);
    console.log('Preferred batch details:', {
      startDate: preferredBatch.startDate,
      endDate: preferredBatch.endDate,
      price: preferredBatch.price
    });

    // Create a test reschedule request
    booking.cancellationRequest = {
      type: 'reschedule',
      reason: 'Test reschedule request - need to change dates due to schedule conflict',
      preferredBatch: preferredBatch._id,
      requestedAt: new Date(),
      status: 'pending',
      adminResponse: '',
      respondedAt: null
    };

    await booking.save();
    console.log('Test reschedule request created successfully!');
    console.log('Booking ID:', booking._id);
    console.log('Cancellation request:', booking.cancellationRequest);

  } catch (error) {
    console.error('Error creating test reschedule request:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestRescheduleRequest(); 