const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const PromoCode = require("../models/PromoCode");
const {
  sendEmail,
  sendPaymentReceivedEmail,
  sendPartialPaymentConfirmationEmail,
  sendEmailWithAttachment,
  sendBookingConfirmationEmail,
  sendConfirmationEmailToAllParticipants,
} = require("../utils/email");
const { generateInvoicePDF } = require("../utils/invoiceGenerator");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a new Razorpay order
 * @route POST /api/payments/create-order
 * @access Private
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      amount,
      bookingId,
      currency = "INR",
      partial_payment = false,
    } = req.body;

    // Validate required fields
    if (!amount || !bookingId) {
      return res.status(400).json({
        success: false,
        message: "Amount and bookingId are required",
      });
    }

    // Create order
    const options = {
      amount: Math.round(amount * 100), // Razorpay amount is in paisa (multiply by 100 and round to avoid floating point issues)
      currency,
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId,
        userId: req.user._id.toString(),
      },
      partial_payment,
      payment_capture: 1, // Auto-capture payment
    };

    // Add partial payment options if enabled
    if (partial_payment) {
      options.first_payment_min_amount = Math.round(amount * 0.2 * 100); // Minimum 20% of total amount
    }

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message,
    });
  }
};

/**
 * Verify Razorpay payment signature
 * @route POST /api/payments/verify
 * @access Private
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Update booking status if signature is valid
    if (bookingId) {
      const booking = await Booking.findById(bookingId)
        .populate("trek")
        .populate("user", "name email");

      if (booking) {
        const paidAmount = payment.amount / 100; // Convert from paisa to rupees

        // Handle partial payment logic
        if (
          booking.paymentMode === "partial" &&
          booking.partialPaymentDetails
        ) {
          const { initialAmount, remainingAmount } =
            booking.partialPaymentDetails;

          // Check if this is a remaining balance payment
          if (
            booking.status === "payment_confirmed_partial" &&
            paidAmount >= remainingAmount
          ) {
            // Remaining balance payment completed
            booking.partialPaymentDetails.finalPaymentDate = new Date();
            booking.partialPaymentDetails.remainingAmount = 0;

            // Check if participant details are available
            if (
              booking.participantDetails &&
              booking.participantDetails.length > 0
            ) {
              booking.status = "confirmed";
            } else {
              booking.status = "payment_completed";
            }
          } else if (paidAmount >= initialAmount) {
            // Initial partial payment completed
            booking.status = "payment_confirmed_partial";
            booking.partialPaymentDetails.remainingAmount = remainingAmount;
          } else {
            // Partial payment but not enough for initial amount
            booking.status = "pending_payment";
            booking.partialPaymentDetails.remainingAmount =
              remainingAmount + (initialAmount - paidAmount);
          }
        } else {
          // Full payment
          booking.status = "payment_completed";
        }

        booking.paymentDetails = {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
          paidAt: new Date(),
          amount: paidAmount,
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
        };

        // Increment promo code used count if a promo code was used
        if (booking.promoCodeDetails && booking.promoCodeDetails.code) {
          try {
            let promoCode;
            // Try to find by ID first, then by code
            if (booking.promoCodeDetails.promoCodeId) {
              promoCode = await PromoCode.findById(
                booking.promoCodeDetails.promoCodeId
              );
            }
            if (!promoCode) {
              promoCode = await PromoCode.findOne({
                code: booking.promoCodeDetails.code,
              });
            }
            if (promoCode) {
              promoCode.usedCount += 1;
              await promoCode.save();
              console.log(
                `Incremented used count for promo code: ${booking.promoCodeDetails.code}`
              );
            }
          } catch (promoError) {
            console.error("Error updating promo code used count:", promoError);
            // Don't fail the payment verification if promo code update fails
          }
        }

        await booking.save();

        // Send payment confirmation email with invoice
        try {
          const trek = booking.trek;
          const user = booking.user;

          const paymentDetails = {
            id: razorpay_payment_id,
            amount: payment.amount,
            method: payment.method,
          };

          // Check if this is a partial payment
          const isPartialPayment =
            booking.paymentMode === "partial" && booking.partialPaymentDetails;
          const isRemainingBalancePayment =
            isPartialPayment &&
            booking.partialPaymentDetails.remainingAmount === 0;

          if (isPartialPayment && !isRemainingBalancePayment) {
            // Find the actual batch object from trek's batches array
            const batch = trek?.batches?.find(
              (b) => b._id.toString() === booking.batch?.toString()
            );
            
            // Send partial payment confirmation email with invoice attachment (initial payment)
            await sendPartialPaymentConfirmationEmail(
              booking,
              trek,
              user,
              paymentDetails,
              batch
            );
          } else if (isRemainingBalancePayment) {
            // For remaining balance payment, send booking confirmation email to all participants if status is confirmed
            if (booking.status === "confirmed") {
              try {
                const batch = trek?.batches?.find(
                  (b) => b._id.toString() === booking.batch?.toString()
                );
                const participants = booking.participantDetails || [];

                console.log(
                  "Sending booking confirmation email to all participants for remaining balance payment"
                );
                await sendConfirmationEmailToAllParticipants(
                  booking,
                  trek,
                  user,
                  participants,
                  batch,
                  booking.additionalRequests,
                  paymentDetails
                );
                console.log(
                  "Booking confirmation emails sent successfully to all participants"
                );
              } catch (bookingEmailError) {
                console.error(
                  "Error sending booking confirmation emails to all participants:",
                  bookingEmailError
                );
              }
            }

            // Send payment confirmation email with invoice attachment
            try {
              const invoiceBuffer = await generateInvoicePDF(
                booking,
                paymentDetails
              );
              await sendEmailWithAttachment({
                to: user.email,
                subject: `💳 Payment Confirmed - ${
                  trek?.name || "Bengaluru Trekkers"
                }`,
                text: `Dear ${
                  user.name
                },\n\n💳 Thank you for your payment! Your booking has been confirmed.\n\n📋 INVOICE DETAILS:\nBooking ID: ${
                  booking._id
                }\nTrek: ${trek?.name || "N/A"}\nParticipants: ${
                  booking.numberOfParticipants
                }\nAmount Paid: ₹${payment.amount / 100}\nPayment Method: ${
                  payment.method
                }\nPayment ID: ${
                  payment.id
                }\nPayment Date: ${new Date().toLocaleDateString()}\n\n📝 NEXT STEPS:\n1. Please complete your participant details to finalize your booking\n2. You will receive a final confirmation email once all details are submitted\n3. Our team will contact you with further instructions\n\n❓ NEED HELP?\nIf you have any questions, please don't hesitate to contact us.\n\n🏔️ We look forward to an amazing trek with you!\n\nBest regards,\nThe Trek Team\nYour Adventure Awaits!\n\n---\nThis is an automated message. Please do not reply to this email.\nFor support, contact us through our website or mobile app.`,
                html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💳 Payment Confirmed - ${trek?.name || "Trek Booking"}</title>
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
            <div class="section-title"  style="color: white !important;" >💳 Payment Confirmed!</div>
            <p  style="color: white !important;" >Thank you for your payment! Your booking has been confirmed.</p>
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
</html>`,
                attachmentBuffer: invoiceBuffer,
                attachmentFilename: `Invoice-${booking._id}.pdf`,
              });
            } catch (invoiceError) {
              console.error(
                "Error generating or sending invoice PDF:",
                invoiceError
              );
              // Fallback to sending payment confirmation email without invoice
              await sendPaymentReceivedEmail(
                booking,
                trek,
                user,
                paymentDetails
              );
            }
          } else {
            // Send regular payment confirmation email with invoice attachment for full payments
            try {
              const invoiceBuffer = await generateInvoicePDF(
                booking,
                paymentDetails
              );
              await sendEmailWithAttachment({
                to: user.email,
                subject: `💳 Payment Confirmed - ${
                  trek?.name || "Trek Booking"
                }`,
                text: `Dear ${
                  user.name
                },\n\n💳 Thank you for your payment! Your booking has been confirmed.\n\n📋 INVOICE DETAILS:\nBooking ID: ${
                  booking._id
                }\nTrek: ${trek?.name || "N/A"}\nParticipants: ${
                  booking.numberOfParticipants
                }\nAmount Paid: ₹${payment.amount / 100}\nPayment Method: ${
                  payment.method
                }\nPayment ID: ${
                  payment.id
                }\nPayment Date: ${new Date().toLocaleDateString()}\n\n📝 NEXT STEPS:\n1. Please complete your participant details to finalize your booking\n2. You will receive a final confirmation email once all details are submitted\n3. Our team will contact you with further instructions\n\n❓ NEED HELP?\nIf you have any questions, please don't hesitate to contact us.\n\n🏔️ We look forward to an amazing trek with you!\n\nBest regards,\nThe Trek Team\nYour Adventure Awaits!\n\n---\nThis is an automated message. Please do not reply to this email.\nFor support, contact us through our website or mobile app.`,
                html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💳 Payment Confirmed - ${trek?.name || "Bengaluru Trekkers"}</title>
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
            <p  style="color: white !important;" >Thank you for your payment! Your booking has been confirmed.</p>
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
</html>`,
                attachmentBuffer: invoiceBuffer,
                attachmentFilename: `Invoice-${booking._id}.pdf`,
              });

              // If booking is confirmed and has participant details, send confirmation emails to all participants
              if (
                booking.status === "confirmed" &&
                booking.participantDetails &&
                booking.participantDetails.length > 0
              ) {
                try {
                  const batch = trek?.batches?.find(
                    (b) => b._id.toString() === booking.batch?.toString()
                  );
                  const participants = booking.participantDetails || [];

                  console.log(
                    "Sending booking confirmation email to all participants for full payment"
                  );
                  await sendConfirmationEmailToAllParticipants(
                    booking,
                    trek,
                    user,
                    participants,
                    batch,
                    booking.additionalRequests,
                    paymentDetails
                  );
                  console.log(
                    "Booking confirmation emails sent successfully to all participants"
                  );
                } catch (participantEmailError) {
                  console.error(
                    "Error sending booking confirmation emails to all participants:",
                    participantEmailError
                  );
                }
              }
            } catch (invoiceError) {
              console.error(
                "Error generating or sending invoice PDF:",
                invoiceError
              );
              // Fallback to sending payment confirmation email without invoice
              await sendPaymentReceivedEmail(
                booking,
                trek,
                user,
                paymentDetails
              );
            }
          }
        } catch (emailError) {
          console.error(
            "Error sending payment confirmation email:",
            emailError
          );
          // Don't fail the payment verification if email fails
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        id: razorpay_payment_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

/**
 * Get Razorpay key
 * @route GET /api/payments/get-key
 * @access Private
 */
exports.getRazorpayKey = (req, res) => {
  try {
    const key = process.env.RAZORPAY_KEY_ID;

    if (!key) {
      return res.status(500).json({
        success: false,
        message: "Razorpay key not configured",
      });
    }

    // Set no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.status(200).json({
      success: true,
      key: key,
    });
  } catch (error) {
    console.error("Error getting Razorpay key:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get Razorpay key",
      error: error.message,
    });
  }
};

/**
 * Handle Razorpay webhook events
 * @route POST /api/payments/webhook
 * @access Public
 */
exports.handleWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;
    const signature = req.headers["x-razorpay-signature"];

    // Verify webhook signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    // Handle different webhook events
    switch (event) {
      case "payment.authorized":
        // Handle authorized payment
        break;
      case "payment.failed":
        // Handle failed payment
        break;
      case "payment.captured":
        // Handle captured payment
        break;
      case "refund.processed":
        // Handle refund
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({
      success: false,
      message: "Failed to handle webhook",
      error: error.message,
    });
  }
};

/**
 * Create order for remaining balance payment
 * @route POST /api/payments/create-remaining-balance-order
 * @access Private
 */
exports.createRemainingBalanceOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate required fields
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    // Find booking and check if it's eligible for remaining balance payment
    const booking = await Booking.findById(bookingId)
      .populate("trek")
      .populate("user", "name email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to pay for this booking",
      });
    }

    if (
      booking.paymentMode !== "partial" ||
      booking.status !== "payment_confirmed_partial"
    ) {
      return res.status(400).json({
        success: false,
        message: "This booking is not eligible for remaining balance payment",
      });
    }

    const remainingAmount = booking.partialPaymentDetails.remainingAmount;

    if (remainingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No remaining balance to pay",
      });
    }

    // Create order for remaining balance
    const options = {
      amount: Math.round(remainingAmount * 100), // Razorpay amount is in paisa
      currency: "INR",
      receipt: `rb_${bookingId.slice(-8)}`, // Use last 8 chars of booking ID to keep it short
      notes: {
        bookingId,
        userId: req.user._id.toString(),
        paymentType: "remaining_balance",
      },
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      remainingAmount,
    });
  } catch (error) {
    console.error("Error creating remaining balance order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create remaining balance order",
      error: error.message,
    });
  }
};
