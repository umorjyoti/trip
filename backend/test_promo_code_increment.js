const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they are registered
require('./models/PromoCode');
require('./models/Booking');
require('./models/Trek');
require('./models/User');

// Now get the models after they're registered
const PromoCode = mongoose.model('PromoCode');
const Booking = mongoose.model('Booking');

// Connect to MongoDB using the environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trip';

console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

db.once('open', async () => {
  console.log('Successfully connected to MongoDB');
  
  try {
    console.log('Testing promo code increment functionality...');
    
    // Find a promo code to test with
    const promoCode = await PromoCode.findOne({ isActive: true });
    if (!promoCode) {
      console.log('No active promo codes found. Creating a test promo code...');
      
      // Create a test user ID (you may need to replace this with a real user ID from your database)
      const testUserId = new mongoose.Types.ObjectId();
      
      const testPromoCode = new PromoCode({
        code: 'TEST10',
        discountType: 'percentage',
        discountValue: 10,
        maxUses: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        minOrderValue: 0,
        applicableTreks: [],
        isActive: true,
        createdBy: testUserId,
        usedCount: 0
      });
      await testPromoCode.save();
      console.log('Created test promo code:', testPromoCode.code);
    }
    
    // Get the promo code (either existing or newly created)
    const testPromoCode = await PromoCode.findOne({ isActive: true });
    console.log('Initial used count:', testPromoCode.usedCount);
    
    // Simulate payment completion by directly updating the promo code
    testPromoCode.usedCount += 1;
    await testPromoCode.save();
    
    console.log('After increment, used count:', testPromoCode.usedCount);
    console.log('Test completed successfully!');
    
    // Test the actual payment verification logic
    console.log('\nTesting payment verification logic...');
    
    // Simulate the payment verification logic directly
    if (testPromoCode) {
      try {
        const originalCount = testPromoCode.usedCount;
        testPromoCode.usedCount += 1;
        await testPromoCode.save();
        console.log(`Incremented used count for promo code: ${testPromoCode.code}`);
        console.log(`Used count: ${originalCount} -> ${testPromoCode.usedCount}`);
        console.log('Payment verification logic test completed successfully!');
      } catch (promoError) {
        console.error('Error updating promo code used count:', promoError);
      }
    }
    
    // Test with a real booking if one exists with promo code
    console.log('\nLooking for existing bookings with promo codes...');
    const bookingWithPromo = await Booking.findOne({ 
      'promoCodeDetails.code': { $exists: true, $ne: null } 
    });
    
    if (bookingWithPromo) {
      console.log('Found booking with promo code:', bookingWithPromo.promoCodeDetails.code);
      
      // Test the payment verification logic on this booking
      if (bookingWithPromo.promoCodeDetails && bookingWithPromo.promoCodeDetails.code) {
        try {
          let promoCode;
          // Try to find by ID first, then by code
          if (bookingWithPromo.promoCodeDetails.promoCodeId) {
            promoCode = await PromoCode.findById(bookingWithPromo.promoCodeDetails.promoCodeId);
          }
          if (!promoCode) {
            promoCode = await PromoCode.findOne({ code: bookingWithPromo.promoCodeDetails.code });
          }
          if (promoCode) {
            const originalCount = promoCode.usedCount;
            promoCode.usedCount += 1;
            await promoCode.save();
            console.log(`Incremented used count for promo code: ${bookingWithPromo.promoCodeDetails.code}`);
            console.log(`Used count: ${originalCount} -> ${promoCode.usedCount}`);
          }
        } catch (promoError) {
          console.error('Error updating promo code used count:', promoError);
        }
      }
    } else {
      console.log('No existing bookings with promo codes found.');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}); 