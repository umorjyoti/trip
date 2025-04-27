const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');

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
      amount: amount * 100, // Razorpay amount is in paisa (multiply by 100)
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
      options.first_payment_min_amount = Math.floor(amount * 0.2 * 100); // Minimum 20% of total amount
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
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.status = 'confirmed';
        booking.paymentDetails = {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
          paidAt: new Date(),
          amount: payment.amount / 100, // Convert from paisa to rupees
          currency: payment.currency,
          method: payment.method,
          status: payment.status
        };
        await booking.save();
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