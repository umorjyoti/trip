const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Booking = require('../models/Booking');
const Trek = require('../models/Trek');
const User = require('../models/User');

async function testTrekPerformanceRequest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a trek with bookings
    const trek = await Trek.findOne({
      'batches.currentParticipants': { $gt: 0 }
    }).populate({
      path: 'batches',
      populate: {
        path: 'bookings',
        populate: 'user'
      }
    });

    if (!trek) {
      console.log('No trek found with bookings');
      return;
    }

    console.log('Testing trek performance with cancellation requests');
    console.log('Trek:', trek.name);
    console.log('Trek ID:', trek._id);

    // Find a booking with a cancellation request
    const bookingWithRequest = await Booking.findOne({
      trek: trek._id,
      'cancellationRequest.status': 'pending'
    }).populate('user');

    if (bookingWithRequest) {
      console.log('\nFound booking with pending cancellation request:');
      console.log('Booking ID:', bookingWithRequest._id);
      console.log('User:', bookingWithRequest.user?.name);
      console.log('Request Type:', bookingWithRequest.cancellationRequest.type);
      console.log('Request Status:', bookingWithRequest.cancellationRequest.status);
      console.log('Request Reason:', bookingWithRequest.cancellationRequest.reason);
      console.log('Request Date:', bookingWithRequest.cancellationRequest.requestedAt);
    } else {
      console.log('\nNo bookings with pending cancellation requests found');
      
      // Create a test cancellation request
      const testBooking = await Booking.findOne({ trek: trek._id }).populate('user');
      if (testBooking) {
        testBooking.cancellationRequest = {
          type: 'cancellation',
          reason: 'Test cancellation request from trek performance',
          preferredBatch: null,
          requestedAt: new Date(),
          status: 'pending',
          adminResponse: '',
          respondedAt: null
        };
        await testBooking.save();
        console.log('Created test cancellation request for booking:', testBooking._id);
      }
    }

    // Test the trek performance API
    const { getTrekPerformance } = require('../controllers/bookingController');
    
    // Create mock request and response objects
    const req = {
      params: { trekId: trek._id.toString() },
      query: {}
    };
    
    const res = {
      json: (data) => {
        console.log('\n✅ Trek Performance API Response:');
        console.log('Total batches:', data.batches?.length || 0);
        
        if (data.batches && data.batches.length > 0) {
          const batchWithBookings = data.batches.find(b => b.bookingDetails && b.bookingDetails.length > 0);
          if (batchWithBookings) {
            console.log('Batch with bookings found:', batchWithBookings._id);
            console.log('Number of bookings:', batchWithBookings.bookingDetails.length);
            
            const bookingWithRequest = batchWithBookings.bookingDetails.find(b => b.cancellationRequest);
            if (bookingWithRequest) {
              console.log('✅ Booking with cancellation request found in API response:');
              console.log('  - Booking ID:', bookingWithRequest.bookingId);
              console.log('  - Request Type:', bookingWithRequest.cancellationRequest.type);
              console.log('  - Request Status:', bookingWithRequest.cancellationRequest.status);
            } else {
              console.log('❌ No booking with cancellation request found in API response');
            }
          }
        }
      },
      status: (code) => {
        console.log('Status Code:', code);
        return {
          json: (data) => {
            console.log('Error Response:', JSON.stringify(data, null, 2));
          }
        };
      }
    };

    try {
      await getTrekPerformance(req, res);
    } catch (error) {
      console.error('Error testing trek performance API:', error.message);
    }

  } catch (error) {
    console.error('Error testing trek performance request:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testTrekPerformanceRequest(); 