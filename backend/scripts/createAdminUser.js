require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trekking-club')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ 
      $or: [
        { email: 'admin@example.com' },
        { role: 'admin' }
      ]
    });
    
    if (adminExists) {
      console.log('Admin user already exists');
      
      // Update the role if it's not set
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
        console.log('Updated existing user to admin role');
      }
    } else {
      // Create a new admin user
      const password = 'admin123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser(); 