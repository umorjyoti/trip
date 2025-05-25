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
      await sendEmail({
        to: booking.contactInfo.email,
        subject: 'Booking Cancellation & Refund',
        text: `Your booking has been cancelled. Refund status: ${refund ? (refundAmount > 0 ? 'Processed' : 'No refund') : 'No refund requested'}. Amount: ₹${refundAmount}`,
      });
    } catch (e) {
      // log email error, but don't fail the request
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 