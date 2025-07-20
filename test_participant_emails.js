// Quick test script for participant confirmation emails
// Run this in your backend directory

const { sendParticipantConfirmationEmails } = require('./utils/email');

// Test data
const testBooking = {
  _id: 'TEST_BOOKING_123',
  totalPrice: 5000
};

const testTrek = {
  name: 'Test Trek - Everest Base Camp'
};

const testUser = {
  name: 'Test Organizer',
  email: 'organizer@test.com'
};

const testParticipants = [
  {
    name: 'John Doe',
    email: 'john@test.com',
    phone: '1234567890',
    age: 25,
    gender: 'Male'
  },
  {
    name: 'Jane Smith',
    email: 'jane@test.com', 
    phone: '0987654321',
    age: 30,
    gender: 'Female'
  }
];

const testBatch = {
  startDate: '2024-02-15',
  endDate: '2024-02-20'
};

// Test the function
async function testParticipantEmails() {
  console.log('🧪 Testing participant confirmation emails...');
  
  try {
    await sendParticipantConfirmationEmails(
      testBooking,
      testTrek,
      testUser,
      testParticipants,
      testBatch,
      'Test additional requests'
    );
    
    console.log('✅ Test completed successfully!');
    console.log('📧 Check your email logs for the test emails');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testParticipantEmails(); 