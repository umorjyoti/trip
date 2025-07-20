const mongoose = require('mongoose');
const { sendEmail } = require('../utils/email');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Booking = require('../models/Booking');

const autoCancelPartialPayments = async () => {
  try {
    console.log('Starting auto-cancel partial payments process...');
    
    // Find bookings with partial payment that are past due date and auto-cancel is enabled
    const now = new Date();
    
    const overdueBookings = await Booking.find({
      paymentMode: 'partial',
      status: 'payment_confirmed_partial',
      'partialPaymentDetails.finalPaymentDueDate': { $lt: now },
      'partialPaymentDetails.autoCancelOnDueDate': true
    }).populate('trek').populate('user');

    console.log(`Found ${overdueBookings.length} bookings with overdue partial payments`);

    for (const booking of overdueBookings) {
      try {
        // Check if the trek has auto-cancel enabled
        const trek = await mongoose.model('Trek').findById(booking.trek._id);
        if (!trek.partialPayment.autoCancelOnDueDate) {
          console.log(`Auto-cancel disabled for trek ${trek.name}, skipping booking ${booking._id}`);
          continue;
        }

        // Cancel the booking
        booking.status = 'cancelled';
        booking.cancellationReason = 'Auto-cancelled due to non-payment of remaining balance';
        booking.cancelledAt = new Date();
        booking.cancelledBy = 'system';
        
        await booking.save();

        // Send cancellation email
        await sendEmail({
          to: booking.userDetails.email,
          subject: `Booking Cancelled - ${booking.trek.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Booking Cancelled</h2>
              <p>Dear ${booking.userDetails.name},</p>
              <p>Your booking for <strong>${booking.trek.name}</strong> has been automatically cancelled due to non-payment of the remaining balance.</p>
              
              <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <h3 style="margin-top: 0; color: #dc2626;">Booking Details:</h3>
                <p><strong>Booking ID:</strong> ${booking._id}</p>
                <p><strong>Trek:</strong> ${booking.trek.name}</p>
                <p><strong>Due Date:</strong> ${new Date(booking.partialPaymentDetails.finalPaymentDueDate).toLocaleDateString()}</p>
                <p><strong>Remaining Amount:</strong> ₹${booking.partialPaymentDetails.remainingAmount.toFixed(2)}</p>
                <p><strong>Cancellation Reason:</strong> Final payment not received by due date</p>
              </div>
              
              <p style="color: #6b7280;">
                If you believe this is an error or would like to discuss payment options, please contact our support team immediately.
              </p>
              
              <p>Best regards,<br>Trek Adventures Team</p>
            </div>
          `
        });

        console.log(`Auto-cancelled booking ${booking._id} for trek ${booking.trek.name}`);
      } catch (error) {
        console.error(`Error auto-cancelling booking ${booking._id}:`, error);
      }
    }

    console.log('Auto-cancel partial payments process completed');
  } catch (error) {
    console.error('Error in auto-cancel partial payments process:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Export the function for use in cron jobs
module.exports = { autoCancelPartialPayments };

// Run the script if called directly
if (require.main === module) {
  autoCancelPartialPayments();
} 