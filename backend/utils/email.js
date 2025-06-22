const nodemailer = require('nodemailer');
require('dotenv').config();

async function createTransporter() {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // useful for local development
      }
    });

    await transporter.verify();
    console.log('Email transporter verified and ready.');
    return transporter;
  } catch (err) {
    console.error('Failed to verify email transporter:', err.message);
    console.error('Ensure App Password is used and 2FA is enabled for Gmail.');
    return null;
  }
}

const transporterPromise = createTransporter();

/**
 * Send an email using the configured transporter
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email text content
 * @param {string} [options.html] - Email HTML content (optional)
 * @returns {Promise<object|null>} - Info object or null
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = await transporterPromise;

    if (!transporter) {
      console.warn('Transporter not initialized.');
      return null;
    }

    const mailOptions = {
      from: `"NoReply" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return null;
  }
};

module.exports = { sendEmail };
