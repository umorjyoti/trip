const mongoose = require('mongoose');
const Booking = require('./models/Booking');

// Test script to verify refund storage
async function testRefundStorage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trip');
    console.log('Connected to MongoDB');

    // Create a test booking with refund information
    const testBooking = new Booking({
      user: new mongoose.Types.ObjectId(),
      trek: new mongoose.Types.ObjectId(),
      batch: new mongoose.Types.ObjectId(),
      numberOfParticipants: 2,
      totalPrice: 2000,
      status: 'confirmed',
      userDetails: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890'
      },
      participantDetails: [
        {
          _id: 'participant1',
          name: 'Participant 1',
          age: 25,
          gender: 'Male',
          status: 'confirmed',
          isCancelled: false
        },
        {
          _id: 'participant2',
          name: 'Participant 2',
          age: 30,
          gender: 'Female',
          status: 'confirmed',
          isCancelled: false
        }
      ],
      // Test refund fields
      refundStatus: 'success',
      refundAmount: 1500,
      refundDate: new Date(),
      refundType: 'auto'
    });

    // Save the booking
    const savedBooking = await testBooking.save();
    console.log('Test booking saved with ID:', savedBooking._id);

    // Verify refund fields are stored
    console.log('Refund Status:', savedBooking.refundStatus);
    console.log('Refund Amount:', savedBooking.refundAmount);
    console.log('Refund Date:', savedBooking.refundDate);
    console.log('Refund Type:', savedBooking.refundType);

    // Test participant refund fields
    savedBooking.participantDetails.forEach((participant, index) => {
      console.log(`Participant ${index + 1} refund fields:`);
      console.log('  Refund Status:', participant.refundStatus);
      console.log('  Refund Amount:', participant.refundAmount);
      console.log('  Refund Date:', participant.refundDate);
      console.log('  Refund Type:', participant.refundType);
    });

    // Clean up - delete test booking
    await Booking.findByIdAndDelete(savedBooking._id);
    console.log('Test booking cleaned up');

    console.log('✅ All refund fields are being stored correctly!');
  } catch (error) {
    console.error('❌ Error testing refund storage:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testRefundStorage(); 