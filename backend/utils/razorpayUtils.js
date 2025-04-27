const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function refundPayment(paymentId, amount) {
  // amount in paise
  try {
    const refund = await razorpay.payments.refund(paymentId, { amount });
    return { success: true, refund };
  } catch (error) {
    return { success: false, error: error.message || error };
  }
}

module.exports = { refundPayment }; 