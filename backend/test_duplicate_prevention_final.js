const mongoose = require('mongoose');
const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = null;
let testTrekId = null;
let testBatchId = null;
let testUserId = null;

// Helper function to make authenticated requests
const makeAuthRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test functions
const loginUser = async () => {
  try {
    console.log('🔐 Logging in test user...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    testUserId = response.data.user._id;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

const getTestTrek = async () => {
  try {
    console.log('🏔️ Getting test trek...');
    const response = await makeAuthRequest('GET', '/treks');
    const trek = response.data.find(t => t.isEnabled && t.batches && t.batches.length > 0);
    if (!trek) {
      throw new Error('No enabled trek with batches found');
    }
    testTrekId = trek._id;
    testBatchId = trek.batches[0]._id;
    console.log(`✅ Found test trek: ${trek.name} with batch: ${testBatchId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to get test trek:', error.response?.data || error.message);
    return false;
  }
};

const createBooking = async (bookingData) => {
  try {
    console.log('📝 Creating booking...');
    const response = await makeAuthRequest('POST', '/bookings', bookingData);
    console.log(`✅ Booking created: ${response.data._id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Booking creation failed:', error.response?.data || error.message);
    throw error;
  }
};

const testDuplicatePrevention = async () => {
  console.log('\n🧪 Testing duplicate booking prevention...');
  
  const bookingData = {
    trekId: testTrekId,
    batchId: testBatchId,
    numberOfParticipants: 1,
    addOns: [],
    userDetails: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890'
    },
    totalPrice: 1000
  };

  try {
    // First booking should succeed
    console.log('\n📝 Attempt 1: Creating first booking...');
    const firstBooking = await createBooking(bookingData);
    console.log(`✅ First booking created: ${firstBooking._id}`);

    // Second booking should fail with 409
    console.log('\n📝 Attempt 2: Creating duplicate booking...');
    try {
      await createBooking(bookingData);
      console.log('❌ Second booking should have failed but succeeded');
      return false;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Second booking correctly rejected with 409 status');
        console.log(`📋 Error message: ${error.response.data.message}`);
        console.log(`📋 Existing booking ID: ${error.response.data.existingBooking}`);
        return true;
      } else {
        console.log(`❌ Expected 409 status but got ${error.response?.status}`);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
};

const cleanupTestData = async () => {
  try {
    console.log('\n🧹 Cleaning up test data...');
    
    // Get all bookings for test user
    const response = await makeAuthRequest('GET', '/bookings/user');
    const bookings = response.data;
    
    // Delete all test bookings
    for (const booking of bookings) {
      if (booking.status === 'pending' || booking.status === 'pending_payment') {
        await makeAuthRequest('DELETE', `/bookings/${booking._id}`);
        console.log(`🗑️ Deleted booking: ${booking._id}`);
      }
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.response?.data || error.message);
  }
};

// Main test execution
const runTests = async () => {
  console.log('🚀 Starting duplicate booking prevention tests...\n');
  
  try {
    // Setup
    if (!(await loginUser())) {
      console.log('❌ Setup failed - cannot proceed with tests');
      return;
    }
    
    if (!(await getTestTrek())) {
      console.log('❌ Setup failed - cannot proceed with tests');
      return;
    }
    
    // Run tests
    const testResult = await testDuplicatePrevention();
    
    // Cleanup
    await cleanupTestData();
    
    // Results
    console.log('\n📊 Test Results:');
    if (testResult) {
      console.log('✅ All tests passed! Duplicate booking prevention is working correctly.');
    } else {
      console.log('❌ Some tests failed. Please check the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    console.log('\n🏁 Tests completed');
    process.exit(0);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 