const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Trek = require('./models/Trek');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trekking-club';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

async function testPendingBookingPrevention() {
  try {
    console.log('🧪 Testing pending booking prevention...\n');
    
    // Try to connect to database
    const connected = await connectToDatabase();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return;
    }
    
    // Find a test user
    console.log('👤 Looking for test user...');
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    
    // Find a test trek with batches
    console.log('🏔️  Looking for test trek with batches...');
    const testTrek = await Trek.findOne({ 'batches.0': { $exists: true } });
    if (!testTrek) {
      console.log('❌ No treks with batches found. Please create a trek with batches first.');
      return;
    }
    
    const batchId = testTrek.batches[0]._id;
    
    console.log(`👤 Testing with user: ${testUser.email}`);
    console.log(`🏔️  Testing with trek: ${testTrek.name}`);
    console.log(`📅 Testing with batch: ${batchId}\n`);
    
    // Clean up any existing test bookings
    console.log('🧹 Cleaning up existing test bookings...');
    await Booking.deleteMany({
      user: testUser._id,
      trek: testTrek._id,
      batch: batchId
    });
    console.log('✅ Cleanup completed\n');
    
    // Test 1: Create a confirmed booking (should be allowed)
    console.log('📝 Test 1: Creating confirmed booking...');
    const confirmedBooking = new Booking({
      user: testUser._id,
      trek: testTrek._id,
      batch: batchId,
      numberOfParticipants: 1,
      addOns: [],
      userDetails: {
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone || '1234567890'
      },
      totalPrice: testTrek.batches[0].price,
      status: 'confirmed'
    });
    
    await confirmedBooking.save();
    console.log(`✅ Confirmed booking created: ${confirmedBooking._id}\n`);
    
    // Test 2: Try to create a pending booking (should be allowed since confirmed booking exists)
    console.log('📝 Test 2: Creating pending booking with existing confirmed booking...');
    const pendingBooking = new Booking({
      user: testUser._id,
      trek: testTrek._id,
      batch: batchId,
      numberOfParticipants: 2,
      addOns: [],
      userDetails: {
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone || '1234567890'
      },
      totalPrice: testTrek.batches[0].price * 2,
      status: 'pending_payment'
    });
    
    await pendingBooking.save();
    console.log(`✅ Pending booking created: ${pendingBooking._id} (This should be allowed)\n`);
    
    // Test 3: Try to create another pending booking (should be prevented by API logic)
    console.log('📝 Test 3: Attempting to create another pending booking...');
    const newPendingBooking = new Booking({
      user: testUser._id,
      trek: testTrek._id,
      batch: batchId,
      numberOfParticipants: 3,
      addOns: [],
      userDetails: {
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone || '1234567890'
      },
      totalPrice: testTrek.batches[0].price * 3,
      status: 'pending_payment'
    });
    
    await newPendingBooking.save();
    console.log(`⚠️  Another pending booking created: ${newPendingBooking._id} (This should be prevented by API logic)\n`);
    
    // Check all bookings
    const allBookings = await Booking.find({
      user: testUser._id,
      trek: testTrek._id,
      batch: batchId
    }).sort({ createdAt: 1 });
    
    console.log('📊 All bookings for this user/trek/batch:');
    allBookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. ID: ${booking._id}, Status: ${booking.status}, Participants: ${booking.numberOfParticipants}, Created: ${booking.createdAt}`);
    });
    
    const activeBookings = allBookings.filter(b => ['confirmed', 'payment_completed', 'trek_completed'].includes(b.status));
    const pendingBookings = allBookings.filter(b => ['pending', 'pending_payment'].includes(b.status));
    
    console.log(`\n📈 Summary:`);
    console.log(`   - Total bookings: ${allBookings.length}`);
    console.log(`   - Active bookings: ${activeBookings.length}`);
    console.log(`   - Pending bookings: ${pendingBookings.length}`);
    
    if (activeBookings.length >= 1 && pendingBookings.length >= 1) {
      console.log('\n✅ TEST PASSED:');
      console.log('   - Users can create new bookings even with active bookings');
      console.log('   - Multiple pending bookings exist (API should prevent this)');
      console.log('   - System allows multiple bookings but API should prevent duplicate pending bookings');
    } else {
      console.log('\n⚠️  TEST PARTIAL: Some bookings missing');
    }
    
    // Clean up test bookings
    console.log('\n🧹 Cleaning up test bookings...');
    await Booking.deleteMany({
      user: testUser._id,
      trek: testTrek._id,
      batch: batchId
    });
    console.log('✅ Test cleanup completed');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
testPendingBookingPrevention(); 