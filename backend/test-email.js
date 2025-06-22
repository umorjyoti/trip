const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfig() {
  console.log('=== Email Configuration Test ===');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET');
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'NOT SET');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
  console.log('');

  // Check if we have the required variables
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Missing required environment variables!');
    console.log('Please add these to your .env file:');
    console.log('EMAIL_HOST=smtp.hostinger.com');
    console.log('EMAIL_PORT=587');
    console.log('EMAIL_USER=your_email@yourdomain.com');
    console.log('EMAIL_PASS=your_password');
    return;
  }

  console.log('✅ All environment variables are set');
  console.log('');

  // Test transporter creation
  try {
    console.log('Testing transporter creation...');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('✅ Transporter verified successfully!');
    console.log('');

    // Test email sending
    console.log('Testing email sending...');
    const testEmail = {
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Test Email from Trek App',
      text: 'This is a test email to verify your email configuration is working correctly.',
      html: '<h1>Test Email</h1><p>This is a test email to verify your email configuration is working correctly.</p>'
    };

    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox for the test email.');

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('');
    console.log('Common solutions:');
    console.log('1. Check if your email credentials are correct');
    console.log('2. Ensure SMTP is enabled in your Hostinger email settings');
    console.log('3. Try using port 465 with SSL instead of 587 with TLS');
    console.log('4. Check if your email account is active and not suspended');
  }
}

testEmailConfig().catch(console.error); 