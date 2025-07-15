const mongoose = require('mongoose');
const path = require('path');

// Load .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testModels() {
  try {
    console.log('🔍 Testing Model Loading...');
    
    // Test if environment variables are loaded
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found');
      return;
    }

    console.log('✅ Environment variables loaded');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Test loading all models
    console.log('\n📦 Testing Model Imports...');
    
    try {
      const { 
        Batch, 
        Booking, 
        Trek, 
        User, 
        UserGroup, 
        Ticket, 
        TrekSection, 
        Offer, 
        PromoCode, 
        Region, 
        Lead, 
        LeadHistory, 
        CareerApplication, 
        Blog 
      } = require('../models');

      console.log('✅ All models imported successfully');
      
      // Test if models are registered
      console.log('\n🔍 Testing Model Registration...');
      
      const models = [
        { name: 'Batch', model: Batch },
        { name: 'Booking', model: Booking },
        { name: 'Trek', model: Trek },
        { name: 'User', model: User },
        { name: 'UserGroup', model: UserGroup },
        { name: 'Ticket', model: Ticket },
        { name: 'TrekSection', model: TrekSection },
        { name: 'Offer', model: Offer },
        { name: 'PromoCode', model: PromoCode },
        { name: 'Region', model: Region },
        { name: 'Lead', model: Lead },
        { name: 'LeadHistory', model: LeadHistory },
        { name: 'CareerApplication', model: CareerApplication },
        { name: 'Blog', model: Blog }
      ];

      for (const { name, model } of models) {
        if (model && typeof model === 'function') {
          console.log(`✅ ${name} model registered`);
        } else {
          console.log(`❌ ${name} model not properly registered`);
        }
      }

      // Test a simple query
      console.log('\n🔍 Testing Simple Query...');
      
      const userCount = await User.countDocuments();
      console.log(`✅ User count query successful: ${userCount} users`);

      const bookingCount = await Booking.countDocuments();
      console.log(`✅ Booking count query successful: ${bookingCount} bookings`);

      const trekCount = await Trek.countDocuments();
      console.log(`✅ Trek count query successful: ${trekCount} treks`);

      console.log('\n🎉 All model tests passed!');

    } catch (error) {
      console.error('❌ Error loading models:', error.message);
    }

  } catch (error) {
    console.error('❌ Error in model test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testModels().catch(err => {
  console.error('❌ Fatal error in model test:', err);
  process.exit(1);
}); 