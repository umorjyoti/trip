
const Booking = require('../models/Booking');
const { getRefundAmount } = require('../utils/refundUtils');
const { refundPayment } = require('../utils/razorpayUtils');
const { sendCancellationEmail } = require('../utils/email');
const { updateBatchParticipantCount } = require('../utils/batchUtils');

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      cancellationType, 
      selectedParticipants, 
      refundType, 
      customRefundAmount, 
      cancellationReason, 
      totalRefund 
    } = req.body;
    
    const booking = await Booking.findById(id).populate('trek').populate('user');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    let refundAmount = totalRefund || 0;
    let paymentId = booking.paymentDetails?.paymentId;
    let refundStatus = 'not_applicable';
    let refundDate = null;
    let cancelledParticipants = [];
    
    // Get the batch from trek
    const batch = booking.trek?.batches?.find(b => b._id.toString() === booking.batch?.toString());

    if (cancellationType === 'individual' && selectedParticipants && selectedParticipants.length > 0) {
      // Cancel individual participants
      for (const participantId of selectedParticipants) {
        const participant = booking.participantDetails.find(p => p._id.toString() === participantId);
        if (!participant) continue;
        if (participant.isCancelled) continue;

        participant.isCancelled = true;
        participant.cancelledAt = new Date();
        participant.cancellationReason = cancellationReason || 'Admin cancelled';
        participant.status = 'bookingCancelled';
        cancelledParticipants.push(participantId);

        // Calculate refund for this participant
        const perPrice = booking.totalPrice / booking.participantDetails.length;
        let participantRefund = 0;
        
        if (refundType === 'custom' && customRefundAmount) {
          participantRefund = customRefundAmount / selectedParticipants.length;
        } else {
          participantRefund = batch ? getRefundAmount(perPrice, batch.startDate, new Date(), refundType) : perPrice;
        }

        if (participantRefund > 0 && paymentId) {
          participant.refundStatus = 'processing';
          const razorpayRes = await refundPayment(paymentId, participantRefund * 100);
          if (razorpayRes.success) {
            participant.refundStatus = 'success';
            participant.refundAmount = participantRefund;
            participant.refundDate = new Date();
          } else {
            participant.refundStatus = 'failed';
          }
        } else {
          participant.refundStatus = 'not_applicable';
        }
      }

      // Update batch participant count
      if (batch) {
        try {
          await updateBatchParticipantCount(booking.trek._id, booking.batch);
        } catch (error) {
          console.error('Error updating batch participant count:', error);
          // Continue with the cancellation even if count update fails
        }
      }

      // If all participants are cancelled, set booking status to cancelled
      if (booking.participantDetails.every(p => p.isCancelled)) {
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancellationReason = cancellationReason || 'Admin cancelled';
      }
    } else {
      // Cancel entire booking
      if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });
      
      booking.status = 'cancelled';
      booking.cancelledAt = new Date();
      booking.cancellationReason = cancellationReason || 'Admin cancelled';

      // Mark all participants as cancelled
      booking.participantDetails.forEach(p => {
        p.isCancelled = true;
        p.cancelledAt = new Date();
        p.cancellationReason = cancellationReason || 'Admin cancelled';
        p.status = 'bookingCancelled';
        cancelledParticipants.push(p._id);
      });

      // Process refund for entire booking
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

      // Update batch participant count
      if (batch) {
        try {
          await updateBatchParticipantCount(booking.trek._id, booking.batch);
        } catch (error) {
          console.error('Error updating batch participant count:', error);
          // Continue with the cancellation even if count update fails
        }
      }
    }

    await booking.save();

    // Send professional cancellation email
    try {
      await sendCancellationEmail(
        booking,
        booking.trek,
        booking.user || { name: booking.contactInfo?.name, email: booking.contactInfo?.email },
        cancellationType,
        cancelledParticipants,
        refundAmount,
        cancellationReason,
        refundType
      );
    } catch (e) {
      console.error('Error sending cancellation email:', e);
      // log email error, but don't fail the request
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error('Admin cancellation error:', error);
    res.status(500).json({ message: error.message });
  }
}; 