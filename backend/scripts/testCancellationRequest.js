const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Trek = require('../models/Trek');
require('dotenv').config();

async function createTestCancellationRequest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first booking that doesn't have a cancellation request
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

    // Create a test cancellation request
    booking.cancellationRequest = {
      type: 'cancellation',
      reason: 'Test cancellation request - unable to attend due to personal reasons',
      preferredBatch: null,
      requestedAt: new Date(),
      status: 'pending',
      adminResponse: '',
      respondedAt: null
    };

    await booking.save();
    console.log('Test cancellation request created successfully!');
    console.log('Booking ID:', booking._id);
    console.log('Cancellation request:', booking.cancellationRequest);

  } catch (error) {
    console.error('Error creating test cancellation request:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestCancellationRequest(); 