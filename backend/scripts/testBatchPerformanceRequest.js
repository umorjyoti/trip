const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Trek = require('../models/Trek');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trip', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testBatchPerformanceRequest = async () => {
  try {
    console.log('Testing batch performance API with cancellation requests...\n');

    // Check database connection
    console.log('Database connection status:', mongoose.connection.readyState);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Find a trek with batches
    let trek = await Trek.findOne({ 'batches.0': { $exists: true } });
    
    if (!trek) {
      console.log('No trek with batches found, creating test data...');
      
      // Find any trek
      trek = await Trek.findOne();
      if (!trek) {
        console.log('No treks found in database, creating test trek...');
        
        // Create a test trek
        trek = new Trek({
          name: 'Test Trek',
          description: 'A test trek for testing cancellation requests',
          difficulty: 'Easy',
          duration: '3 days',
          price: 5000,
          maxParticipants: 20,
          region: 'Test Region',
          batches: [{
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
            price: 5000,
            maxParticipants: 20,
            currentParticipants: 0
          }]
        });
        
        await trek.save();
        console.log('Created test trek with batch');
      } else {
        // Add a test batch to existing trek
        const testBatch = {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          price: 5000,
          maxParticipants: 20,
          currentParticipants: 0
        };
        
        trek.batches.push(testBatch);
        await trek.save();
        
        console.log(`Added test batch to trek: ${trek.name}`);
      }
    }

    console.log(`Found trek: ${trek.name} (ID: ${trek._id})`);
    
    const batch = trek.batches[0];
    console.log(`Using batch: ${batch._id} (${batch.startDate} - ${batch.endDate})\n`);

    // Find or create a test user
    let user = await User.findOne();
    if (!user) {
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123'
      });
      await user.save();
      console.log('Created test user');
    }

    // Find bookings for this batch
    let bookings = await Booking.find({
      trek: trek._id,
      batch: batch._id
    });

    console.log(`Found ${bookings.length} bookings for this batch`);

    // Create a test booking with cancellation request if none exists
    if (bookings.length === 0) {
      const testBooking = new Booking({
        trek: trek._id,
        batch: batch._id,
        user: user._id,
        numberOfParticipants: 2,
        participantDetails: [
          { name: 'Test Participant 1', phone: '1234567890', email: 'participant1@example.com' },
          { name: 'Test Participant 2', phone: '0987654321', email: 'participant2@example.com' }
        ],
        totalPrice: 10000,
        status: 'confirmed',
        cancellationRequest: {
          type: 'cancellation',
          status: 'pending',
          reason: 'Test cancellation request',
          requestedAt: new Date()
        }
      });
      
      await testBooking.save();
      console.log('Created test booking with cancellation request');
      
      // Refresh bookings list
      bookings = await Booking.find({
        trek: trek._id,
        batch: batch._id
      });
    }

    console.log(`\nFound ${bookings.length} bookings for this batch\n`);

    // Check each booking for cancellation requests
    let bookingsWithRequests = 0;
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`);
      console.log(`  - ID: ${booking._id}`);
      console.log(`  - Status: ${booking.status}`);
      console.log(`  - User: ${booking.user?.name || 'N/A'}`);
      
      if (booking.cancellationRequest) {
        bookingsWithRequests++;
        console.log(`  - Cancellation Request: YES`);
        console.log(`    Type: ${booking.cancellationRequest.type}`);
        console.log(`    Status: ${booking.cancellationRequest.status}`);
        console.log(`    Reason: ${booking.cancellationRequest.reason}`);
        console.log(`    Requested At: ${booking.cancellationRequest.requestedAt}`);
      } else {
        console.log(`  - Cancellation Request: NO`);
      }
      console.log('');
    });

    console.log(`Summary: ${bookingsWithRequests} out of ${bookings.length} bookings have cancellation requests\n`);

    // Test the batch performance API endpoint
    console.log('Testing batch performance API endpoint...');
    
    const { getBatchPerformance } = require('../controllers/trekController');
    
    const req = {
      params: {
        id: trek._id.toString(),
        batchId: batch._id.toString()
      }
    };
    
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`API Response Status: ${code}`);
          console.log('API Response Data:');
          console.log(JSON.stringify(data, null, 2));
          
          // Check if cancellation requests are included
          if (data.bookingDetails) {
            const requestsInResponse = data.bookingDetails.filter(booking => 
              booking.cancellationRequest
            );
            console.log(`\nCancellation requests in API response: ${requestsInResponse.length}`);
            
            requestsInResponse.forEach((booking, index) => {
              console.log(`  Booking ${index + 1}:`);
              console.log(`  - ID: ${booking.bookingId}`);
              console.log(`  - Request Type: ${booking.cancellationRequest.type}`);
              console.log(`  - Request Status: ${booking.cancellationRequest.status}`);
            });
          }
        }
      })
    };

    await getBatchPerformance(req, res);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

testBatchPerformanceRequest(); 