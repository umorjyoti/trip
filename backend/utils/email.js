const nodemailer = require('nodemailer');
require('dotenv').config();

function logEmailConfig() {
  console.log('--- EMAIL CONFIG ---');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
  console.log('--------------------');
}

async function createTransporter() {
  logEmailConfig();
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
      port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // useful for local development
      }
    });

    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('Email transporter verified and ready.');
    return transporter;
  } catch (err) {
    console.error('Failed to verify email transporter:', err);
    console.error('Ensure Hostinger email credentials are correct and SMTP is enabled.');
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

    console.log('--- SENDING EMAIL ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    if (html) console.log('HTML: [provided]');
    else console.log('HTML: [not provided]');
    console.log('---------------------');

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    return null;
  }
};

/**
 * Send booking confirmation email with template
 * @param {Object} booking - Booking object
 * @param {Object} trek - Trek object
 * @param {Object} user - User object
 * @param {Array} participants - Participant details array
 * @param {Object} batch - Batch object (optional)
 * @param {string} pickupLocation - Pickup location
 * @param {string} dropLocation - Drop location
 * @param {string} additionalRequests - Additional requests
 */
const sendBookingConfirmationEmail = async (booking, trek, user, participants, batch, pickupLocation, dropLocation, additionalRequests) => {
  const participantList = participants.map((p, index) => 
    `${index + 1}. ${p.name} (Age: ${p.age}, Gender: ${p.gender})`
  ).join('\n');

  const emailSubject = `🎉 Booking Confirmed - ${trek?.name || 'Trek Booking'}`;
  
  const emailContent = `
Dear ${user.name},

🎉 Congratulations! Your booking has been fully confirmed! Thank you for providing all the participant details.

📋 BOOKING CONFIRMATION:
Booking ID: ${booking._id}
Trek: ${trek?.name || 'N/A'}
Dates: ${batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'} to ${batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : 'N/A'}
Total Amount: ₹${booking.totalPrice}
Payment Status: Confirmed

👥 PARTICIPANTS:
${participantList}

📍 PICKUP & DROP LOCATIONS:
Pickup: ${pickupLocation || 'To be confirmed'}
Drop: ${dropLocation || 'To be confirmed'}

📝 ADDITIONAL REQUESTS:
${additionalRequests || 'None'}

⚠️ IMPORTANT INFORMATION:
• Please arrive 15 minutes before the scheduled pickup time
• Bring comfortable trekking shoes and weather-appropriate clothing
• Carry a water bottle and snacks
• Don't forget your ID proof

📞 NEXT STEPS:
Our team will contact you 24-48 hours before the trek with final instructions and pickup details.

❓ NEED HELP?
If you have any questions or need to make changes, please contact us immediately.

🏔️ We look forward to an amazing trek with you!

Best regards,
The Trek Team
Your Adventure Awaits!

---
This is an automated message. Please do not reply to this email.
For support, contact us through our website or mobile app.
  `;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailSubject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .confirmation-container {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .booking-id {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        .section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        .section-title {
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .info-list {
            list-style: none;
            padding: 0;
        }
        .info-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-list li:last-child {
            border-bottom: none;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .booking-id {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏔️ Trek Adventures</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <h2>Dear ${user.name},</h2>
        
        <div class="confirmation-container">
            <div class="section-title">🎉 BOOKING CONFIRMED!</div>
            <p>Your booking has been fully confirmed! Thank you for providing all the participant details.</p>
        </div>

        <div class="section">
            <div class="section-title">📋 Booking Details</div>
            <div class="booking-id">${booking._id}</div>
            <ul class="info-list">
                <li><strong>Trek:</strong> ${trek?.name || 'N/A'}</li>
                <li><strong>Dates:</strong> ${batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'} to ${batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : 'N/A'}</li>
                <li><strong>Total Amount:</strong> ₹${booking.totalPrice}</li>
                <li><strong>Payment Status:</strong> Confirmed</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">👥 Participants</div>
            <ul class="info-list">
                ${participants.map((p, index) => `<li>${index + 1}. ${p.name} (Age: ${p.age}, Gender: ${p.gender})</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📍 Pickup & Drop Locations</div>
            <ul class="info-list">
                <li><strong>Pickup:</strong> ${pickupLocation || 'To be confirmed'}</li>
                <li><strong>Drop:</strong> ${dropLocation || 'To be confirmed'}</li>
            </ul>
        </div>

        ${additionalRequests ? `
        <div class="section">
            <div class="section-title">📝 Additional Requests</div>
            <p>${additionalRequests}</p>
        </div>
        ` : ''}

        <div class="warning">
            <strong>⚠️ Important Information:</strong>
            <ul class="info-list">
                <li>Please arrive 15 minutes before the scheduled pickup time</li>
                <li>Bring comfortable trekking shoes and weather-appropriate clothing</li>
                <li>Carry a water bottle and snacks</li>
                <li>Don't forget your ID proof</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📞 Next Steps</div>
            <p>Our team will contact you 24-48 hours before the trek with final instructions and pickup details.</p>
        </div>

        <div class="section">
            <div class="section-title">❓ Need Help?</div>
            <p>If you have any questions or need to make changes, please contact us immediately.</p>
        </div>

        <p style="text-align: center; font-size: 18px; color: #10b981; margin: 30px 0;">
            🏔️ We look forward to an amazing trek with you!
        </p>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Trek Team<br>
            Your Adventure Awaits!</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #9ca3af;">
                This is an automated message. Please do not reply to this email.<br>
                For support, contact us through our website or mobile app.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  await sendEmail({
    to: user.email,
    subject: emailSubject,
    text: emailContent,
    html: htmlContent
  });
};

/**
 * Send payment received email with template
 * @param {Object} booking - Booking object
 * @param {Object} trek - Trek object
 * @param {Object} user - User object
 * @param {Object} payment - Payment details
 */
const sendPaymentReceivedEmail = async (booking, trek, user, payment) => {
  const emailSubject = `💳 Payment Confirmed - ${trek?.name || 'Trek Booking'}`;
  
  const emailContent = `
Dear ${user.name},

💳 Thank you for your payment! Your booking has been confirmed.

📋 INVOICE DETAILS:
Booking ID: ${booking._id}
Trek: ${trek?.name || 'N/A'}
Participants: ${booking.numberOfParticipants}
Amount Paid: ₹${payment.amount / 100}
Payment Method: ${payment.method}
Payment ID: ${payment.id}
Payment Date: ${new Date().toLocaleDateString()}

📝 NEXT STEPS:
1. Please complete your participant details to finalize your booking
2. You will receive a final confirmation email once all details are submitted
3. Our team will contact you with further instructions

❓ NEED HELP?
If you have any questions, please don't hesitate to contact us.

🏔️ We look forward to an amazing trek with you!

Best regards,
The Trek Team
Your Adventure Awaits!

---
This is an automated message. Please do not reply to this email.
For support, contact us through our website or mobile app.
  `;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailSubject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .payment-container {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .amount {
            font-size: 32px;
            font-weight: bold;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        .section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        .section-title {
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .info-list {
            list-style: none;
            padding: 0;
        }
        .info-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-list li:last-child {
            border-bottom: none;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .amount {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏔️ Trek Adventures</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <h2>Dear ${user.name},</h2>
        
        <div class="payment-container">
            <div class="section-title">💳 Payment Confirmed!</div>
            <p>Thank you for your payment! Your booking has been confirmed.</p>
            <div class="amount">₹${payment.amount / 100}</div>
        </div>

        <div class="section">
            <div class="section-title">📋 Invoice Details</div>
            <ul class="info-list">
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Trek:</strong> ${trek?.name || 'N/A'}</li>
                <li><strong>Participants:</strong> ${booking.numberOfParticipants}</li>
                <li><strong>Amount Paid:</strong> ₹${payment.amount / 100}</li>
                <li><strong>Payment Method:</strong> ${payment.method}</li>
                <li><strong>Payment ID:</strong> ${payment.id}</li>
                <li><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📝 Next Steps</div>
            <ol>
                <li>Please complete your participant details to finalize your booking</li>
                <li>You will receive a final confirmation email once all details are submitted</li>
                <li>Our team will contact you with further instructions</li>
            </ol>
        </div>

        <div class="section">
            <div class="section-title">❓ Need Help?</div>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>

        <p style="text-align: center; font-size: 18px; color: #10b981; margin: 30px 0;">
            🏔️ We look forward to an amazing trek with you!
        </p>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Trek Team<br>
            Your Adventure Awaits!</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #9ca3af;">
                This is an automated message. Please do not reply to this email.<br>
                For support, contact us through our website or mobile app.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  await sendEmail({
    to: user.email,
    subject: emailSubject,
    text: emailContent,
    html: htmlContent
  });
};

module.exports = { 
  sendEmail, 
  sendBookingConfirmationEmail, 
  sendPaymentReceivedEmail 
};
