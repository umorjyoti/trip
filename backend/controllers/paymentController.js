const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const PromoCode = require('../models/PromoCode');
const { sendEmail, sendPaymentReceivedEmail, sendPartialPaymentConfirmationEmail, sendEmailWithAttachment, sendBookingConfirmationEmail } = require('../utils/email');
const { generateInvoicePDF } = require('../utils/invoiceGenerator');

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
    const { amount, bookingId, currency = 'INR', partial_payment = false } = req.body;

    // Validate required fields
    if (!amount || !bookingId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount and bookingId are required' 
      });
    }

    // Create order
    const options = {
      amount: Math.round(amount * 100), // Razorpay amount is in paisa (multiply by 100 and round to avoid floating point issues)
      currency,
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId,
        userId: req.user._id.toString()
      },
      partial_payment,
      payment_capture: 1 // Auto-capture payment
    };

    // Add partial payment options if enabled
    if (partial_payment) {
      options.first_payment_min_amount = Math.round(amount * 0.2 * 100); // Minimum 20% of total amount
    }

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Update booking status if signature is valid
    if (bookingId) {
      const booking = await Booking.findById(bookingId)
        .populate('trek')
        .populate('user', 'name email');
      
      if (booking) {
        const paidAmount = payment.amount / 100; // Convert from paisa to rupees
        
        // Handle partial payment logic
        if (booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
          const { initialAmount, remainingAmount } = booking.partialPaymentDetails;
          
          // Check if this is a remaining balance payment
          if (booking.status === 'payment_confirmed_partial' && paidAmount >= remainingAmount) {
            // Remaining balance payment completed
            booking.partialPaymentDetails.finalPaymentDate = new Date();
            booking.partialPaymentDetails.remainingAmount = 0;
            
            // Check if participant details are available
            if (booking.participantDetails && booking.participantDetails.length > 0) {
              booking.status = 'confirmed';
            } else {
              booking.status = 'payment_completed';
            }
          } else if (paidAmount >= initialAmount) {
            // Initial partial payment completed
            booking.status = 'payment_confirmed_partial';
            booking.partialPaymentDetails.remainingAmount = remainingAmount;
          } else {
            // Partial payment but not enough for initial amount
            booking.status = 'pending_payment';
            booking.partialPaymentDetails.remainingAmount = remainingAmount + (initialAmount - paidAmount);
          }
        } else {
          // Full payment
          booking.status = 'payment_completed';
        }
        
        booking.paymentDetails = {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
          paidAt: new Date(),
          amount: paidAmount,
          currency: payment.currency,
          method: payment.method,
          status: payment.status
        };
        
        // Increment promo code used count if a promo code was used
        if (booking.promoCodeDetails && booking.promoCodeDetails.code) {
          try {
            let promoCode;
            // Try to find by ID first, then by code
            if (booking.promoCodeDetails.promoCodeId) {
              promoCode = await PromoCode.findById(booking.promoCodeDetails.promoCodeId);
            }
            if (!promoCode) {
              promoCode = await PromoCode.findOne({ code: booking.promoCodeDetails.code });
            }
            if (promoCode) {
              promoCode.usedCount += 1;
              await promoCode.save();
              console.log(`Incremented used count for promo code: ${booking.promoCodeDetails.code}`);
            }
          } catch (promoError) {
            console.error('Error updating promo code used count:', promoError);
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
            method: payment.method
          };

          // Check if this is a partial payment
          const isPartialPayment = booking.paymentMode === 'partial' && booking.partialPaymentDetails;
          const isRemainingBalancePayment = isPartialPayment && booking.partialPaymentDetails.remainingAmount === 0;
          
          if (isPartialPayment && !isRemainingBalancePayment) {
            // Send partial payment confirmation email with invoice attachment (initial payment)
            await sendPartialPaymentConfirmationEmail(booking, trek, user, paymentDetails, booking.batch);
          } else if (isRemainingBalancePayment) {
            // For remaining balance payment, send booking confirmation email if status is confirmed
            if (booking.status === 'confirmed') {
              try {
                const batch = trek?.batches?.find(b => b._id.toString() === booking.batch?.toString());
                const participants = booking.participantDetails || [];
                
                console.log('Sending booking confirmation email for remaining balance payment to:', user.email);
                await sendBookingConfirmationEmail(booking, trek, user, participants, batch, booking.additionalRequests);
                console.log('Booking confirmation email sent successfully');
              } catch (bookingEmailError) {
                console.error('Error sending booking confirmation email:', bookingEmailError);
              }
            }
            
            // Send payment confirmation email with invoice
            await sendPaymentReceivedEmail(booking, trek, user, paymentDetails);
            
            // Generate invoice PDF and send as attachment
            try {
              const invoiceBuffer = await generateInvoicePDF(booking, paymentDetails);
              await sendEmailWithAttachment({
                to: user.email,
                subject: `Your Invoice for Booking ${booking._id}`,
                text: `Dear ${user.name},\n\nThank you for your payment! Please find your invoice attached.\n\nBooking ID: ${booking._id}\nTrek: ${trek?.name || 'N/A'}\nAmount Paid: ₹${payment.amount / 100}\n\nBest regards,\nTrek Adventures Team`,
                attachmentBuffer: invoiceBuffer,
                attachmentFilename: `Invoice-${booking._id}.pdf`
              });
            } catch (invoiceError) {
              console.error('Error generating or sending invoice PDF:', invoiceError);
            }
          } else {
            // Send regular payment confirmation email for full payments
            await sendPaymentReceivedEmail(booking, trek, user, paymentDetails);
            
            // Generate invoice PDF and send as attachment for full payments only
            try {
              const invoiceBuffer = await generateInvoicePDF(booking, paymentDetails);
              await sendEmailWithAttachment({
                to: user.email,
                subject: `Your Invoice for Booking ${booking._id}`,
                text: `Dear ${user.name},\n\nThank you for your payment! Please find your invoice attached.\n\nBooking ID: ${booking._id}\nTrek: ${trek?.name || 'N/A'}\nAmount Paid: ₹${payment.amount / 100}\n\nBest regards,\nTrek Adventures Team`,
                attachmentBuffer: invoiceBuffer,
                attachmentFilename: `Invoice-${booking._id}.pdf`
              });
            } catch (invoiceError) {
              console.error('Error generating or sending invoice PDF:', invoiceError);
            }
          }
        } catch (emailError) {
          console.error('Error sending payment confirmation email:', emailError);
          // Don't fail the payment verification if email fails
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: razorpay_payment_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
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
        message: 'Razorpay key not configured'
      });
    }

    // Set no-cache headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.status(200).json({
      success: true,
      key: key
    });
  } catch (error) {
    console.error('Error getting Razorpay key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Razorpay key',
      error: error.message
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
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Handle different webhook events
    switch (event) {
      case 'payment.authorized':
        // Handle authorized payment
        break;
      case 'payment.failed':
        // Handle failed payment
        break;
      case 'payment.captured':
        // Handle captured payment
        break;
      case 'refund.processed':
        // Handle refund
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle webhook',
      error: error.message
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
        message: 'Booking ID is required' 
      });
    }

    // Find booking and check if it's eligible for remaining balance payment
    const booking = await Booking.findById(bookingId)
      .populate('trek')
      .populate('user', 'name email');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to pay for this booking'
      });
    }

    if (booking.paymentMode !== 'partial' || booking.status !== 'payment_confirmed_partial') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not eligible for remaining balance payment'
      });
    }

    const remainingAmount = booking.partialPaymentDetails.remainingAmount;
    
    if (remainingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No remaining balance to pay'
      });
    }

    // Create order for remaining balance
    const options = {
      amount: Math.round(remainingAmount * 100), // Razorpay amount is in paisa
      currency: 'INR',
      receipt: `rb_${bookingId.slice(-8)}`, // Use last 8 chars of booking ID to keep it short
      notes: {
        bookingId,
        userId: req.user._id.toString(),
        paymentType: 'remaining_balance'
      },
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      remainingAmount
    });
  } catch (error) {
    console.error('Error creating remaining balance order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create remaining balance order',
      error: error.message
    });
  }
}; 