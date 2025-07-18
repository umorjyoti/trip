const path = require('path');
const fs = require('fs');

console.log('🔍 Environment File Check:');
console.log('Current directory:', __dirname);
console.log('Parent directory:', path.dirname(__dirname));
console.log('Looking for .env at:', path.join(__dirname, '..', '.env'));

const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

console.log('.env file exists:', envExists);

if (envExists) {
  console.log('✅ .env file found!');
  
  // Load the .env file
  require('dotenv').config({ path: envPath });
  
  console.log('Environment variables loaded:');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('EMAIL_HOST exists:', !!process.env.EMAIL_HOST);
  console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
  
  if (process.env.MONGODB_URI) {
    console.log('MONGODB_URI length:', process.env.MONGODB_URI.length);
    console.log('MONGODB_URI starts with:', process.env.MONGODB_URI.substring(0, 20) + '...');
  }
} else {
  console.log('❌ .env file not found!');
  console.log('Please create a .env file in the backend directory with your MongoDB URI and email configuration.');
} 