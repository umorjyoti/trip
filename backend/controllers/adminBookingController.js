const Booking = require('../models/Booking');
const { getRefundAmount } = require('../utils/refundUtils');
const { refundPayment } = require('../utils/razorpayUtils');
const { sendEmail } = require('../utils/email');

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { refund, refundType, participantId } = req.body;
    const booking = await Booking.findById(id).populate('batch');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    let refundAmount = 0;
    let paymentId = booking.paymentDetails?.paymentId;
    let refundStatus = 'not_applicable';
    let refundDate = null;

    // Cancel participant or whole booking
    if (participantId) {
      const participant = booking.participantDetails.find(p => p._id === participantId);
      if (!participant) return res.status(404).json({ message: 'Participant not found' });
      if (participant.isCancelled) return res.status(400).json({ message: 'Already cancelled' });

      participant.isCancelled = true;
      participant.cancelledAt = new Date();

      if (refund) {
        // Calculate per-participant price
        const perPrice = booking.totalPrice / booking.participantDetails.length;
        refundAmount = booking.batch ? getRefundAmount(perPrice, booking.batch.startDate, new Date(), refundType) : perPrice;
        if (refundAmount > 0 && paymentId) {
          participant.refundStatus = 'processing';
          const razorpayRes = await refundPayment(paymentId, refundAmount * 100);
          if (razorpayRes.success) {
            participant.refundStatus = 'success';
            participant.refundAmount = refundAmount;
            participant.refundDate = new Date();
          } else {
            participant.refundStatus = 'failed';
          }
        } else {
          participant.refundStatus = 'not_applicable';
        }
      }
    } else {
      // Cancel whole booking
      if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });
      booking.status = 'cancelled';
      booking.cancelledAt = new Date();

      if (refund) {
        refundAmount = booking.batch ? getRefundAmount(booking.totalPrice, booking.batch.startDate, new Date(), refundType) : booking.totalPrice;
        if (refundAmount > 0 && paymentId) {
          booking.refundStatus = 'processing';
          const razorpayRes = await refundPayment(paymentId, refundAmount * 100);
          if (razorpayRes.success) {
            booking.refundStatus = 'success';
            booking.refundAmount = refundAmount;
            booking.refundDate = new Date();
          } else {
            booking.refundStatus = 'failed';
          }
        } else {
          booking.refundStatus = 'not_applicable';
        }
      }
      
      // Mark all participants as cancelled
      booking.participantDetails.forEach(p => {
        p.isCancelled = true;
        p.cancelledAt = new Date();
      });
    }

    await booking.save();

    // Send email notification
    try {
      const emailContent = `
Dear ${booking.contactInfo?.name || 'Valued Customer'},

We regret to inform you that your booking has been cancelled as requested.

BOOKING DETAILS:
Booking ID: ${booking._id}
Trek: ${booking.trek?.name || 'N/A'}
${participantId ? 'Cancelled Participant: ' + booking.participantDetails.find(p => p._id === participantId)?.name : 'All participants cancelled'}

CANCELLATION DETAILS:
Cancellation Date: ${new Date().toLocaleDateString()}
Cancellation Time: ${new Date().toLocaleTimeString()}

REFUND INFORMATION:
${refund ? 
  (refundAmount > 0 ? 
    `✅ Refund Processed Successfully
Amount: ₹${refundAmount}
Refund Method: ${booking.paymentDetails?.method || 'Original payment method'}
Expected Credit: 5-7 business days` :
    '❌ No refund applicable (within cancellation policy)'
  ) : 
  '❌ No refund requested'
}

NEXT STEPS:
${refund && refundAmount > 0 ? 
  '• Your refund will be processed to your original payment method\n• You will receive a confirmation email once the refund is completed\n• Please allow 5-7 business days for the refund to appear in your account' :
  '• No further action is required from your side'
}

FUTURE BOOKINGS:
We hope to see you on another adventure soon! Feel free to browse our other exciting treks and book again when you're ready.

If you have any questions about this cancellation or would like to book another trek, please don't hesitate to contact our support team.

We appreciate your understanding.

Best regards,
The Trek Adventures Team

---
This is an automated message. Please do not reply to this email.
For support, contact us through our website or mobile app.`;

      await sendEmail({
        to: booking.contactInfo.email,
        subject: 'Booking Cancellation Confirmation',
        text: emailContent
      });
    } catch (e) {
      console.error('Error sending cancellation email:', e);
      // log email error, but don't fail the request
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 