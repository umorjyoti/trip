const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Trek = require('../models/Trek');
require('dotenv').config();

async function testRescheduleApproval() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a booking with a pending reschedule request
    const booking = await Booking.findOne({ 
      'cancellationRequest.type': 'reschedule',
      'cancellationRequest.status': 'pending'
    }).populate('user trek');

    if (!booking) {
      console.log('No booking found with pending reschedule request');
      return;
    }

    console.log('Found booking with pending reschedule request:');
    console.log('Booking ID:', booking._id);
    console.log('Current batch:', booking.batch);
    console.log('Preferred batch:', booking.cancellationRequest.preferredBatch);
    console.log('Request reason:', booking.cancellationRequest.reason);

    // Get the trek with full batch details
    const trek = await Trek.findById(booking.trek._id);
    if (!trek || !trek.batches) {
      console.log('Trek or batches not found');
      return;
    }

    // Find current and preferred batches
    const currentBatch = trek.batches.find(batch => 
      batch._id.toString() === booking.batch.toString()
    );
    const preferredBatch = trek.batches.find(batch => 
      batch._id.toString() === booking.cancellationRequest.preferredBatch.toString()
    );

    console.log('\nBefore approval:');
    console.log('Current batch participants:', currentBatch?.currentParticipants);
    console.log('Preferred batch participants:', preferredBatch?.currentParticipants);
    console.log('Preferred batch max participants:', preferredBatch?.maxParticipants);

    // Simulate the approval process
    console.log('\nSimulating approval...');
    
    // Update the request status to approved
    booking.cancellationRequest.status = 'approved';
    booking.cancellationRequest.adminResponse = 'Test approval - booking will be shifted automatically';
    booking.cancellationRequest.respondedAt = new Date();

    // Shift the booking to the preferred batch
    const preferredBatchId = booking.cancellationRequest.preferredBatch;
    
    // Update old batch participants count
    if (currentBatch) {
      currentBatch.currentParticipants = Math.max(0, currentBatch.currentParticipants - booking.numberOfParticipants);
    }

    // Update new batch participants count
    if (preferredBatch) {
      preferredBatch.currentParticipants += booking.numberOfParticipants;
    }

    // Update booking batch
    booking.batch = preferredBatchId;

    // Save changes
    await trek.save();
    await booking.save();

    console.log('\nAfter approval:');
    console.log('Booking batch updated to:', booking.batch);
    console.log('Current batch participants:', currentBatch?.currentParticipants);
    console.log('Preferred batch participants:', preferredBatch?.currentParticipants);
    console.log('Request status:', booking.cancellationRequest.status);
    console.log('Admin response:', booking.cancellationRequest.adminResponse);

    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Error testing reschedule approval:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testRescheduleApproval(); 