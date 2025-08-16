const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const PromoCode = require("../models/PromoCode");
const {
  sendPartialPaymentConfirmationEmail,
  sendEmailWithAttachment,
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

    // Get payment details from Razorpay for verification
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Return verification result only
    res.status(200).json({
      success: true,
      message: "Payment signature verified successfully",
      payment: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: payment.amount / 100, // Convert from paisa to rupees
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        verifiedAt: new Date()
      }
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

    console.log(`[WEBHOOK] Received ${event} event from Razorpay`);

    // Verify webhook signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (generatedSignature !== signature) {
      console.error(`[WEBHOOK] Invalid signature for ${event} event`);
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    console.log(`[WEBHOOK] Signature verified for ${event} event`);

    // Handle different webhook events
    switch (event) {
      case "payment.authorized":
        console.log(`[WEBHOOK] Payment authorized: ${payload.payment.entity.id}`);
        // Payment is authorized but not yet captured
        break;

      case "payment.failed":
        console.log(`[WEBHOOK] Payment failed: ${payload.payment.entity.id}`);
        await handlePaymentFailed(payload.payment.entity);
        break;

      case "payment.captured":
        console.log(`[WEBHOOK] Payment captured: ${payload.payment.entity.id}`);
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case "refund.processed":
        console.log(`[WEBHOOK] Refund processed: ${payload.refund.entity.id}`);
        await handleRefundProcessed(payload.refund.entity);
        break;

      default:
        console.log(`[WEBHOOK] Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`[WEBHOOK] Error handling webhook:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to handle webhook",
      error: error.message,
    });
  }
};

/**
 * Handle payment captured event from webhook
 */
async function handlePaymentCaptured(paymentEntity) {
  try {
    const paymentId = paymentEntity.id;
    const orderId = paymentEntity.order_id;
    const amount = paymentEntity.amount / 100; // Convert from paisa to rupees
    const currency = paymentEntity.currency;
    const method = paymentEntity.method;
    const status = paymentEntity.status;

    console.log(`[WEBHOOK] Processing captured payment: ${paymentId}, Amount: ₹${amount}`);

    // Find booking by order ID (from notes)
    const order = await razorpay.orders.fetch(orderId);
    if (!order || !order.notes || !order.notes.bookingId) {
      console.error(`[WEBHOOK] No booking ID found in order notes for payment: ${paymentId}`);
      return;
    }

    const bookingId = order.notes.bookingId;
    const userId = order.notes.userId;

    console.log(`[WEBHOOK] Found booking: ${bookingId} for user: ${userId}`);

    // Find and update the booking
    const booking = await Booking.findById(bookingId)
      .populate("trek")
      .populate("user", "name email");

    if (!booking) {
      console.error(`[WEBHOOK] Booking not found: ${bookingId}`);
      return;
    }

    // Check if payment is already processed
    if (booking.paymentDetails && booking.paymentDetails.paymentId === paymentId) {
      console.log(`[WEBHOOK] Payment ${paymentId} already processed for booking ${bookingId}`);
      return;
    }

    // Update booking payment details
    booking.paymentDetails = {
      paymentId: paymentId,
      orderId: orderId,
      signature: "webhook_verified", // Since this is from webhook
      paidAt: new Date(),
      amount: amount,
      currency: currency,
      method: method,
      status: status,
    };

    // Update booking status based on payment mode
    if (booking.paymentMode === "partial") {
      if (booking.partialPaymentDetails && booking.partialPaymentDetails.remainingAmount > 0) {
        // This is a remaining balance payment
        const remainingAmount = booking.partialPaymentDetails.remainingAmount;
        if (amount >= remainingAmount) {
          booking.status = "payment_completed";
          booking.partialPaymentDetails.remainingAmount = 0;
          console.log(`[WEBHOOK] Remaining balance payment completed for booking ${bookingId}`);
        } else {
          booking.status = "payment_confirmed_partial";
          booking.partialPaymentDetails.remainingAmount = remainingAmount;
          console.log(`[WEBHOOK] Partial payment updated for booking ${bookingId}, remaining: ₹${booking.partialPaymentDetails.remainingAmount}`);
        }
      } else {
        // This is the initial partial payment
        const totalAmount = booking.totalPrice;
        const initialPaymentAmount = amount;
        const remainingAmount = totalAmount - initialPaymentAmount;

        console.log(`[WEBHOOK] Partial payment calculation: totalAmount=${totalAmount}, initialPaymentAmount=${initialPaymentAmount}, remainingAmount=${remainingAmount}`);

        booking.status = "payment_confirmed_partial";
        booking.partialPaymentDetails = {
          initialAmount: initialPaymentAmount,
          remainingAmount: remainingAmount,
          initialPaymentDate: new Date(),
        };

        console.log(`[WEBHOOK] Initial partial payment processed for booking ${bookingId}, remaining: ₹${remainingAmount}`);
      }
    } else {
      // Full payment
      booking.status = "payment_completed";
      console.log(`[WEBHOOK] Full payment completed for booking ${bookingId}`);
    }

    // Increment promo code used count if a promo code was used
    if (booking.promoCodeDetails && booking.promoCodeDetails.code) {
      try {
        let promoCode;
        if (booking.promoCodeDetails.promoCodeId) {
          promoCode = await PromoCode.findById(booking.promoCodeDetails.promoCodeId);
        }
        if (!promoCode) {
          promoCode = await PromoCode.findOne({ code: booking.promoCodeDetails.code });
        }
        if (promoCode) {
          promoCode.usedCount += 1;
          await promoCode.save();
          console.log(`[WEBHOOK] Incremented used count for promo code: ${booking.promoCodeDetails.code}`);
        }
      } catch (promoError) {
        console.error(`[WEBHOOK] Error updating promo code used count:`, promoError);
      }
    }

    // Save the updated booking
    await booking.save();
    console.log(`[WEBHOOK] Booking ${bookingId} updated successfully with payment ${paymentId}`);

    // Send confirmation emails
    try {
      if (booking.paymentMode === "partial" && booking.status === "payment_confirmed_partial") {
        // Send partial payment confirmation
        const batch = booking.trek?.batches?.find(
          (b) => b._id.toString() === booking.batch?.toString()
        );
        const paymentData = { id: paymentId, amount: amount, method: method };
        console.log(`[WEBHOOK] Sending partial payment email with payment data:`, paymentData);
        console.log(`[WEBHOOK] Booking partialPaymentDetails:`, booking.partialPaymentDetails);
        
        await sendPartialPaymentConfirmationEmail(
          booking,
          booking.trek,
          booking.user,
          paymentData,
          batch
        );
        console.log(`[WEBHOOK] Partial payment confirmation email sent for booking ${bookingId}`);
      } else if (booking.status === "payment_completed") {
        // Send full payment confirmation
        const invoiceBuffer = await generateInvoicePDF(
          booking,
          { id: paymentId, amount: amount, method: method }
        );

        const payment = { id: paymentId, amount: amount, method: method };

        const trek = booking.trek;
        const user = booking.user;

        await sendEmailWithAttachment({
          to: user.email,
          subject: `💳 Payment Confirmed - ${trek?.name || "Bengaluru Trekkers"
            }`,
          text: `Dear ${user.name
            },\n\n💳 Thank you for your payment! Your booking has been confirmed.\n\n📋 INVOICE DETAILS:\nBooking ID: ${booking._id
            }\nTrek: ${trek?.name || "N/A"}\nParticipants: ${booking.numberOfParticipants
            }\nAmount Paid: ₹${payment.amount?.toFixed(2) || "0.00"}\nPayment Method: ${payment.method
            }\nPayment ID: ${payment.id
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
<div class="amount">₹${payment.amount}</div>
</div>

<div class="section">
<div class="section-title">📋 Invoice Details</div>
<ul class="info-list">
<li><strong>Booking ID:</strong> ${booking._id}</li>
<li><strong>Trek:</strong> ${trek?.name || "N/A"}</li>
<li><strong>Participants:</strong> ${booking.numberOfParticipants
            }</li>
<li><strong>Amount Paid:</strong> ₹${payment.amount}</li>
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
        console.log(`[WEBHOOK] Payment confirmation email sent for booking ${bookingId}`);
      }
    } catch (emailError) {
      console.error(`[WEBHOOK] Error sending confirmation email for booking ${bookingId}:`, emailError);
      // Don't fail the webhook if email fails
    }

  } catch (error) {
    console.error(`[WEBHOOK] Error processing payment captured event:`, error);
    throw error;
  }
}

/**
 * Handle payment failed event from webhook
 */
async function handlePaymentFailed(paymentEntity) {
  try {
    const paymentId = paymentEntity.id;
    const orderId = paymentEntity.order_id;
    const errorCode = paymentEntity.error_code;
    const errorDescription = paymentEntity.error_description;

    console.log(`[WEBHOOK] Processing failed payment: ${paymentId}, Error: ${errorCode} - ${errorDescription}`);

    // Find booking by order ID
    const order = await razorpay.orders.fetch(orderId);
    if (!order || !order.notes || !order.notes.bookingId) {
      console.error(`[WEBHOOK] No booking ID found in order notes for failed payment: ${paymentId}`);
      return;
    }

    const bookingId = order.notes.bookingId;
    console.log(`[WEBHOOK] Found booking for failed payment: ${bookingId}`);

    // Update booking status to indicate payment failure
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.status = "pending_payment";
      if (!booking.paymentDetails) {
        booking.paymentDetails = {};
      }
      booking.paymentDetails.lastError = {
        code: errorCode,
        description: errorDescription,
        timestamp: new Date(),
      };
      await booking.save();
      console.log(`[WEBHOOK] Booking ${bookingId} marked as payment failed`);
    }

  } catch (error) {
    console.error(`[WEBHOOK] Error processing payment failed event:`, error);
    throw error;
  }
}

/**
 * Handle refund processed event from webhook
 */
async function handleRefundProcessed(refundEntity) {
  try {
    const refundId = refundEntity.id;
    const paymentId = refundEntity.payment_id;
    const amount = refundEntity.amount / 100; // Convert from paisa to rupees
    const status = refundEntity.status;

    console.log(`[WEBHOOK] Processing refund: ${refundId}, Amount: ₹${amount}, Status: ${status}`);

    // Find booking by payment ID
    const booking = await Booking.findOne({
      "paymentDetails.paymentId": paymentId
    });

    if (booking) {
      if (!booking.paymentDetails) {
        booking.paymentDetails = {};
      }
      booking.paymentDetails.refund = {
        refundId: refundId,
        amount: amount,
        status: status,
        processedAt: new Date(),
      };
      await booking.save();
      console.log(`[WEBHOOK] Refund details updated for booking ${booking._id}`);
    }

  } catch (error) {
    console.error(`[WEBHOOK] Error processing refund event:`, error);
    throw error;
  }
}

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
