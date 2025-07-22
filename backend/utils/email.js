const nodemailer = require("nodemailer");
require("dotenv").config();

function logEmailConfig() {
  console.log("--- EMAIL CONFIG ---");
  console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
  console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");
  console.log("--------------------");
}

async function createTransporter() {
  logEmailConfig();
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.hostinger.com",
      port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
      secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // useful for local development
      },
    });

    console.log("Verifying transporter...");
    await transporter.verify();
    console.log("Email transporter verified and ready.");
    return transporter;
  } catch (err) {
    console.error("Failed to verify email transporter:", err);
    console.error(
      "Ensure Hostinger email credentials are correct and SMTP is enabled."
    );
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
      console.warn("Transporter not initialized.");
      return null;
    }

    const mailOptions = {
      from: `"NoReply" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    console.log("--- SENDING EMAIL ---");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text);
    if (html) console.log("HTML: [provided]");
    else console.log("HTML: [not provided]");
    console.log("---------------------");

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
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
 * @param {string} additionalRequests - Additional requests
 */
const sendBookingConfirmationEmail = async (
  booking,
  trek,
  user,
  participants,
  batch,
  additionalRequests
) => {
  const participantList = participants
    .map(
      (p, index) =>
        `${index + 1}. ${p.name} (Age: ${p.age}, Gender: ${p.gender})`
    )
    .join("\n");

  const emailSubject = `🎉 Booking Confirmed - ${trek?.name || "Trek Booking"}`;

  const emailContent = `
Dear ${user.name},

🎉 Congratulations! Your booking has been fully confirmed! Thank you for providing all the participant details.

📋 BOOKING CONFIRMATION:
Booking ID: ${booking._id}
Trek: ${trek?.name || "N/A"}
Dates: ${
    batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : "N/A"
  } to ${batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : "N/A"}
Total Amount: ₹${booking.totalPrice}
Payment Status: Confirmed

👥 PARTICIPANTS:
${participantList}



📝 ADDITIONAL REQUESTS:
${additionalRequests || "None"}

⚠️ IMPORTANT INFORMATION:
• Please arrive 30 minutes before the scheduled pickup time.
• Check the "Things to Carry" list in the itinerary PDF or the event info on our website.
• Carry a water bottle and some snacks.
• Don’t forget to carry 2 Xerox copies and your original ID proof.

📞 NEXT STEPS:
• For treks and trips near Bengaluru, a WhatsApp group will be created one day prior to departure, and all further details will be shared in the group.
• For Himalayan treks, the WhatsApp group will be created one week prior to departure, and all further communication will happen there.

❓ NEED HELP?
DM us or reach out via WhatsApp call only: 9449493112

🔁 Cancellation or Reschedule Requests
You can raise a request through "My Bookings" or "View Bookings" → Support Tickets section.

🏔️ We look forward to an amazing trek with you!

Best regards,
The Bengaluru Trekkers Team
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
            text-align: center;
            margin-bottom: 10px;
        }
        .logo img {
            height: 60px;
            width: auto;
            max-width: 200px;
        }
        }
        .logo-text {
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
            <div class="logo">
                <img src="https://s3.ap-south-1.amazonaws.com/bucket.bengalurutrekkers/images/1753156158875-logo-transperant.png" alt="Bengaluru Trekkers" style="height: 60px; width: auto; max-width: 200px; filter: brightness(0) invert(1); display: block; margin: 0 auto;">
            </div>
            <div class="logo-text">Bengaluru Trekkers</div>
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
                <li><strong>Trek:</strong> ${trek?.name || "N/A"}</li>
                <li><strong>Dates:</strong> ${
                  batch?.startDate
                    ? new Date(batch.startDate).toLocaleDateString()
                    : "N/A"
                } to ${
    batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : "N/A"
  }</li>
                <li><strong>Total Amount:</strong> ₹${booking.totalPrice}</li>
                <li><strong>Payment Status:</strong> Confirmed</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">👥 Participants</div>
            <ul class="info-list">
                ${participants
                  .map(
                    (p, index) =>
                      `<li>${index + 1}. ${p.name} (Age: ${p.age}, Gender: ${
                        p.gender
                      })</li>`
                  )
                  .join("")}
            </ul>
        </div>



        ${
          additionalRequests
            ? `
        <div class="section">
            <div class="section-title">📝 Additional Requests</div>
            <p>${additionalRequests}</p>
        </div>
        `
            : ""
        }

        <div class="warning">
            <strong>⚠️ Important Information:</strong>
            <ul class="info-list">
                <li>Please arrive 30 minutes before the scheduled pickup time.</li>
                <li>Check the "Things to Carry" list in the itinerary PDF or the event info on our website.</li>
                <li>Carry a water bottle and some snacks.</li>
                <li>Don’t forget to carry 2 Xerox copies and your original ID proof.</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📞 Next Steps</div>
            <p> For treks and trips near Bengaluru, a WhatsApp group will be created one day prior to departure, and all further details will be shared in the group.</p>
<p>For Himalayan treks, the WhatsApp group will be created one week prior to departure, and all further communication will happen there.<p>
        </div>

        <div class="section">
            <div class="section-title">❓ Need Help?</div>
            <p>DM us or reach out via WhatsApp call only: 9449493112</p>
        </div>

         <div class="section">
            <div class="section-title">🔁 Cancellation or Reschedule Requests</div>
            <p>You can raise a request through "My Bookings" or "View Bookings" → Support Tickets section.</p>
        </div>

        <p style="text-align: center; font-size: 18px; color: #10b981; margin: 30px 0;">
            🏔️ We look forward to an amazing trek with you!
        </p>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Bengaluru Trekkers Team<br>
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
    html: htmlContent,
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
  const emailSubject = `💳 Payment Confirmed - ${trek?.name || "Trek Booking"}`;

  const emailContent = `
Dear ${user.name},

💳 Thank you for your payment! Your booking has been confirmed.

📋 INVOICE DETAILS:
Booking ID: ${booking._id}
Trek: ${trek?.name || "N/A"}
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
The Bengaluru Trekkers Team
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
            <div class="logo">
                <img src="https://s3.ap-south-1.amazonaws.com/bucket.bengalurutrekkers/images/1753156158875-logo-transperant.png" alt="Bengaluru Trekkers" style="height: 60px; width: auto; max-width: 200px; filter: brightness(0) invert(1); display: block; margin: 0 auto;">
            </div>
            <div class="logo-text">Bengaluru Trekkers</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <h2>Dear ${user.name},</h2>
        
        <div class="payment-container">
            <div class="section-title" style="color: white !important;">💳 Payment Confirmed!</div>
            <p style="color: white !important;" >Thank you for your payment! Your booking has been confirmed.</p>
            <div class="amount">₹${payment.amount / 100}</div>
        </div>

        <div class="section">
            <div class="section-title">📋 Invoice Details</div>
            <ul class="info-list">
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Trek:</strong> ${trek?.name || "N/A"}</li>
                <li><strong>Participants:</strong> ${
                  booking.numberOfParticipants
                }</li>
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
            The Bengaluru Trekkers Team<br>
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
    html: htmlContent,
  });
};

/**
 * Send booking reminder email 2 days before trip
 * @param {Object} booking - Booking object
 * @param {Object} trek - Trek object
 * @param {Object} user - User object
 * @param {Object} batch - Batch object
 */
const sendBookingReminderEmail = async (booking, trek, user, batch) => {
  const emailSubject = `⏰ Trek Reminder - ${
    trek?.name || "Your Trek"
  } starts in 2 days!`;

  const emailContent = `
Dear ${user.name},

⏰ TREK REMINDER - Your adventure starts in 2 days!

📋 TRIP DETAILS:
Trek: ${trek?.name || "N/A"}
Start Date: ${
    batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : "N/A"
  }
End Date: ${
    batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : "N/A"
  }
Booking ID: ${booking._id}
Participants: ${booking.numberOfParticipants}



🎒 ESSENTIAL PACKING LIST:
• Comfortable trekking shoes with good grip
• Weather-appropriate clothing (check weather forecast)
• Water bottle (at least 2 liters)
• Energy snacks and light food
• Personal medications (if any)
• ID proof (Aadhar/PAN/Driving License)
• Small backpack for essentials
• Rain protection (poncho/umbrella)
• Sun protection (hat, sunglasses, sunscreen)

⚠️ IMPORTANT REMINDERS:
• Arrive 15 minutes before scheduled pickup time
• Wear comfortable, weather-appropriate clothing
• Carry sufficient water and snacks
• Inform us immediately if you have any health concerns
• Check weather conditions for your trek location

📞 NEXT STEPS:
Our team will contact you tomorrow with final pickup details and any last-minute instructions.

❓ NEED HELP?
DM us or reach out via WhatsApp call only: 9449493112

🔁 Cancellation or Reschedule Requests
You can raise a request through "My Bookings" or "View Bookings" → Support Tickets section.

🏔️ Get ready for an amazing adventure!

Best regards,
The Bengaluru Trekkers Team
Your Adventure Awaits!

---
This is an automated reminder. Please do not reply to this email.
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
            border-bottom: 2px solid #f59e0b;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #f59e0b;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .reminder-container {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }
        .countdown {
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
            border-left: 4px solid #f59e0b;
        }
        .section-title {
            font-weight: bold;
            color: #f59e0b;
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
        .packing-list {
            list-style: none;
            padding: 0;
        }
        .packing-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
            position: relative;
            padding-left: 25px;
        }
        .packing-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
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
            .countdown {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="https://s3.ap-south-1.amazonaws.com/bucket.bengalurutrekkers/images/1753156158875-logo-transperant.png" alt="Bengaluru Trekkers" style="height: 60px; width: auto; max-width: 200px; filter: brightness(0) invert(1); display: block; margin: 0 auto;">
            </div>
            <div class="logo-text">Bengaluru Trekkers</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <h2>Dear ${user.name},</h2>
        
        <div class="reminder-container">
            <div class="section-title">⏰ TREK REMINDER</div>
            <p>Your adventure starts in 2 days!</p>
            <div class="countdown">2 DAYS TO GO!</div>
        </div>

        <div class="section">
            <div class="section-title">📋 Trip Details</div>
            <ul class="info-list">
                <li><strong>Trek:</strong> ${trek?.name || "N/A"}</li>
                <li><strong>Start Date:</strong> ${
                  batch?.startDate
                    ? new Date(batch.startDate).toLocaleDateString()
                    : "N/A"
                }</li>
                <li><strong>End Date:</strong> ${
                  batch?.endDate
                    ? new Date(batch.endDate).toLocaleDateString()
                    : "N/A"
                }</li>
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Participants:</strong> ${
                  booking.numberOfParticipants
                }</li>
            </ul>
        </div>



        <div class="section">
            <div class="section-title">🎒 Essential Packing List</div>
            <ul class="packing-list">
                <li>Comfortable trekking shoes with good grip</li>
                <li>Weather-appropriate clothing (check weather forecast)</li>
                <li>Water bottle (at least 2 liters)</li>
                <li>Energy snacks and light food</li>
                <li>Personal medications (if any)</li>
                <li>ID proof (Aadhar/PAN/Driving License)</li>
                <li>Small backpack for essentials</li>
                <li>Rain protection (poncho/umbrella)</li>
                <li>Sun protection (hat, sunglasses, sunscreen)</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">⚠️ Important Reminders</div>
            <ul class="packing-list">
                <li>Arrive 15 minutes before scheduled pickup time</li>
                <li>Wear comfortable, weather-appropriate clothing</li>
                <li>Carry sufficient water and snacks</li>
                <li>Inform us immediately if you have any health concerns</li>
                <li>Check weather conditions for your trek location</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📞 Next Steps</div>
            <p>Our team will contact you tomorrow with final pickup details and any last-minute instructions.</p>
        </div>

        <div class="section">
            <div class="section-title">❓ Need Help?</div>
            <p>DM us or reach out via WhatsApp call only: 9449493112</p>
        </div>

        <div class="section">
            <div class="section-title">🔁 Cancellation or Reschedule Requests</div>
            <p>You can raise a request through "My Bookings" or "View Bookings" → Support Tickets section.</p>
        </div>

        <p style="text-align: center; font-size: 18px; color: #f59e0b; margin: 30px 0;">
            🏔️ Get ready for an amazing adventure!
        </p>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Bengaluru Trekkers Team<br>
            Your Adventure Awaits!</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #9ca3af;">
                This is an automated reminder. Please do not reply to this email.<br>
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
    html: htmlContent,
  });
};

/**
 * Send batch shift notification email
 * @param {Object} booking - Booking object
 * @param {Object} trek - Trek object
 * @param {Object} user - User object
 * @param {Object} oldBatch - Old batch object
 * @param {Object} newBatch - New batch object
 */
const sendBatchShiftNotificationEmail = async (
  booking,
  trek,
  user,
  oldBatch,
  newBatch
) => {
  const emailSubject = `🔄 Batch Change Notification - ${
    trek?.name || "Trek Booking"
  }`;

  const emailContent = `
Dear ${user.name},

🔄 BATCH CHANGE NOTIFICATION

Your booking has been successfully shifted to a new batch as requested.

📋 BOOKING DETAILS:
Booking ID: ${booking._id}
Trek: ${trek?.name || "N/A"}
Participants: ${booking.numberOfParticipants}
Total Amount: ₹${booking.totalPrice}

📅 BATCH CHANGE:
Previous Batch: ${
    oldBatch?.startDate
      ? new Date(oldBatch.startDate).toLocaleDateString()
      : "N/A"
  } to ${
    oldBatch?.endDate ? new Date(oldBatch.endDate).toLocaleDateString() : "N/A"
  }
New Batch: ${
    newBatch?.startDate
      ? new Date(newBatch.startDate).toLocaleDateString()
      : "N/A"
  } to ${
    newBatch?.endDate ? new Date(newBatch.endDate).toLocaleDateString() : "N/A"
  }



⚠️ IMPORTANT INFORMATION:
• Please note the new trek dates
• All other booking details remain the same
• Our team will contact you with updated pickup details
• If you have any concerns, please contact us immediately

📞 NEXT STEPS:
• For treks and trips near Bengaluru, a WhatsApp group will be created one day prior to departure, and all further details will be shared in the group.
• For Himalayan treks, the WhatsApp group will be created one week prior to departure, and all further communication will happen there.

❓ NEED HELP?
DM us or reach out via WhatsApp call only: 9449493112

🔁 Cancellation or Reschedule Requests
You can raise a request through "My Bookings" or "View Bookings" → Support Tickets section.

🏔️ We look forward to an amazing trek with you!

Best regards,
The Bengaluru Trekkers Team
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
            border-bottom: 2px solid #3b82f6;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .change-container {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        .section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .section-title {
            font-weight: bold;
            color: #3b82f6;
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
        .batch-change {
            background-color: #eff6ff;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .old-batch {
            color: #dc2626;
            font-weight: bold;
        }
        .new-batch {
            color: #059669;
            font-weight: bold;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔄 Batch Change</div>
            <div class="subtitle">Your Trek Dates Have Been Updated</div>
        </div>

        <h2>Dear ${user.name},</h2>
        
        <div class="change-container">
            <div class="section-title">🔄 Batch Change Notification</div>
            <p>Your booking has been successfully shifted to a new batch as requested.</p>
        </div>

        <div class="section">
            <div class="section-title">📋 Booking Details</div>
            <ul class="info-list">
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Trek:</strong> ${trek?.name || "N/A"}</li>
                <li><strong>Participants:</strong> ${
                  booking.numberOfParticipants
                }</li>
                <li><strong>Total Amount:</strong> ₹${booking.totalPrice}</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📅 Batch Change</div>
            <div class="batch-change">
                <p><span class="old-batch">Previous Batch:</span> ${
                  oldBatch?.startDate
                    ? new Date(oldBatch.startDate).toLocaleDateString()
                    : "N/A"
                } to ${
    oldBatch?.endDate ? new Date(oldBatch.endDate).toLocaleDateString() : "N/A"
  }</p>
                <p><span class="new-batch">New Batch:</span> ${
                  newBatch?.startDate
                    ? new Date(newBatch.startDate).toLocaleDateString()
                    : "N/A"
                } to ${
    newBatch?.endDate ? new Date(newBatch.endDate).toLocaleDateString() : "N/A"
  }</p>
            </div>
        </div>



        <div class="section">
            <div class="section-title">⚠️ Important Information</div>
            <ul class="info-list">
                <li>Please note the new trek dates</li>
                <li>All other booking details remain the same</li>
                <li>Our team will contact you with updated pickup details</li>
                <li>If you have any concerns, please contact us immediately</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📞 Next Steps</div>
            <p> For treks and trips near Bengaluru, a WhatsApp group will be created one day prior to departure, and all further details will be shared in the group.</p>
            <p>For Himalayan treks, the WhatsApp group will be created one week prior to departure, and all further communication will happen there.<p>
        </div>

        <div class="section">
            <div class="section-title">❓ Need Help?</div>
            <p>DM us or reach out via WhatsApp call only: 9449493112</p>
        </div>

        <div class="section">
            <div class="section-title">🔁 Cancellation or Reschedule Requests</div>
            <p>You can raise a request through "My Bookings" or "View Bookings" → Support Tickets section.</p>
        </div>

        <p style="text-align: center; font-size: 18px; color: #3b82f6; margin: 30px 0;">
            🏔️ We look forward to an amazing trek with you!
        </p>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Bengaluru Trekkers Team<br>
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

  // Use user.email if available, otherwise fall back to userDetails.email
  const emailAddress =
    user.email || user.userDetails?.email || booking.userDetails?.email;

  if (!emailAddress) {
    console.error("No email address found for user:", user);
    return;
  }

  await sendEmail({
    to: emailAddress,
    subject: emailSubject,
    text: emailContent,
    html: htmlContent,
  });
};

/**
 * Send professional invoice email with attachment
 * @param {Object} booking - Booking object
 * @param {Object} trek - Trek object
 * @param {Object} user - User object
 * @param {Buffer} invoiceBuffer - PDF invoice buffer
 */
const sendProfessionalInvoiceEmail = async (
  booking,
  trek,
  user,
  invoiceBuffer
) => {
  const emailSubject = `📄 Invoice - ${trek?.name || "Trek Booking"}`;

  const emailContent = `
Dear ${user.name},

📄 INVOICE FOR YOUR TREK BOOKING

Please find attached the invoice for your booking.

📋 BOOKING DETAILS:
Booking ID: ${booking._id}
Trek: ${trek?.name || "N/A"}
Start Date: ${
    booking.batch?.startDate
      ? new Date(booking.batch.startDate).toLocaleDateString()
      : "N/A"
  }
End Date: ${
    booking.batch?.endDate
      ? new Date(booking.batch.endDate).toLocaleDateString()
      : "N/A"
  }
Participants: ${booking.numberOfParticipants}
Total Amount: ₹${booking.totalPrice}

📄 INVOICE ATTACHMENT:
The detailed invoice is attached to this email in PDF format.

💳 PAYMENT INFORMATION:
Payment Status: ${booking.paymentDetails?.status || "Confirmed"}
Payment Method: ${booking.paymentDetails?.method || "Manual/Offline"}

❓ NEED HELP?
If you have any questions about the invoice or payment, please contact us immediately.

🏔️ Thank you for choosing us for your adventure!

Best regards,
The Bengaluru Trekkers Team
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
            border-bottom: 2px solid #8b5cf6;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .invoice-container {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        .section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #8b5cf6;
        }
        .section-title {
            font-weight: bold;
            color: #8b5cf6;
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
        .attachment-notice {
            background-color: #f3f4f6;
            border: 2px dashed #8b5cf6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="https://s3.ap-south-1.amazonaws.com/bucket.bengalurutrekkers/images/1753156158875-logo-transperant.png" alt="Bengaluru Trekkers" style="height: 60px; width: auto; max-width: 200px; filter: brightness(0) invert(1); display: block; margin: 0 auto;">
            </div>
            <div class="logo-text">Bengaluru Trekkers</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <h2>Dear ${user.name},</h2>
        
        <div class="invoice-container">
            <div class="section-title">📄 INVOICE</div>
            <p>Please find attached the invoice for your booking.</p>
        </div>

        <div class="section">
            <div class="section-title">📋 Booking Details</div>
            <ul class="info-list">
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Trek:</strong> ${trek?.name || "N/A"}</li>
                <li><strong>Start Date:</strong> ${
                  booking.batch?.startDate
                    ? new Date(booking.batch.startDate).toLocaleDateString()
                    : "N/A"
                }</li>
                <li><strong>End Date:</strong> ${
                  booking.batch?.endDate
                    ? new Date(booking.batch.endDate).toLocaleDateString()
                    : "N/A"
                }</li>
                <li><strong>Participants:</strong> ${
                  booking.numberOfParticipants
                }</li>
                <li><strong>Total Amount:</strong> ₹${booking.totalPrice}</li>
            </ul>
        </div>

        <div class="attachment-notice">
            <div class="section-title">📄 Invoice Attachment</div>
            <p>The detailed invoice is attached to this email in PDF format.</p>
        </div>

        <div class="section">
            <div class="section-title">💳 Payment Information</div>
            <ul class="info-list">
                <li><strong>Payment Status:</strong> ${
                  booking.paymentDetails?.status || "Confirmed"
                }</li>
                <li><strong>Payment Method:</strong> ${
                  booking.paymentDetails?.method || "Manual/Offline"
                }</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">❓ Need Help?</div>
            <p>If you have any questions about the invoice or payment, please contact us immediately.</p>
        </div>

        <p style="text-align: center; font-size: 18px; color: #8b5cf6; margin: 30px 0;">
            🏔️ Thank you for choosing us for your adventure!
        </p>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Bengaluru Trekkers Team<br>
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

  await sendEmailWithAttachment({
    to: user.email,
    subject: emailSubject,
    text: emailContent,
    html: htmlContent,
    attachmentBuffer: invoiceBuffer,
    attachmentFilename: `invoice-${booking._id}.pdf`,
  });
};

/**
 * Send an email with a PDF attachment (e.g., invoice)
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email text content
 * @param {Buffer} options.attachmentBuffer - PDF buffer
 * @param {string} options.attachmentFilename - Filename for the PDF
 */
const sendEmailWithAttachment = async ({
  to,
  subject,
  text,
  attachmentBuffer,
  attachmentFilename,
  html,
}) => {
  try {
    const transporter = await transporterPromise;
    if (!transporter) {
      console.warn("Transporter not initialized.");
      return null;
    }
    const mailOptions = {
      from: `"NoReply" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: attachmentFilename,
          content: attachmentBuffer,
        },
      ],
    };
    console.log("--- SENDING EMAIL WITH ATTACHMENT ---");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Attachment:", attachmentFilename);
    console.log("---------------------");
    const info = await transporter.sendMail(mailOptions);
    console.log("Email with attachment sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email with attachment:", error);
    return null;
  }
};

/**
 * Send cancellation notification email with professional template
 * @param {Object} booking - Booking object
 * @param {Object} trek - Trek object
 * @param {Object} user - User object
 * @param {string} cancellationType - 'entire' or 'individual'
 * @param {Array} cancelledParticipants - Array of cancelled participant IDs
 * @param {number} refundAmount - Refund amount
 * @param {string} cancellationReason - Reason for cancellation
 * @param {string} refundType - 'auto' or 'custom'
 */
const sendCancellationEmail = async (
  booking,
  trek,
  user,
  cancellationType,
  cancelledParticipants,
  refundAmount,
  cancellationReason,
  refundType
) => {
  const emailSubject = `❌ Booking Cancelled - ${trek?.name || "Trek Booking"}`;

  // Get cancelled participant names
  const cancelledParticipantNames =
    cancelledParticipants.length > 0
      ? booking.participantDetails
          .filter((p) => cancelledParticipants.includes(p._id))
          .map((p) => p.name)
          .join(", ")
      : "All participants";

  const emailContent = `
Dear ${user.name},

We regret to inform you that your booking has been cancelled as requested.

📋 CANCELLATION DETAILS:
Booking ID: ${booking._id}
Trek: ${trek?.name || "N/A"}
Cancellation Type: ${
    cancellationType === "entire" ? "Entire Booking" : "Individual Participants"
  }
Cancelled Participants: ${cancelledParticipantNames}
Cancellation Date: ${new Date().toLocaleDateString()}
Cancellation Time: ${new Date().toLocaleTimeString()}
Reason: ${cancellationReason || "Not specified"}

💰 REFUND INFORMATION:
Refund Type: ${
    refundType === "auto"
      ? "Auto-calculated (based on policy)"
      : "Custom amount"
  }
${
  refundAmount > 0
    ? `✅ Refund Amount: ₹${refundAmount}
Refund Status: Processing
Expected Credit: 5-7 business days to your original payment method`
    : "❌ No refund applicable (within cancellation policy)"
}

📊 CANCELLATION POLICY APPLIED:
${
  refundType === "auto"
    ? "The refund was calculated based on our standard cancellation policy based on the time remaining until the trek start date."
    : "A custom refund amount was applied as requested."
}

❓ NEXT STEPS:
${
  refundAmount > 0
    ? "• Your refund will be processed to your original payment method\n• You will receive a confirmation email once the refund is completed\n• Please allow 5-7 business days for the refund to appear in your account"
    : "• No further action is required from your side"
}

🏔️ FUTURE BOOKINGS:
We hope to see you on another adventure soon! Feel free to browse our other exciting treks and book again when you're ready.

If you have any questions about this cancellation or would like to book another trek, please don't hesitate to contact our support team.

We appreciate your understanding.

Best regards,
The Bengaluru Trekkers Team

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
            border-bottom: 2px solid #ef4444;
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
        .cancellation-container {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }
        .booking-id {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        .details-section {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        .detail-value {
            color: #1f2937;
        }
        .refund-section {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .refund-amount {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .contact-info {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="https://s3.ap-south-1.amazonaws.com/bucket.bengalurutrekkers/images/1753156158875-logo-transperant.png" alt="Bengaluru Trekkers" style="height: 60px; width: auto; max-width: 200px; filter: brightness(0) invert(1); display: block; margin: 0 auto;">
            </div>
            <div class="logo-text">Bengaluru Trekkers</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>
        
        <div class="cancellation-container">
            <h1 style="margin: 0; font-size: 28px;">❌ Booking Cancelled</h1>
            <div class="booking-id">${booking._id}</div>
            <p style="margin: 0; font-size: 18px;">Cancellation processed successfully</p>
        </div>
        
        <div class="details-section">
            <h3 style="margin-top: 0; color: #374151;">📋 Cancellation Details</h3>
            <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${booking._id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Trek:</span>
                <span class="detail-value">${trek?.name || "N/A"}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Cancellation Type:</span>
                <span class="detail-value">${
                  cancellationType === "entire"
                    ? "Entire Booking"
                    : "Individual Participants"
                }</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Cancelled Participants:</span>
                <span class="detail-value">${cancelledParticipantNames}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Cancellation Date:</span>
                <span class="detail-value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Cancellation Time:</span>
                <span class="detail-value">${new Date().toLocaleTimeString()}</span>
            </div>
            ${
              cancellationReason
                ? `
            <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span class="detail-value">${cancellationReason}</span>
            </div>
            `
                : ""
            }
        </div>
        
        ${
          refundAmount > 0
            ? `
        <div class="refund-section">
            <h3 style="margin-top: 0; text-align: center;">💰 Refund Information</h3>
            <div class="refund-amount">₹${refundAmount}</div>
            <p style="text-align: center; margin: 0;">
                <strong>Refund Type:</strong> ${
                  refundType === "auto"
                    ? "Auto-calculated (based on policy)"
                    : "Custom amount"
                }<br>
                <strong>Status:</strong> Processing<br>
                <strong>Expected Credit:</strong> 5-7 business days
            </p>
        </div>
        `
            : `
        <div class="warning-box">
            <h4 style="margin-top: 0; color: #92400e;">⚠️ No Refund Applicable</h4>
            <p style="margin: 5px 0; color: #92400e;">The cancellation falls within our no-refund policy period.</p>
        </div>
        `
        }
        
        <div class="contact-info">
            <h4 style="margin-top: 0; color: #374151;">🏔️ Future Bookings</h4>
            <p style="margin: 5px 0;">We hope to see you on another adventure soon! Feel free to browse our other exciting treks.</p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The Bengaluru Trekkers Team</p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                This is an automated message. Please do not reply to this email.<br>
                For support, contact us through our website or mobile app.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject: emailSubject,
    text: emailContent,
    html: htmlContent,
  });
};

/**
 * Send cancellation notification email to participants
 * @param {Object} booking - Booking object
 * @param {Object} trek - Trek object
 * @param {Array} cancelledParticipants - Array of cancelled participant objects
 * @param {string} cancellationReason - Reason for cancellation
 */
const sendParticipantCancellationEmails = async (
  booking,
  trek,
  cancelledParticipants,
  cancellationReason
) => {
  const emailSubject = `❌ Trek Booking Cancelled - ${
    trek?.name || "Trek Booking"
  }`;

  // Get cancelled participant names
  const cancelledParticipantNames = cancelledParticipants
    .map((p) => p.name)
    .join(", ");

  const emailContent = `
Dear Participant,

We regret to inform you that your trek booking has been cancelled.

📋 CANCELLATION DETAILS:
Booking ID: ${booking._id}
Trek: ${trek?.name || "N/A"}
Cancelled Participants: ${cancelledParticipantNames}
Cancellation Date: ${new Date().toLocaleDateString()}
Cancellation Time: ${new Date().toLocaleTimeString()}
Reason: ${cancellationReason || "Admin cancelled booking"}

💰 REFUND INFORMATION:
The booking organizer will receive the refund for this cancellation. Please contact the person who made the booking for refund details.

❓ NEXT STEPS:
• No further action is required from your side
• If you have any questions, please contact the booking organizer

🏔️ FUTURE BOOKINGS:
We hope to see you on another adventure soon! Feel free to browse our other exciting treks and book again when you're ready.

If you have any questions about this cancellation or would like to book another trek, please don't hesitate to contact our support team.

We appreciate your understanding.

Best regards,
The Bengaluru Trekkers Team

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
            border-bottom: 2px solid #ef4444;
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
        .cancellation-container {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }
        .booking-id {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        .details-section {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        .detail-value {
            color: #1f2937;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .contact-info {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="https://s3.ap-south-1.amazonaws.com/bucket.bengalurutrekkers/images/1753156158875-logo-transperant.png" alt="Bengaluru Trekkers" style="height: 60px; width: auto; max-width: 200px; filter: brightness(0) invert(1); display: block; margin: 0 auto;">
            </div>
            <div class="logo-text">Bengaluru Trekkers</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>
        
        <div class="cancellation-container">
            <h1 style="margin: 0; font-size: 28px;">❌ Trek Booking Cancelled</h1>
            <div class="booking-id">${booking._id}</div>
            <p style="margin: 0; font-size: 18px;">Cancellation processed successfully</p>
        </div>
        
        <div class="details-section">
            <h3 style="margin-top: 0; color: #374151;">📋 Cancellation Details</h3>
            <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${booking._id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Trek:</span>
                <span class="detail-value">${trek?.name || "N/A"}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Cancelled Participants:</span>
                <span class="detail-value">${cancelledParticipantNames}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Cancellation Date:</span>
                <span class="detail-value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Cancellation Time:</span>
                <span class="detail-value">${new Date().toLocaleTimeString()}</span>
            </div>
            ${
              cancellationReason
                ? `
            <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span class="detail-value">${cancellationReason}</span>
            </div>
            `
                : ""
            }
        </div>
        
        <div class="warning-box">
            <h4 style="margin-top: 0; color: #92400e;">💰 Refund Information</h4>
            <p style="margin: 5px 0; color: #92400e;">The booking organizer will receive the refund for this cancellation. Please contact the person who made the booking for refund details.</p>
        </div>
        
        <div class="contact-info">
            <h4 style="margin-top: 0; color: #374151;">🏔️ Future Bookings</h4>
            <p style="margin: 5px 0;">We hope to see you on another adventure soon! Feel free to browse our other exciting treks.</p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The Bengaluru Trekkers Team</p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                This is an automated message. Please do not reply to this email.<br>
                For support, contact us through our website or mobile app.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  // Send emails to all cancelled participants who have email addresses
  console.log("Participant cancellation email function called with:", {
    totalParticipants: cancelledParticipants.length,
    participantsWithEmails: cancelledParticipants.filter(
      (p) => p.email && p.email.trim()
    ).length,
    participantDetails: cancelledParticipants.map((p) => ({
      name: p.name,
      email: p.email,
      hasEmail: !!p.email,
      emailLength: p.email ? p.email.length : 0,
    })),
  });

  const emailPromises = cancelledParticipants
    .filter((participant) => participant.email && participant.email.trim())
    .map((participant) => {
      console.log(
        `Preparing to send email to participant: ${participant.name} (${participant.email})`
      );
      return sendEmail({
        to: participant.email,
        subject: emailSubject,
        text: emailContent,
        html: htmlContent,
      });
    });

  // Execute all email sends in parallel
  if (emailPromises.length > 0) {
    try {
      await Promise.all(emailPromises);
      console.log(
        `Sent cancellation emails to ${emailPromises.length} participants`
      );
    } catch (error) {
      console.error("Error sending participant cancellation emails:", error);
      // Don't throw error to avoid breaking the main cancellation flow
    }
  } else {
    console.log("No participants with valid email addresses found");
  }
};

/**
 * Send reschedule request approval notification email
 * @param {Object} booking - Booking object
 * @param {Object} trek - Trek object
 * @param {Object} user - User object
 * @param {Object} oldBatch - Previous batch object
 * @param {Object} newBatch - New batch object
 * @param {string} adminResponse - Admin's response message
 */
const sendRescheduleApprovalEmail = async (
  booking,
  trek,
  user,
  oldBatch,
  newBatch,
  adminResponse
) => {
  const emailSubject = `✅ Reschedule Request Approved - ${
    trek?.name || "Trek Booking"
  }`;

  const emailContent = `
Dear ${user.name},

✅ RESCHEDULE REQUEST APPROVED

Your reschedule request has been approved and your booking has been successfully shifted to the preferred batch.

📋 BOOKING DETAILS:
Booking ID: ${booking._id}
Trek: ${trek?.name || "N/A"}
Participants: ${booking.numberOfParticipants}
Total Amount: ₹${booking.totalPrice}

📅 BATCH CHANGE:
Previous Batch: ${
    oldBatch?.startDate
      ? new Date(oldBatch.startDate).toLocaleDateString()
      : "N/A"
  } to ${
    oldBatch?.endDate ? new Date(oldBatch.endDate).toLocaleDateString() : "N/A"
  }
New Batch: ${
    newBatch?.startDate
      ? new Date(newBatch.startDate).toLocaleDateString()
      : "N/A"
  } to ${
    newBatch?.endDate ? new Date(newBatch.endDate).toLocaleDateString() : "N/A"
  }



💬 ADMIN RESPONSE:
${adminResponse || "Your reschedule request has been approved."}

⚠️ IMPORTANT INFORMATION:
• Your booking has been automatically shifted to the new batch
• All participant details and other booking information remain unchanged
• Our team will contact you with updated pickup details for the new dates
• If you have any concerns, please contact us immediately

📞 NEXT STEPS:
• For treks and trips near Bengaluru, a WhatsApp group will be created one day prior to departure, and all further details will be shared in the group.
• For Himalayan treks, the WhatsApp group will be created one week prior to departure, and all further communication will happen there.

❓ NEED HELP?
DM us or reach out via WhatsApp call only: 9449493112

🔁 Cancellation or Reschedule Requests
You can raise a request through "My Bookings" or "View Bookings" → Support Tickets section.

🏔️ We look forward to an amazing trek with you!

Best regards,
The Bengaluru Trekkers Team
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
        .approval-container {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
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
        .batch-change {
            background-color: #ecfdf5;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .old-batch {
            color: #dc2626;
            font-weight: bold;
        }
        .new-batch {
            color: #059669;
            font-weight: bold;
        }
        .admin-response {
            background-color: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">✅ Reschedule Approved</div>
            <div class="subtitle">Your Trek Dates Have Been Updated</div>
        </div>

        <h2>Dear ${user.name},</h2>
        
        <div class="approval-container">
            <div class="section-title">✅ Reschedule Request Approved</div>
            <p>Your reschedule request has been approved and your booking has been successfully shifted to the preferred batch.</p>
        </div>

        <div class="section">
            <div class="section-title">📋 Booking Details</div>
            <ul class="info-list">
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Trek:</strong> ${trek?.name || "N/A"}</li>
                <li><strong>Participants:</strong> ${
                  booking.numberOfParticipants
                }</li>
                <li><strong>Total Amount:</strong> ₹${booking.totalPrice}</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📅 Batch Change</div>
            <div class="batch-change">
                <p><span class="old-batch">Previous Batch:</span> ${
                  oldBatch?.startDate
                    ? new Date(oldBatch.startDate).toLocaleDateString()
                    : "N/A"
                } to ${
    oldBatch?.endDate ? new Date(oldBatch.endDate).toLocaleDateString() : "N/A"
  }</p>
                <p><span class="new-batch">New Batch:</span> ${
                  newBatch?.startDate
                    ? new Date(newBatch.startDate).toLocaleDateString()
                    : "N/A"
                } to ${
    newBatch?.endDate ? new Date(newBatch.endDate).toLocaleDateString() : "N/A"
  }</p>
            </div>
        </div>



        ${
          adminResponse
            ? `
        <div class="section">
            <div class="section-title">💬 Admin Response</div>
            <div class="admin-response">
                <p>${adminResponse}</p>
            </div>
        </div>
        `
            : ""
        }

        <div class="section">
            <div class="section-title">⚠️ Important Information</div>
            <ul class="info-list">
                <li>Your booking has been automatically shifted to the new batch</li>
                <li>All participant details and other booking information remain unchanged</li>
                <li>Our team will contact you with updated pickup details for the new dates</li>
                <li>If you have any concerns, please contact us immediately</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📞 Next Steps</div>
            <ul class="info-list">
                <li> For treks and trips near Bengaluru, a WhatsApp group will be created one day prior to departure, and all further details will be shared in the group.</li>
                <li>For Himalayan treks, the WhatsApp group will be created one week prior to departure, and all further communication will happen there.<li>
            </ul>
        </div>

        <div class="footer">
            <p>Best regards,<br>The Bengaluru Trekkers Team</p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                This is an automated message. Please do not reply to this email.<br>
                For support, contact us through our website or mobile app.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject: emailSubject,
    text: emailContent,
    html: htmlContent,
  });
};

/**
 * Send partial payment reminder email with standard template
 * @param {Object} booking - Booking object
 * @param {Object} trek - Trek object
 * @param {Object} user - User object
 * @param {Object} batch - Batch object
 */
const sendPartialPaymentReminderEmail = async (booking, trek, user, batch) => {
  const emailSubject = `💰 Payment Reminder - Complete Your ${
    trek?.name || "Trek"
  } Booking`;

  const emailContent = `
Dear ${user.name},

💰 PAYMENT REMINDER - Complete Your Booking

📋 BOOKING DETAILS:
Trek: ${trek?.name || "N/A"}
Start Date: ${
    batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : "N/A"
  }
End Date: ${
    batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : "N/A"
  }
Booking ID: ${booking._id}
Participants: ${booking.numberOfParticipants || booking.participants}

💳 PAYMENT STATUS:
Initial Payment: ₹${
    booking.partialPaymentDetails?.initialAmount?.toFixed(2) || "0.00"
  }
Remaining Balance: ₹${
    booking.partialPaymentDetails?.remainingAmount?.toFixed(2) || "0.00"
  }
Due Date: ${
    booking.partialPaymentDetails?.finalPaymentDueDate
      ? new Date(
          booking.partialPaymentDetails.finalPaymentDueDate
        ).toLocaleDateString()
      : "N/A"
  }

⚠️ IMPORTANT:
• Your remaining balance must be paid before the due date
• Failure to complete payment may result in booking cancellation
• Partial payments are non-refundable once processed

🔗 COMPLETE PAYMENT:
Click the link below to complete your remaining payment:
${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/${booking._id}

📞 NEED HELP?
If you have any questions or need assistance with payment, please contact us immediately.

🏔️ We look forward to having you on this amazing trek!

Best regards,
The Bengaluru Trekkers Team
Your Adventure Awaits!

---
This is an automated reminder. Please do not reply to this email.
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
            border-bottom: 2px solid #f59e0b;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #f59e0b;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .reminder-container {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }
        .payment-amount {
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
            border-left: 4px solid #f59e0b;
        }
        .section-title {
            font-weight: bold;
            color: #f59e0b;
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
        .payment-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .payment-button:hover {
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
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
            .payment-amount {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="https://s3.ap-south-1.amazonaws.com/bucket.bengalurutrekkers/images/1753156158875-logo-transperant.png" alt="Bengaluru Trekkers" style="height: 60px; width: auto; max-width: 200px; filter: brightness(0) invert(1); display: block; margin: 0 auto;">
            </div>
            <div class="logo-text">Bengaluru Trekkers</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <h2>Dear ${user.name},</h2>
        
        <div class="reminder-container">
            <div class="section-title">💰 PAYMENT REMINDER</div>
            <p>Complete Your Booking</p>
            <div class="payment-amount">₹${
              booking.partialPaymentDetails?.remainingAmount?.toFixed(2) ||
              "0.00"
            }</div>
            <p>Remaining Balance Due</p>
        </div>

        <div class="section">
            <div class="section-title">📋 Booking Details</div>
            <ul class="info-list">
                <li><strong>Trek:</strong> ${trek?.name || "N/A"}</li>
                <li><strong>Start Date:</strong> ${
                  batch?.startDate
                    ? new Date(batch.startDate).toLocaleDateString()
                    : "N/A"
                }</li>
                <li><strong>End Date:</strong> ${
                  batch?.endDate
                    ? new Date(batch.endDate).toLocaleDateString()
                    : "N/A"
                }</li>
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Participants:</strong> ${
                  booking.numberOfParticipants || booking.participants
                }</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">💳 Payment Status</div>
            <ul class="info-list">
                <li><strong>Initial Payment:</strong> ₹${
                  booking.partialPaymentDetails?.initialAmount?.toFixed(2) ||
                  "0.00"
                }</li>
                <li><strong>Remaining Balance:</strong> ₹${
                  booking.partialPaymentDetails?.remainingAmount?.toFixed(2) ||
                  "0.00"
                }</li>
                <li><strong>Due Date:</strong> ${
                  booking.partialPaymentDetails?.finalPaymentDueDate
                    ? new Date(
                        booking.partialPaymentDetails.finalPaymentDueDate
                      ).toLocaleDateString()
                    : "N/A"
                }</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">⚠️ Important</div>
            <ul class="info-list">
                <li>Your remaining balance must be paid before the due date</li>
                <li>Failure to complete payment may result in booking cancellation</li>
                <li>Partial payments are non-refundable once processed</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/payment/${booking._id}" class="payment-button">
                💳 Complete Payment
            </a>
        </div>

        <div class="section">
            <div class="section-title">📞 Need Help?</div>
            <p>If you have any questions or need assistance with payment, please contact us immediately.</p>
        </div>

        <p>🏔️ We look forward to having you on this amazing trek!</p>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Bengaluru Trekkers Team<br>
            Your Adventure Awaits!</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p>This is an automated reminder. Please do not reply to this email.<br>
            For support, contact us through our website or mobile app.</p>
        </div>
    </div>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject: emailSubject,
    text: emailContent,
    html: htmlContent,
  });
};

/**
 * Send partial payment confirmation email with standard template and invoice attachment
 * @param {Object} booking - Booking object
 * @param {Object} trek - Trek object
 * @param {Object} user - User object
 * @param {Object} payment - Payment details
 * @param {Object} batch - Batch object
 */
const sendPartialPaymentConfirmationEmail = async (
  booking,
  trek,
  user,
  payment,
  batch
) => {
  const isRemainingBalance =
    booking.status === "payment_confirmed_partial" &&
    booking.partialPaymentDetails?.remainingAmount === 0;

  const emailSubject = isRemainingBalance
    ? `✅ Payment Complete - ${trek?.name || "Trek"} Booking Confirmed`
    : `💰 Partial Payment Received - ${trek?.name || "Trek"} Booking`;

  const emailContent = `
Dear ${user.name},

${isRemainingBalance ? "✅" : "💰"} ${
    isRemainingBalance ? "Payment Complete!" : "Partial Payment Received!"
  }

📋 BOOKING DETAILS:
Trek: ${trek?.name || "N/A"}
Start Date: ${
    batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : "N/A"
  }
End Date: ${
    batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : "N/A"
  }
Booking ID: ${booking._id}
Participants: ${booking.numberOfParticipants || booking.participants}

💳 PAYMENT STATUS:
${
  isRemainingBalance
    ? `
✅ Payment Complete!
Total Amount: ₹${booking.totalPrice?.toFixed(2) || "0.00"}
Final Payment: ₹${payment.amount / 100}
Payment Method: ${payment.method}
Payment ID: ${payment.id}
`
    : `
💰 Partial Payment Received
Initial Payment: ₹${payment.amount / 100}
Remaining Balance: ₹${
        booking.partialPaymentDetails?.remainingAmount?.toFixed(2) || "0.00"
      }
Due Date: ${
        booking.partialPaymentDetails?.finalPaymentDueDate
          ? new Date(
              booking.partialPaymentDetails.finalPaymentDueDate
            ).toLocaleDateString()
          : "N/A"
      }
Payment Method: ${payment.method}
Payment ID: ${payment.id}
`
}

${
  isRemainingBalance
    ? `
🎉 BOOKING STATUS:
Your booking is now fully confirmed! All payments have been completed.

📝 NEXT STEPS:
1. Please complete your participant details if not already done
2. You will receive final trek instructions 24-48 hours before the trek
3. Our team will contact you with pickup details
`
    : `
📝 NEXT STEPS:
1. Please complete your participant details to finalize your booking
2. Pay the remaining balance before the due date
3. You will receive a reminder email for the remaining payment
4. Once all payments are complete, your booking will be confirmed
`
}

⚠️ IMPORTANT:
${
  isRemainingBalance
    ? `
• Your booking is now fully confirmed
• All payments have been completed
• Please ensure all participant details are submitted
`
    : `
• Partial payments are non-refundable once processed
• Complete the remaining payment before the due date
• Failure to complete payment may result in booking cancellation
`
}

${
  !isRemainingBalance
    ? `
🔗 COMPLETE REMAINING PAYMENT:
Click the link below to complete your remaining payment:
${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/${booking._id}
`
    : ""
}

📞 NEED HELP?
If you have any questions or need assistance, please contact us immediately.

🏔️ We look forward to having you on this amazing trek!

Best regards,
The Bengaluru Trekkers Team
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
            border-bottom: 2px solid ${
              isRemainingBalance ? "#10b981" : "#ff6b35"
            };
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: ${isRemainingBalance ? "#10b981" : "#ff6b35"};
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .payment-container {
            background: linear-gradient(135deg, ${
              isRemainingBalance ? "#10b981, #059669" : "#ff6b35, #ff8c42"
            });
            color: ${isRemainingBalance ? "white" : "white"};
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(${
              isRemainingBalance ? "16, 185, 129" : "255, 107, 53"
            }, 0.3);
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
            border-left: 4px solid ${
              isRemainingBalance ? "#10b981" : "#ff6b35"
            };
        }
        .section-title {
            font-weight: bold;
            color: ${isRemainingBalance ? "#10b981" : "#ff6b35"};
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
        .payment-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .payment-button:hover {
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
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
            <div class="logo">
                <img src="https://s3.ap-south-1.amazonaws.com/bucket.bengalurutrekkers/images/1753156158875-logo-transperant.png" alt="Bengaluru Trekkers" style="height: 60px; width: auto; max-width: 200px; filter: brightness(0) invert(1); display: block; margin: 0 auto;">
            </div>
            <div class="logo-text">Bengaluru Trekkers</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <h2>Dear ${user.name},</h2>
        
        <div class="payment-container">
            <div class="section-title" style="color: white !important;">${
              isRemainingBalance
                ? "✅ Payment Complete!"
                : "💰 Partial Payment Received!"
            }</div>
            <p>${
              isRemainingBalance
                ? "Your booking is now fully confirmed!"
                : "Thank you for your partial payment!"
            }</p>
            <div class="amount">₹${payment.amount / 100}</div>
            <p>${
              isRemainingBalance
                ? "Total Payment Complete"
                : "Initial Payment Received"
            }</p>
        </div>

        <div class="section">
            <div class="section-title">📋 Booking Details</div>
            <ul class="info-list">
                <li><strong>Trek:</strong> ${trek?.name || "N/A"}</li>
                <li><strong>Start Date:</strong> ${
                  batch?.startDate
                    ? new Date(batch.startDate).toLocaleDateString()
                    : "N/A"
                }</li>
                <li><strong>End Date:</strong> ${
                  batch?.endDate
                    ? new Date(batch.endDate).toLocaleDateString()
                    : "N/A"
                }</li>
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Participants:</strong> ${
                  booking.numberOfParticipants || booking.participants
                }</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">💳 Payment Status</div>
            <ul class="info-list">
                ${
                  isRemainingBalance
                    ? `
                <li><strong>Total Amount:</strong> ₹${
                  booking.totalPrice?.toFixed(2) || "0.00"
                }</li>
                <li><strong>Final Payment:</strong> ₹${
                  payment.amount / 100
                }</li>
                <li><strong>Payment Method:</strong> ${payment.method}</li>
                <li><strong>Payment ID:</strong> ${payment.id}</li>
                `
                    : `
                <li><strong>Initial Payment:</strong> ₹${
                  payment.amount / 100
                }</li>
                <li><strong>Remaining Balance:</strong> ₹${
                  booking.partialPaymentDetails?.remainingAmount?.toFixed(2) ||
                  "0.00"
                }</li>
                <li><strong>Due Date:</strong> ${
                  booking.partialPaymentDetails?.finalPaymentDueDate
                    ? new Date(
                        booking.partialPaymentDetails.finalPaymentDueDate
                      ).toLocaleDateString()
                    : "N/A"
                }</li>
                <li><strong>Payment Method:</strong> ${payment.method}</li>
                <li><strong>Payment ID:</strong> ${payment.id}</li>
                `
                }
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📝 Next Steps</div>
            ${
              isRemainingBalance
                ? `
            <ol>
                <li>Please complete your participant details if not already done</li>
                <li>You will receive final trek instructions 24-48 hours before the trek</li>
                <li>Our team will contact you with pickup details</li>
            </ol>
            `
                : `
            <ol>
                <li>Please complete your participant details to finalize your booking</li>
                <li>Pay the remaining balance before the due date</li>
                <li>You will receive a reminder email for the remaining payment</li>
                <li>Once all payments are complete, your booking will be confirmed</li>
            </ol>
            `
            }
        </div>

        <div class="section">
            <div class="section-title">⚠️ Important</div>
            ${
              isRemainingBalance
                ? `
            <ul class="info-list">
                <li>Your booking is now fully confirmed</li>
                <li>All payments have been completed</li>
                <li>Please ensure all participant details are submitted</li>
            </ul>
            `
                : `
            <ul class="info-list">
                <li>Partial payments are non-refundable once processed</li>
                <li>Complete the remaining payment before the due date</li>
                <li>Failure to complete payment may result in booking cancellation</li>
            </ul>
            `
            }
        </div>

        ${
          !isRemainingBalance
            ? `
        <div style="text-align: center; margin: 30px 0;">
            <a style="color: white !important;" href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/payment/${booking._id}" class="payment-button">
                💳 Complete Remaining Payment
            </a>
        </div>
        `
            : ""
        }

        <div class="section">
            <div class="section-title">📞 Need Help?</div>
            <p>If you have any questions or need assistance, please contact us immediately.</p>
        </div>

        <p style="text-align: center; font-size: 18px; color: ${
          isRemainingBalance ? "#10b981" : "#ff6b35"
        }; margin: 30px 0;">
            🏔️ We look forward to having you on this amazing trek!
        </p>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Bengaluru Trekkers Team<br>
            Your Adventure Awaits!</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p>This is an automated message. Please do not reply to this email.<br>
            For support, contact us through our website or mobile app.</p>
        </div>
    </div>
</body>
</html>
  `;

  // Generate invoice PDF and send email with attachment
  try {
    const { generateInvoicePDF } = require("./invoiceGenerator");
    const invoiceBuffer = await generateInvoicePDF(booking, payment);

    return await sendEmailWithAttachment({
      to: user.email,
      subject: emailSubject,
      text: emailContent,
      html: htmlContent,
      attachmentBuffer: invoiceBuffer,
      attachmentFilename: `Invoice-${booking._id}.pdf`,
    });
  } catch (invoiceError) {
    console.error(
      "Error generating invoice for partial payment email:",
      invoiceError
    );
    // Fallback to sending email without attachment if invoice generation fails
    return await sendEmail({
      to: user.email,
      subject: emailSubject,
      text: emailContent,
      html: htmlContent,
    });
  }
};

/**
 * Send booking confirmation email to all participants
 * @param {Object} booking - Booking object with populated trek and user
 * @param {Object} trek - Trek object
 * @param {Object} user - User object (booking owner)
 * @param {Array} participants - Participant details array
 * @param {Object} batch - Batch object
 * @param {string} additionalRequests - Additional requests
 * @param {Object} payment - Payment details (optional)
 */
const sendConfirmationEmailToAllParticipants = async (
  booking,
  trek,
  user,
  participants,
  batch,
  additionalRequests,
  payment = null
) => {
  const participantList = participants
    .map(
      (p, index) =>
        `${index + 1}. ${p.name} (Age: ${p.age}, Gender: ${p.gender})`
    )
    .join("\n");

  const emailSubject = `🎉 Booking Confirmed - ${trek?.name || "Trek Booking"}`;

  const emailContent = `
Dear Participant,

🎉 Congratulations! Your trek booking has been fully confirmed! 

📋 BOOKING CONFIRMATION:
Booking ID: ${booking._id}
Trek: ${trek?.name || "N/A"}
Dates: ${
    batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : "N/A"
  } to ${batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : "N/A"}
Total Amount: ₹${booking.totalPrice}
Payment Status: Confirmed
${payment ? `Payment Method: ${payment.method}` : ""}

👥 PARTICIPANTS:
${participantList}

📝 ADDITIONAL REQUESTS:
${additionalRequests || "None"}

⚠️ IMPORTANT INFORMATION:
• Please arrive 30 minutes before the scheduled pickup time.
• Check the "Things to Carry" list in the itinerary PDF or the event info on our website.
• Carry a water bottle and some snacks.
• Don’t forget to carry 2 Xerox copies and your original ID proof.

📞 NEXT STEPS:
• For treks and trips near Bengaluru, a WhatsApp group will be created one day prior to departure, and all further details will be shared in the group.
• For Himalayan treks, the WhatsApp group will be created one week prior to departure, and all further communication will happen there.

❓ NEED HELP?
DM us or reach out via WhatsApp call only: 9449493112

🔁 Cancellation or Reschedule Requests
You can raise a request through "My Bookings" or "View Bookings" → Support Tickets section.

🏔️ We look forward to an amazing trek with you!

Best regards,
The Bengaluru Trekkers Team
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
            <div class="logo">
                <img src="https://s3.ap-south-1.amazonaws.com/bucket.bengalurutrekkers/images/1753156158875-logo-transperant.png" alt="Bengaluru Trekkers" style="height: 60px; width: auto; max-width: 200px; filter: brightness(0) invert(1); display: block; margin: 0 auto;">
            </div>
            <div class="logo-text">Bengaluru Trekkers</div>
            <div class="subtitle">Your Adventure Awaits</div>
        </div>

        <h2>Dear Participant,</h2>
        
        <div class="confirmation-container">
            <div class="section-title" style="color: white !important;">🎉 Booking Confirmed!</div>
            <p  style="color: white !important;" >Your trek booking has been fully confirmed!</p>
            <div class="booking-id">${booking._id}</div>
        </div>

        <div class="section">
            <div class="section-title">📋 Booking Details</div>
            <ul class="info-list">
                <li><strong>Booking ID:</strong> ${booking._id}</li>
                <li><strong>Trek:</strong> ${trek?.name || "N/A"}</li>
                <li><strong>Dates:</strong> ${
                  batch?.startDate
                    ? new Date(batch.startDate).toLocaleDateString()
                    : "N/A"
                } to ${
    batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : "N/A"
  }</li>
                <li><strong>Total Amount:</strong> ₹${booking.totalPrice}</li>
                <li><strong>Payment Status:</strong> Confirmed</li>
                ${
                  payment
                    ? `<li><strong>Payment Method:</strong> ${payment.method}</li>`
                    : ""
                }
            </ul>
        </div>

        <div class="section">
            <div class="section-title">👥 Participants</div>
            <ul class="info-list">
                ${participants
                  .map(
                    (p, index) =>
                      `<li><strong>${index + 1}.</strong> ${p.name} (Age: ${
                        p.age
                      }, Gender: ${p.gender})</li>`
                  )
                  .join("")}
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📝 Additional Requests</div>
            <p>${additionalRequests || "None"}</p>
        </div>

        <div class="warning">
            <div class="section-title">⚠️ Important Information</div>
            <ul class="info-list">
                <li>Please arrive 30 minutes before the scheduled pickup time.</li>
                <li>Check the "Things to Carry" list in the itinerary PDF or the event info on our website.</li>
                <li>Carry a water bottle and some snacks.</li>
                <li>Don’t forget to carry 2 Xerox copies and your original ID proof.</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">📞 Next Steps</div>
            <p> For treks and trips near Bengaluru, a WhatsApp group will be created one day prior to departure, and all further details will be shared in the group.</p>
            <p>For Himalayan treks, the WhatsApp group will be created one week prior to departure, and all further communication will happen there.<p>
        </div>

        <div class="section">
            <div class="section-title">❓ Need Help?</div>
            <p>DM us or reach out via WhatsApp call only: 9449493112</p>
        </div>

        <div class="section">
            <div class="section-title">🔁 Cancellation or Reschedule Requests</div>
            <p>You can raise a request through "My Bookings" or "View Bookings" → Support Tickets section.</p>
        </div>

        <p style="text-align: center; font-size: 18px; color: #10b981; margin: 30px 0;">
            🏔️ We look forward to an amazing trek with you!
        </p>

        <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Bengaluru Trekkers Team<br>
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

  // Send email to all participants
  const emailPromises = [];

  // Send to booking owner
  emailPromises.push(
    sendEmail({
      to: user.email,
      subject: emailSubject,
      text: emailContent,
      html: htmlContent,
    })
  );

  // Send to all participants who have email addresses
  participants.forEach((participant) => {
    if (participant.email && participant.email !== user.email) {
      emailPromises.push(
        sendEmail({
          to: participant.email,
          subject: emailSubject,
          text: emailContent,
          html: htmlContent,
        })
      );
    }
  });

  // Wait for all emails to be sent
  const results = await Promise.allSettled(emailPromises);

  // Log results
  const successful = results.filter(
    (result) => result.status === "fulfilled"
  ).length;
  const failed = results.filter(
    (result) => result.status === "rejected"
  ).length;

  console.log(
    `Sent confirmation emails to ${successful} participants (${failed} failed)`
  );

  return {
    totalSent: successful,
    totalFailed: failed,
    results,
  };
};

module.exports = {
  sendEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceivedEmail,
  sendBookingReminderEmail,
  sendBatchShiftNotificationEmail,
  sendProfessionalInvoiceEmail,
  sendCancellationEmail,
  sendParticipantCancellationEmails,
  sendRescheduleApprovalEmail,
  sendPartialPaymentReminderEmail,
  sendPartialPaymentConfirmationEmail,
  sendEmailWithAttachment,
  sendConfirmationEmailToAllParticipants,
};
