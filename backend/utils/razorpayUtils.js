const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function refundPayment(paymentId, amount) {
  // amount in paise
  console.log(`[REFUND] Attempting refund for paymentId: ${paymentId}, amount: ${amount} paise (₹${amount/100})`);
  try {
    // Validate inputs
    if (!paymentId) {
      console.error('[REFUND] Error: paymentId is required');
      return { success: false, error: 'Payment ID is required' };
    }
    if (!amount || amount <= 0) {
      console.error('[REFUND] Error: Invalid amount', amount);
      return { success: false, error: 'Invalid refund amount' };
    }
    // Check if payment exists and is captured
    let payment;
    try {
      payment = await razorpay.payments.fetch(paymentId);
      console.log(`[REFUND] Payment status: ${payment.status}, amount: ${payment.amount}`);
      if (payment.status !== 'captured') {
        console.error(`[REFUND] Error: Payment not captured. Status: ${payment.status}`);
        return { success: false, error: `Payment not captured. Status: ${payment.status}` };
      }
      if (amount > payment.amount) {
        console.error(`[REFUND] Error: Refund amount (${amount}) exceeds payment amount (${payment.amount})`);
        return { success: false, error: 'Refund amount exceeds payment amount' };
      }
    } catch (fetchError) {
      console.error('[REFUND] Error fetching payment:', fetchError.message);
      return { success: false, error: `Payment not found: ${fetchError.message}` };
    }
    // Process refund
    const refund = await razorpay.payments.refund(paymentId, {
      amount,
      notes: {
        reason: 'Booking cancellation',
        refunded_at: new Date().toISOString()
      }
    });
    console.log(`[REFUND] Success! Refund ID: ${refund.id}, Status: ${refund.status}, Amount: ${refund.amount}`);
    return { success: true, refund };
  } catch (error) {
    console.error('[REFUND] Razorpay API Error:', {
      message: error.message,
      description: error.description,
      code: error.code,
      field: error.field
    });
    return { success: false, error: error.message || error };
  }
}

module.exports = { refundPayment }; 