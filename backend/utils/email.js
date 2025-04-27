const nodemailer = require('nodemailer');

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // Use App Password for Gmail
  }
});

/**
 * Send an email using the configured transporter
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email text content
 * @param {string} [options.html] - Email HTML content (optional)
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('Email credentials not configured. Skipping email send.');
      return null;
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw the error, just log it and continue
    return null;
  }
};

module.exports = { sendEmail }; 