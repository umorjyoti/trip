const { Booking, Batch, Trek, User } = require("../models");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { sendEmail, sendBookingConfirmationEmail, sendEmailWithAttachment, sendBatchShiftNotificationEmail, sendBookingReminderEmail, sendProfessionalInvoiceEmail, sendCancellationEmail, sendParticipantCancellationEmails, sendRescheduleApprovalEmail, sendPartialPaymentReminderEmail, sendConfirmationEmailToAllParticipants } = require('../utils/email');
const { updateBatchParticipantCount } = require('../utils/batchUtils');
const { generateInvoicePDF } = require('../utils/invoiceGenerator');
const { getRefundAmount } = require('../utils/refundUtils');
const { refundPayment } = require('../utils/razorpayUtils');
const mongoose = require('mongoose');

// Create a custom trek booking (simplified flow)
const createCustomTrekBooking = async (req, res) => {
  try {
    const {
      trekId,
      numberOfParticipants,
      userDetails,
      totalPrice,
    } = req.body;

    // Validate required fields
    if (!trekId || !numberOfParticipants || !userDetails) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Validate user details
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      return res
        .status(400)
        .json({ message: "Please provide all user details" });
    }

    // Ensure numberOfParticipants is a number
    const participantsCount = Number(numberOfParticipants);
    if (isNaN(participantsCount) || participantsCount < 1) {
      return res.status(400).json({ message: "Invalid number of participants" });
    }

    // Find the trek and check if it exists
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ message: "Trek not found" });
    }

    // Check if trek is enabled and is a custom trek
    if (!trek.isEnabled) {
      return res
        .status(400)
        .json({ message: "This trek is currently unavailable for booking" });
    }

    if (!trek.isCustom) {
      return res
        .status(400)
        .json({ message: "This is not a custom trek" });
    }

    // Check if custom link has expired
    if (trek.customLinkExpiry && new Date() > trek.customLinkExpiry) {
      return res.status(410).json({ message: "This custom trek link has expired." });
    }

    // Find the custom batch (should be the first/only batch for custom treks)
    const customBatch = trek.batches[0];
    if (!customBatch) {
      return res.status(404).json({ message: "Custom batch not found" });
    }

    // Calculate actual current participants by querying confirmed bookings
    const confirmedBookings = await Booking.find({
      batch: customBatch._id,
      status: 'confirmed'
    });
    
    const actualCurrentParticipants = confirmedBookings.reduce((sum, booking) => {
      if (booking && booking.status === 'confirmed') {
        const activeParticipants = booking.participantDetails ? 
          booking.participantDetails.filter(p => !p.isCancelled).length : 
          booking.numberOfParticipants || 0;
        return sum + activeParticipants;
      }
      return sum;
    }, 0);
    
    console.log("Custom trek - Actual current participants:", actualCurrentParticipants);
    console.log("Custom trek - Requested participants:", participantsCount);
    console.log("Custom trek - Max participants:", customBatch.maxParticipants);
    
    // Check if batch is full using actual participant count
    if (actualCurrentParticipants + participantsCount > customBatch.maxParticipants) {
      return res
        .status(400)
        .json({ message: "Not enough spots available in this custom trek" });
    }

    // Create booking with confirmed status directly
    const booking = new Booking({
      user: req.user._id,
      trek: trekId,
      batch: customBatch._id,
      numberOfParticipants: participantsCount,
      addOns: [],
      userDetails,
      totalPrice,
      status: "confirmed", // Direct confirmation for custom treks
    });

    // Save booking
    await booking.save();

    // Update user's phone number if they don't have one
    if (req.user && (!req.user.phone || req.user.phone.trim() === '') && userDetails.phone) {
      try {
        await User.findByIdAndUpdate(req.user._id, { phone: userDetails.phone });
        console.log(`Updated phone number for user ${req.user._id} from custom trek booking input`);
      } catch (updateError) {
        console.error('Error updating user phone number:', updateError);
        // Don't fail the booking if phone update fails
      }
    }

    // Only update batch participants count if booking is confirmed/paid (not pending_payment)
    if (booking.status === 'confirmed' || booking.status === 'payment_completed' || booking.status === 'payment_confirmed_partial') {
      await updateBatchParticipantCount(trek._id, customBatch._id);
    }

    // Send confirmation email
    try {
      // If participant details are available, send to all participants
      if (booking.participantDetails && booking.participantDetails.length > 0) {
        await sendConfirmationEmailToAllParticipants(booking, trek, booking.user, booking.participantDetails, customBatch, booking.additionalRequests);
      } else {
        // Fallback: send to booking user only
        await sendEmail({
          to: booking.userDetails.email,
          subject: `Booking Confirmed - ${trek?.name || 'Bengaluru Trekkers'}`,
          text: `Dear ${booking.userDetails.name},\n\nYour booking is confirmed!\n\nBooking ID: ${booking._id}\nTrek: ${trek?.name || 'N/A'}\nAmount: ₹${booking.totalPrice}\n\nBest regards,\nTrek Adventures Team`,
        });
      }
      // Generate and send invoice for direct confirmation
      await booking.populate('trek').populate('user');
      const paymentDetails = booking.paymentDetails || {
        id: booking._id.toString(),
        amount: booking.totalPrice * 100,
        method: 'Manual/Offline',
      };
      const invoiceBuffer = await generateInvoicePDF(booking, paymentDetails);
      await sendEmailWithAttachment({
        to: booking.userDetails.email,
        subject: `Your Invoice for Booking ${booking._id}`,
        text: `Dear ${booking.userDetails.name},\n\nYour booking is confirmed! Please find your invoice attached.\n\nBooking ID: ${booking._id}\nTrek: ${trek?.name || 'N/A'}\nAmount: ₹${booking.totalPrice}\n\nBest regards,\nTrek Adventures Team`,
        attachmentBuffer: invoiceBuffer,
        attachmentFilename: `Invoice-${booking._id}.pdf`
      });
    } catch (emailError) {
      console.error('Error sending confirmation email or invoice:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      ...booking.toObject(),
      message: "Custom trek booking confirmed successfully!"
    });
  } catch (error) {
    console.error("Error creating custom trek booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const {
      trekId,
      batchId,
      numberOfParticipants,
      addOns,
      userDetails,
      totalPrice,
      sessionId, // Add session ID to track booking attempts
      couponCode, // Promo code information
      discountAmount,
      originalPrice,
      paymentMode, // 'full' or 'partial'
    } = req.body;

    // Validate required fields
    if (!trekId || !batchId || !numberOfParticipants || !userDetails) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Validate user details
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      return res
        .status(400)
        .json({ message: "Please provide all user details" });
    }

    // Ensure numberOfParticipants is a number
    const participantsCount = Number(numberOfParticipants);
    if (isNaN(participantsCount) || participantsCount < 1) {
      return res.status(400).json({ message: "Invalid number of participants" });
    }

    // Find the trek and check if it exists
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ message: "Trek not found" });
    }

    // Check if trek is enabled
    if (!trek.isEnabled) {
      return res
        .status(400)
        .json({ message: "This trek is currently unavailable for booking" });
    }

    // Find the batch
    const batch = trek.batches.id(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
    console.log("batch", batch);
    
    // Calculate actual current participants by querying confirmed bookings
    const confirmedBookings = await Booking.find({
      batch: batchId,
      status: 'confirmed'
    });
    
    const actualCurrentParticipants = confirmedBookings.reduce((sum, booking) => {
      if (booking && booking.status === 'confirmed') {
        const activeParticipants = booking.participantDetails ? 
          booking.participantDetails.filter(p => !p.isCancelled).length : 
          booking.numberOfParticipants || 0;
        return sum + activeParticipants;
      }
      return sum;
    }, 0);
    
    console.log("Actual current participants:", actualCurrentParticipants);
    console.log("Requested participants:", participantsCount);
    console.log("Max participants:", batch.maxParticipants);
    
    // Check if batch is full using actual participant count and reserved slots
    const reservedSlots = batch.reservedSlots || 0;
    const publiclyAvailableSlots = batch.maxParticipants - actualCurrentParticipants - reservedSlots;
    
    if (participantsCount > publiclyAvailableSlots) {
      return res
        .status(400)
        .json({ message: "Not enough spots available in this batch" });
    }

    // Validate partial payment configuration
    if (paymentMode === 'partial') {
      if (!trek.partialPayment.enabled) {
        return res.status(400).json({ message: "Partial payment is not enabled for this trek" });
      }
      
      // Check if booking is within final payment window
      const batchStartDate = new Date(batch.startDate);
      const daysUntilTrek = Math.ceil((batchStartDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilTrek <= trek.partialPayment.finalPaymentDueDays) {
        return res.status(400).json({ 
          message: `Partial payment is not available for bookings within ${trek.partialPayment.finalPaymentDueDays} days of the trek start date` 
        });
      }
    }

    // Check for existing pending payment booking for this user, trek, and batch
    const existingPendingBooking = await Booking.findOne({
      user: req.user._id,
      trek: trekId,
      batch: batchId,
      status: 'pending_payment',
      'bookingSession.expiresAt': { $gt: new Date() } // Only consider non-expired sessions
    });

    let booking;

    if (existingPendingBooking) {
      // Update existing booking instead of creating a new one
      booking = existingPendingBooking;
      
      // Update booking details
      booking.numberOfParticipants = participantsCount;
      booking.addOns = Array.isArray(addOns) ? addOns : [];
      booking.userDetails = userDetails;
      booking.totalPrice = totalPrice;
      booking.paymentMode = paymentMode || 'full';
      
              // Update promo code details if provided
        if (couponCode) {
          booking.promoCodeDetails = {
            promoCodeId: couponCode._id,
            code: couponCode.code,
            discountType: couponCode.discountType,
            discountValue: couponCode.discountValue,
            discountAmount: discountAmount || 0,
            originalPrice: originalPrice || totalPrice
          };
        }
      
      // Update session info
      if (sessionId) {
        booking.bookingSession.sessionId = sessionId;
        booking.bookingSession.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        booking.bookingSession.paymentAttempts += 1;
        booking.bookingSession.lastPaymentAttempt = new Date();
      }
      
      await booking.save();
      
      console.log(`Updated existing pending booking ${booking._id} for user ${req.user._id}`);
    } else {
      // Calculate partial payment details if applicable
      let partialPaymentDetails = null;
      if (paymentMode === 'partial' && trek.partialPayment.enabled) {
        const batchStartDate = new Date(batch.startDate);
        const finalPaymentDueDate = new Date(batchStartDate);
        finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() - trek.partialPayment.finalPaymentDueDays);
        
        let initialAmount = 0;
        if (trek.partialPayment.amountType === 'percentage') {
          initialAmount = Math.round((totalPrice * trek.partialPayment.amount) / 100);
        } else {
          initialAmount = trek.partialPayment.amount * participantsCount;
        }
        
        // Ensure initial amount doesn't exceed total price
        initialAmount = Math.min(initialAmount, totalPrice);
        
        // Validate frontend-supplied value if present (security)
        if (req.body.paymentMode === 'partial' && req.body.frontendInitialAmount !== undefined) {
          if (Number(req.body.frontendInitialAmount) !== initialAmount) {
            console.error('[SECURITY] Partial payment amount mismatch:', {
              user: req.user?._id,
              trekId,
              batchId,
              attempted: req.body.frontendInitialAmount,
              expected: initialAmount,
              numberOfParticipants: participantsCount,
              time: new Date().toISOString(),
            });
            return res.status(400).json({ message: 'Partial payment amount mismatch. Please refresh and try again.' });
          }
        }
        
        partialPaymentDetails = {
          initialAmount,
          remainingAmount: totalPrice - initialAmount,
          finalPaymentDueDate,
          reminderSent: false
        };
      }

      // Create new booking
      booking = new Booking({
        user: req.user._id,
        trek: trekId,
        batch: batchId,
        numberOfParticipants: participantsCount,
        addOns: Array.isArray(addOns) ? addOns : [],
        userDetails,
        totalPrice,
        status: "pending_payment",
        paymentMode: paymentMode || 'full',
        partialPaymentDetails,
        promoCodeDetails: couponCode ? {
          promoCodeId: couponCode._id,
          code: couponCode.code,
          discountType: couponCode.discountType,
          discountValue: couponCode.discountValue,
          discountAmount: discountAmount || 0,
          originalPrice: originalPrice || totalPrice
        } : undefined,
        bookingSession: {
          sessionId: sessionId || `session_${Date.now()}_${req.user._id}`,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          paymentAttempts: 1,
          lastPaymentAttempt: new Date()
        }
      });

          // Save booking
    await booking.save();

    // Update user's phone number if they don't have one
    if (req.user && (!req.user.phone || req.user.phone.trim() === '') && userDetails.phone) {
      try {
        await User.findByIdAndUpdate(req.user._id, { phone: userDetails.phone });
        console.log(`Updated phone number for user ${req.user._id} from booking input`);
      } catch (updateError) {
        console.error('Error updating user phone number:', updateError);
        // Don't fail the booking if phone update fails
      }
    }

    // Only update batch participants count if booking is confirmed/paid (not pending_payment)
    if (booking.status === 'confirmed' || booking.status === 'payment_completed' || booking.status === 'payment_confirmed_partial') {
      await updateBatchParticipantCount(trek._id, batch._id);
    }

      console.log(`Created new booking ${booking._id} for user ${req.user._id}`);
    }

    // Generate and send invoice for pending payment
    try {
      await booking.populate('trek').populate('user');
      const paymentDetails = booking.paymentDetails || {
        id: booking._id.toString(),
        amount: booking.totalPrice * 100,
        method: 'Pending',
      };
      const invoiceBuffer = await generateInvoicePDF(booking, paymentDetails);
      await sendEmailWithAttachment({
        to: booking.userDetails.email,
        subject: `Your Invoice for Booking ${booking._id}`,
        text: `Dear ${booking.userDetails.name},\n\nThank you for your booking! Please find your invoice attached.\n\nBooking ID: ${booking._id}\nTrek: ${trek?.name || 'N/A'}\nAmount: ₹${booking.totalPrice}\n\nBest regards,\nTrek Adventures Team`,
        attachmentBuffer: invoiceBuffer,
        attachmentFilename: `Invoice-${booking._id}.pdf`
      });
    } catch (invoiceError) {
      console.error('Error generating or sending invoice after booking creation:', invoiceError);
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's bookings
const getUserBookings = async (req, res) => {  
  try {
    console.log("Getting bookings for user:", req.user._id);

    const bookings = await Booking.find({ 
      user: req.user._id,
      status: { $ne: 'pending_payment' } // Exclude pending_payment bookings
    })
      .populate({
        path: "trek",
        select: "name imageUrl batches", // include batches for manual extraction
      })
      .sort({ createdAt: -1 });

    // Now manually extract the batch info from the trek.batches
    const enrichedBookings = bookings.map((booking) => {
      const batchId = booking.batch?.toString();
      const trek = booking.trek;

      let selectedBatch = null;
      if (trek && trek.batches && batchId) {
        selectedBatch = trek.batches.find((b) => b._id.toString() === batchId);
      }

      // Convert to plain object if it's a Mongoose document
      const bookingObj = booking.toObject ? booking.toObject() : booking;

      return {
        ...bookingObj,
        user: booking.user && typeof booking.user === 'object' ? {
          _id: booking.user._id,
          name: booking.user.name,
          email: booking.user.email,
          phone: booking.user.phone // Ensure phone is included
        } : booking.user,
        batch: selectedBatch, // replace batch with the enriched batch object
        trek: {
          _id: trek?._id,
          name: trek?.name,
          imageUrl: trek?.imageUrl,
        },
      };
    });

    console.log(`Found ${bookings.length} bookings for user`);

    // Format the response data
    const formattedBookings = enrichedBookings.map((booking) => {
      if (booking.batch) {
        return {
          ...booking,
          startDate: booking.batch.startDate,
          endDate: booking.batch.endDate,
          batchPrice: booking.batch.price,
          maxParticipants: booking.batch.maxParticipants,
          currentParticipants: booking.batch.currentParticipants,
          batchStatus: booking.batch.status,
        };
      }
      return booking;
    });

    console.log("Formatted bookings:", formattedBookings);
    res.json(formattedBookings);
  } catch (error) {
    console.error("Error getting user bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("trek", "name imageUrl batches")
      .populate("batch");

    console.log("booking", booking.batch);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if the booking belongs to the logged-in user or user is admin
    console.log("Backend authorization check:", {
      bookingUserId: booking.user._id,
      bookingUserType: typeof booking.user._id,
      reqUserId: req.user._id,
      reqUserType: typeof req.user._id,
      bookingUserString: booking.user.toString(),
      reqUserString: req.user._id.toString(),
      isAdmin: req.user.isAdmin,
      role: req.user.role
    });
    
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      booking.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin &&
      req.user.role !== "admin"
    ) {
      console.log("Authorization failed - user not authorized");
      return res
        .status(403)
        .json({ message: "Not authorized to view this booking" });
    }
    
    console.log("Authorization successful - user authorized");

    let batchData = null;
    let trekInfo = booking.trek || null;

    if (trekInfo && Array.isArray(trekInfo.batches) && booking.batch) {
      batchData = trekInfo.batches.find(
        batch => batch && batch._id && booking.batch &&
          batch._id.toString() === booking.batch.toString()
      );
    }

    // Debug logs
    console.log("booking.trek._id", trekInfo && trekInfo._id, typeof (trekInfo && trekInfo._id));
    console.log("booking.batch", booking.batch, typeof booking.batch);
    console.log("batches", trekInfo && trekInfo.batches && trekInfo.batches.map(b => ({ id: b._id, type: typeof b._id })));

    if (!batchData) {
      return res.status(404).json({ message: "Batch not found in trek.batches" });
    }

    const activeParticipants = booking.participantDetails.filter(p => !p.isCancelled);
    const activeParticipantCount = activeParticipants.length;

    // Debug log for cancellation request
    console.log("Cancellation request data:", booking.cancellationRequest);

    // Format the response data
    const responseData = {
      _id: booking._id,
      user: booking.user,
      trek: trekInfo
        ? {
            _id: trekInfo._id,
            name: trekInfo.name,
            imageUrl: trekInfo.imageUrl,
            batches: trekInfo.batches || []
          }
        : null,
      batch: batchData,
      startDate: batchData ? batchData.startDate : null,
      endDate: batchData ? batchData.endDate : null,
      participants: booking.numberOfParticipants,
      participantDetails: booking.participantDetails,
      totalPrice: booking.totalPrice,
      status: booking.status,
      createdAt: booking.createdAt,
      cancelledAt: booking.cancelledAt,
      userDetails: booking.userDetails,
      addOns: booking.addOns,
      activeParticipants,
      activeParticipantCount,
      cancellationRequest: booking.cancellationRequest || null,
      refundStatus: booking.refundStatus,
      refundAmount: booking.refundAmount,
      refundDate: booking.refundDate,
      refundType: booking.refundType,
      paymentMode: booking.paymentMode || 'full',
      partialPaymentDetails: booking.partialPaymentDetails || null
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error getting booking by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const { reason, refundType } = req.body;
    const booking = await Booking.findById(req.params.id).populate('trek');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      booking.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking already cancelled' });
    }
    const trek = booking.trek;
    const batch = trek?.batches?.find(b => b._id.toString() === booking.batch?.toString());
    const now = new Date();
    if (batch && batch.startDate && new Date(batch.startDate) <= now) {
      return res.status(400).json({ message: 'Cannot cancel booking after trek has started' });
    }
    // Refund logic for all participants
    let totalRefund = 0;
    let paymentId = booking.paymentDetails?.paymentId;
    let refundStatus = 'not_applicable';
    let refundDate = null;
    booking.cancellationReason = reason || '';
    booking.cancelledAt = new Date();
    booking.participantDetails.forEach(p => {
      if (!p.isCancelled) {
        p.isCancelled = true;
        p.cancelledAt = new Date();
        p.cancellationReason = reason || '';
        // Per-participant refund
        const perPrice = booking.totalPrice / booking.participantDetails.length;
        let refundAmount = batch ? getRefundAmount(perPrice, batch.startDate, now, refundType || 'auto') : perPrice;
        p.refundAmount = refundAmount;
        p.refundStatus = 'not_applicable';
        p.refundDate = null;
        totalRefund += refundAmount;
      }
    });
    if ((booking.status === 'payment_completed' || booking.status === 'confirmed') && totalRefund > 0 && paymentId) {
      refundStatus = 'processing';
      const razorpayRes = await refundPayment(paymentId, totalRefund * 100);
      if (razorpayRes.success) {
        refundStatus = 'success';
        refundDate = new Date();
        booking.participantDetails.forEach(p => {
          p.refundStatus = 'success';
          p.refundDate = refundDate;
          p.refundType = refundType || 'auto';
        });
      } else {
        refundStatus = 'failed';
        booking.participantDetails.forEach(p => {
          p.refundStatus = 'failed';
          p.refundType = refundType || 'auto';
        });
      }
    }
    booking.status = "cancelled";
    booking.refundStatus = refundStatus;
    booking.refundAmount = totalRefund;
    booking.refundDate = refundDate;
    booking.refundType = refundType || 'auto';
    if (batch) {
      try {
        await updateBatchParticipantCount(booking.trek, booking.batch);
      } catch (error) {
        console.error('Error updating batch participant count:', error);
        // Continue with the cancellation even if count update fails
      }
    }
    await booking.save();
    try {
      // Use the professional cancellation email template
      await sendCancellationEmail(
        booking,
        trek,
        booking.user || { name: booking.userDetails?.name, email: booking.userDetails?.email },
        'entire', // This is for entire booking cancellation
        booking.participantDetails.map(p => p._id), // All participants cancelled
        totalRefund,
        reason,
        'auto' // Default to auto-calculated refund
      );
    } catch (emailError) {
      console.error('Error sending cancellation/refund email:', emailError);
    }

    // Send cancellation emails to participants
    try {
      // Get all cancelled participant objects
      const cancelledParticipantObjects = booking.participantDetails.filter(p => p.isCancelled);
      
      if (cancelledParticipantObjects.length > 0) {
        await sendParticipantCancellationEmails(
          booking,
          trek,
          cancelledParticipantObjects,
          reason || 'Booking cancelled'
        );
      }
    } catch (emailError) {
      console.error('Error sending participant cancellation emails:', emailError);
    }
    res.json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all bookings (admin only)
const getBookings = async (req, res) => {
 
  try {
    console.log("User requesting all bookings:", {
      id: req.user._id,
      role: req.user.role,
      isAdmin: req.user.isAdmin,
    });

    // Additional check for admin status
    if (!req.user.isAdmin && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as an admin" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filterQuery = {};

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      // If status is pending_payment, return empty result
      if (req.query.status === 'pending_payment') {
        return res.json({
          bookings: [],
          pagination: {
            total: 0,
            page,
            pages: 0,
            limit
          },
          stats: {
            totalRevenue: 0,
            totalBookings: 0,
            confirmedBookings: 0,
            cancelledBookings: 0,
            averageBookingValue: 0,
            todayParticipantsCount: 0
          }
        });
      }
      filterQuery.status = req.query.status;
    } else {
      // Exclude pending_payment bookings from all queries if no specific status is requested
      filterQuery.status = { $ne: 'pending_payment' };
    }

    // Trek filter
    if (req.query.trekId) {
      filterQuery.trek = req.query.trekId;
    }

    // Batch filter
    if (req.query.batchId) {
      filterQuery.batch = req.query.batchId;
    }

    // Date range filters
    if (req.query.startDate || req.query.endDate) {
      filterQuery.createdAt = {};
      if (req.query.startDate) {
        filterQuery.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filterQuery.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Enhanced search logic for trek name
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      const searchTerm = req.query.search;
      let trekIds = [];
      // Find trek IDs matching the search
      const treks = await require('../models/Trek').find({ name: searchRegex }, '_id');
      if (treks && treks.length > 0) {
        trekIds = treks.map(t => t._id);
      }
      const orFilters = [
        { 'userDetails.name': searchRegex },
        { 'userDetails.email': searchRegex },
        // Partial match for status
        { status: { $regex: searchRegex } },
        // Partial match for booking ID (ObjectId as string)
        { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: req.query.search, options: 'i' } } },
        // Partial match for trek ID (ObjectId as string)
        { $expr: { $regexMatch: { input: { $toString: '$trek' }, regex: req.query.search, options: 'i' } } }
      ];
      // Add trek ID matches from trek name search
      if (trekIds.length > 0) {
        orFilters.push({ trek: { $in: trekIds } });
      }
      filterQuery.$or = orFilters;
    }

    console.log("Filter query:", filterQuery);

    // Calculate today's date range (00:01 to 24:00)
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 1, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const [bookings, total, stats, todayStats] = await Promise.all([
      Booking.find(filterQuery)
        .populate("user", "name email phone") // Add phone to populated fields
        .populate("trek", "name batches")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filterQuery),
      Booking.aggregate([
        { $match: filterQuery },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            totalBookings: { $sum: 1 },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] }
            },
            cancelledBookings: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalRevenue: { $round: ["$totalRevenue", 2] },
            totalBookings: 1,
            confirmedBookings: 1,
            cancelledBookings: 1,
            averageBookingValue: {
              $round: [
                { $cond: [{ $eq: ["$totalBookings", 0] }, 0, { $divide: ["$totalRevenue", "$totalBookings"] }] },
                2
              ]
            }
          }
        }
      ]),
      // Get today's bookings for participant count
      Booking.find({
        createdAt: { $gte: todayStart, $lte: todayEnd }
      }).select('numberOfParticipants participantDetails status')
    ]);

    // Extract batch information from trek.batches for each booking
    const enrichedBookings = bookings.map((booking) => {
      const batchId = booking.batch?.toString();
      const trek = booking.trek;

      let selectedBatch = null;
      if (trek && trek.batches && batchId) {
        selectedBatch = trek.batches.find((b) => b._id.toString() === batchId);
      }

      // Convert to plain object if it's a Mongoose document
      const bookingObj = booking.toObject ? booking.toObject() : booking;

      return {
        ...bookingObj,
        user: booking.user && typeof booking.user === 'object' ? {
          _id: booking.user._id,
          name: booking.user.name,
          email: booking.user.email,
          phone: booking.user.phone // Ensure phone is included
        } : booking.user,
        batch: selectedBatch, // replace batch with the enriched batch object
        trek: {
          _id: trek?._id,
          name: trek?.name,
          batches: trek?.batches,
        },
      };
    });

    // Calculate today's participants count
    const todayParticipantsCount = todayStats.reduce((sum, booking) => {
      if (booking.status === 'confirmed' || booking.status === 'payment_confirmed_partial' || booking.status === 'payment_completed') {
        if (booking.status === 'confirmed') {
          // For confirmed bookings, check participantDetails and count non-cancelled participants
          if (booking.participantDetails && Array.isArray(booking.participantDetails)) {
            const activeParticipants = booking.participantDetails.filter(p => !p.isCancelled).length;
            return sum + activeParticipants;
          } else {
            // Fallback to numberOfParticipants if no participantDetails
            return sum + (booking.numberOfParticipants || 0);
          }
        } else {
          // For payment_confirmed_partial and payment_completed, use numberOfParticipants
          // as participant details won't be filled yet
          return sum + (booking.numberOfParticipants || 0);
        }
      }
      return sum;
    }, 0);

    // Extract stats from aggregation result
    const statsData = stats.length > 0 ? stats[0] : {
      totalRevenue: 0,
      totalBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      averageBookingValue: 0
    };

    // Add today's participants count to stats
    statsData.todayParticipantsCount = todayParticipantsCount;

    res.json({
      bookings: enrichedBookings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      stats: statsData
    });
  } catch (error) {
    console.error("Error getting all bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update booking status (admin only)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "pending_payment", "payment_completed", "confirmed", "trek_completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Check if user is authorized (admin only)
    if (!req.user.isAdmin && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update booking status" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update status
    booking.status = status;
    await booking.save();

    // If status is confirmed, generate and send invoice
    if (status === 'confirmed') {
      try {
        // Populate trek and user for invoice
        await booking.populate('trek').populate('user');
        // Use booking.totalPrice as payment amount, and mark as 'Manual/Offline' if no paymentDetails
        const paymentDetails = booking.paymentDetails || {
          id: booking._id.toString(),
          amount: booking.totalPrice * 100, // in paise for consistency
        };
        const invoiceBuffer = await generateInvoicePDF(booking, paymentDetails);
        await sendEmailWithAttachment({
          to: booking.user.email,
          subject: `Your Invoice for Booking ${booking._id}`,
          text: `Dear ${booking.user.name},\n\nYour booking is confirmed! Please find your invoice attached.\n\nBooking ID: ${booking._id}\nTrek: ${booking.trek?.name || 'N/A'}\nAmount: ₹${booking.totalPrice}\n\nBest regards,\nTrek Adventures Team`,
          attachmentBuffer: invoiceBuffer,
          attachmentFilename: `Invoice-${booking._id}.pdf`
        });
      } catch (invoiceError) {
        console.error('Error generating or sending invoice after confirmation:', invoiceError);
      }
    }

    // If status transitions to confirmed/paid, update batch participant count
    if (['confirmed', 'payment_completed', 'payment_confirmed_partial'].includes(status)) {
      await updateBatchParticipantCount(booking.trek, booking.batch);
    }

    res.json(booking);
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete booking (admin only)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Delete booking
    await booking.remove();

    res.json({ message: "Booking removed" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Restore booking
const restoreBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only admin can restore bookings
    if (!req.user.isAdmin) {
      return res.status(401).json({ message: "Not authorized" });
    }

    booking.status = "confirmed";
    await booking.save();

    res.json({ message: "Booking restored successfully", booking });
  } catch (error) {
    console.error("Error restoring booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel a participant from a booking
const cancelParticipant = async (req, res) => {
  try {
    const { id, participantId } = req.params;
    const { reason, refundType, refundAmount: customRefundAmount } = req.body;
    const booking = await Booking.findById(id).populate('trek');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      booking.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const participant = booking.participantDetails.find(
      (p) => p._id && p._id.toString() === participantId.toString()
    );
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    if (participant.isCancelled) {
      return res.status(400).json({ message: "Participant is already cancelled" });
    }
    const trek = booking.trek;
    const batch = trek?.batches?.find(b => b._id.toString() === booking.batch?.toString());
    const now = new Date();
    if (batch && batch.startDate && new Date(batch.startDate) <= now) {
      return res.status(400).json({ message: 'Cannot cancel participant after trek has started' });
    }
    // Refund logic
    let refundAmount = 0;
    let paymentId = booking.paymentDetails?.paymentId;
    let refundStatus = 'not_applicable';
    let refundDate = null;
    const perPrice = booking.totalPrice / booking.participantDetails.length;
    let effectiveRefundType = refundType || 'auto';
    if (!req.user.isAdmin) effectiveRefundType = 'auto';
    if (effectiveRefundType === 'custom' && req.user.isAdmin && typeof customRefundAmount === 'number') {
      refundAmount = customRefundAmount;
    } else {
      refundAmount = batch ? getRefundAmount(perPrice, batch.startDate, now, effectiveRefundType) : perPrice;
    }
    if ((booking.status === 'payment_completed' || booking.status === 'confirmed') && refundAmount > 0 && paymentId) {
      refundStatus = 'processing';
      const razorpayRes = await refundPayment(paymentId, refundAmount * 100);
      if (razorpayRes.success) {
        refundStatus = 'success';
        refundDate = new Date();
        booking.participantDetails.forEach(p => {
          p.refundStatus = 'success';
          p.refundDate = refundDate;
          p.refundType = refundType || 'auto';
        });
      } else {
        refundStatus = 'failed';
        booking.participantDetails.forEach(p => {
          p.refundStatus = 'failed';
          p.refundType = refundType || 'auto';
        });
      }
    }
    participant.isCancelled = true;
    participant.cancelledAt = new Date();
    participant.cancellationReason = reason || '';
    participant.refundStatus = refundStatus;
    participant.refundAmount = refundAmount;
    participant.refundDate = refundDate;
    participant.refundType = effectiveRefundType;
    participant.status = 'bookingCancelled';
    if (batch) {
      booking.totalPrice = Math.max(0, booking.totalPrice - perPrice);
      try {
        await updateBatchParticipantCount(booking.trek, booking.batch);
      } catch (error) {
        console.error('Error updating batch participant count:', error);
        // Continue with the cancellation even if count update fails
      }
    }
    await booking.save();
    // If all participants are cancelled, set booking.status = 'cancelled'
    if (booking.participantDetails.every(p => p.isCancelled)) {
      booking.status = 'cancelled';
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason || '';
      await booking.save();
    }
    try {
      // Use the professional cancellation email template for participant cancellation
      await sendCancellationEmail(
        booking,
        trek,
        booking.user || { name: booking.userDetails?.name, email: booking.userDetails?.email },
        'individual', // This is for individual participant cancellation
        [participantId], // Only the cancelled participant
        refundAmount,
        reason,
        'auto' // Default to auto-calculated refund
      );
    } catch (emailError) {
      console.error('Error sending participant cancellation/refund email:', emailError);
    }

    // Send cancellation email to the specific cancelled participant
    try {
      const cancelledParticipant = booking.participantDetails.find(p => 
        p._id.toString() === participantId || p._id.toString() === participantId.toString()
      );
      if (cancelledParticipant && cancelledParticipant.email) {
        await sendParticipantCancellationEmails(
          booking,
          trek,
          [cancelledParticipant],
          reason || 'Participant cancelled'
        );
      }
    } catch (emailError) {
      console.error('Error sending participant cancellation email:', emailError);
    }


    res.json({ message: "Participant cancelled successfully", booking });
  } catch (error) {
    console.error("Error cancelling participant:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Restore a cancelled participant
const restoreParticipant = async (req, res) => {
  try {
    const { id, participantId } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is authorized (either admin or the booking owner)
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      booking.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Find the participant
    const participant = booking.participantDetails.find(
      (p) => p._id && p._id.toString() === participantId.toString()
    );

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    if (!participant.isCancelled) {
      return res.status(400).json({ message: "Participant is not cancelled" });
    }

    // Mark participant as restored
    participant.isCancelled = false;
    participant.cancelledAt = null;
    participant.status = 'confirmed';

    // Update the total price by adding the price for this participant
    const batch = await Trek.findById(booking.trek).then((trek) =>
      trek.batches.id(booking.batch)
    );

    if (batch) {
      booking.totalPrice += batch.price;
    }

    await booking.save();

    res.json({ message: "Participant restored successfully", booking });
  } catch (error) {
    console.error("Error restoring participant:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update booking details
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      participants, 
      participantDetails, 
      totalPrice, 
      specialRequirements, 
      batch,
      numberOfParticipants,
      userDetails,
      addOns,
      status
    } = req.body;

    console.log('updateBooking called for booking:', id);
    console.log('Request body:', { participants, participantDetails, status });

    const booking = await Booking.findById(id)
      .populate('trek')
      .populate('user', 'name email');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log('Booking found in updateBooking:', {
      id: booking._id,
      status: booking.status,
      user: booking.user?.email,
      trek: booking.trek?.name
    });

    // Check if the booking belongs to the logged-in user
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      booking.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    // Track if participant details are being updated
    const isUpdatingParticipantDetails = participantDetails !== undefined && Array.isArray(participantDetails) && participantDetails.length > 0;

    console.log('isUpdatingParticipantDetails:', isUpdatingParticipantDetails);
    console.log('booking.status:', booking.status);

    // Update booking details
    if (participants !== undefined) {
      booking.numberOfParticipants = participants;
    }
    
    if (numberOfParticipants !== undefined) {
      booking.numberOfParticipants = numberOfParticipants;
    }

    if (participantDetails !== undefined) {
      booking.participantDetails = participantDetails;
    }

    if (totalPrice !== undefined) {
      booking.totalPrice = totalPrice;
    }

    if (specialRequirements !== undefined) {
      booking.specialRequirements = specialRequirements;
    }

    if (batch !== undefined) {
      booking.batch = batch;
    }

    if (userDetails !== undefined) {
      booking.userDetails = userDetails;
    }

    if (addOns !== undefined) {
      booking.addOns = addOns;
    }

    if (status !== undefined) {
      // For partial payments, ensure status logic is respected
      if (booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
        if (booking.partialPaymentDetails.remainingAmount > 0) {
          // If there's still remaining amount, force status to payment_confirmed_partial
          booking.status = 'payment_confirmed_partial';
        } else {
          // If no remaining amount, allow the status to be set
          booking.status = status;
        }
      } else {
        // For full payments, allow status to be set normally
        booking.status = status;
      }
    }

    await booking.save();

    // If status transitions to confirmed/paid, update batch participant count
    if (['confirmed', 'payment_completed', 'payment_confirmed_partial'].includes(booking.status)) {
      await updateBatchParticipantCount(booking.trek._id, booking.batch);
    }

    // Send booking confirmation email if participant details are being updated
    if (isUpdatingParticipantDetails && booking.status === 'confirmed') {
      console.log('Sending booking confirmation email from updateBooking');
      try {
        const trek = booking.trek;
        const user = booking.user;
        const batch = trek?.batches?.find(b => b._id.toString() === booking.batch?.toString());
        
        // Get additional requests from booking if available
        const additionalRequests = booking.additionalRequests || 'None';

        await sendBookingConfirmationEmail(booking, trek, user, participantDetails, batch, additionalRequests);
        console.log('Booking confirmation email sent successfully from updateBooking');
      } catch (emailError) {
        console.error('Error sending booking confirmation email:', emailError);
        // Don't fail the booking update if email fails
      }
    } else {
      console.log('Not sending booking confirmation email. isUpdatingParticipantDetails:', isUpdatingParticipantDetails, 'booking.status:', booking.status);
    }

    // Return the updated booking with populated fields
    const updatedBooking = await Booking.findById(id)
      .populate("user", "name email")
      .populate("trek", "name imageUrl batches");

    // Extract batch data from trek.batches array
    let batchData = null;
    if (updatedBooking.trek && updatedBooking.trek.batches && updatedBooking.batch) {
      batchData = updatedBooking.trek.batches.find(
        batch => batch._id.toString() === updatedBooking.batch.toString()
      );
    }

    // Format the response
    const responseData = {
      ...updatedBooking.toObject(),
      trek: {
        _id: updatedBooking.trek._id,
        name: updatedBooking.trek.name,
        imageUrl: updatedBooking.trek.imageUrl
      },
      batch: batchData,
      participants: updatedBooking.numberOfParticipants
    };

    res.json({ 
      message: "Booking updated successfully", 
      booking: responseData 
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Export bookings
const exportBookings = async (req, res) => {
  try {
    const { fields, fileType, status, trekId, batchId, startDate, endDate } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (trekId) query.trek = trekId;
    if (batchId) query.batch = batchId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get bookings with populated fields
    const bookings = await Booking.find(query)
      .populate('trek', 'name')
      .populate('batch', 'startDate endDate')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    console.log('Found bookings:', bookings.length); // Debug log

    // Format data based on selected fields
    const selectedFields = fields ? fields.split(',') : [
      'bookingId',
      'trekName',
      'batchDate',
      'userName',
      'userEmail',
      'userPhone',
      'participants',
      'totalPrice',
      'status',
      'createdAt',
      'paymentStatus'
    ];

    console.log('Selected fields:', selectedFields); // Debug log

    const formattedData = bookings.map(booking => {
      const data = {};
      selectedFields.forEach(field => {
        switch(field) {
          case 'bookingId':
            data['Booking ID'] = booking._id.toString();
            break;
          case 'trekName':
            data['Trek Name'] = booking.trek?.name || 'N/A';
            break;
          case 'batchDate':
            data['Batch Date'] = booking.batch 
              ? `${new Date(booking.batch.startDate).toLocaleDateString()} - ${new Date(booking.batch.endDate).toLocaleDateString()}`
              : 'N/A';
            break;
          case 'userName':
            data['User Name'] = booking.user?.name || 'N/A';
            break;
          case 'userEmail':
            data['User Email'] = booking.user?.email || 'N/A';
            break;
          case 'userPhone':
            data['User Phone'] = booking.user?.phone || 'N/A';
            break;
          case 'participants':
            data['Participants'] = booking.participants?.toString() || '0';
            break;
          case 'totalPrice':
            data['Total Price'] = booking.totalPrice?.toString() || '0';
            break;
          case 'status':
            data['Status'] = booking.status || 'N/A';
            break;
          case 'createdAt':
            data['Booking Date'] = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A';
            break;
          case 'paymentStatus':
            data['Payment Status'] = booking.paymentStatus || 'N/A';
            break;
          case 'notes':
            data['Notes'] = booking.notes || 'N/A';
            break;
        }
      });
      return data;
    });

    console.log('Formatted data:', formattedData.length); // Debug log

    if (fileType === 'excel') {
      // Excel export code remains the same
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Bookings');
      
      const headers = Object.keys(formattedData[0] || {});
      worksheet.addRow(headers);
      
      formattedData.forEach(row => {
        worksheet.addRow(Object.values(row));
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=bookings.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else if (fileType === 'pdf') {
      const doc = new PDFDocument({ 
        size: 'A3', 
        layout: 'landscape',
        margin: 30
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=bookings.pdf');
      
      doc.pipe(res);

      // Add title and date
      doc.fontSize(24).text('Bookings Export', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown();

      if (formattedData.length === 0) {
        doc.fontSize(14).text('No bookings found matching the selected criteria.', { align: 'center' });
      } else {
        const headers = Object.keys(formattedData[0]);
        const startY = doc.y + 10;
        const rowHeight = 30;
        const columnWidth = (doc.page.width - 60) / headers.length;

        // Draw table header
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, i) => {
          const x = 30 + (i * columnWidth);
          doc.rect(x, startY, columnWidth, rowHeight).stroke();
          doc.text(header, x + 5, startY + 10, {
            width: columnWidth - 10,
            align: 'left'
          });
        });

        // Draw table rows
        doc.font('Helvetica').fontSize(10);
        formattedData.forEach((row, rowIndex) => {
          const y = startY + (rowHeight * (rowIndex + 1));
          
          // Add new page if needed
          if (y + rowHeight > doc.page.height - 30) {
            doc.addPage();
            return; // Skip to next iteration
          }

          // Draw row
          headers.forEach((header, i) => {
            const x = 30 + (i * columnWidth);
            doc.rect(x, y, columnWidth, rowHeight).stroke();
            const cellValue = row[header]?.toString() || '';
            doc.text(cellValue, x + 5, y + 10, {
              width: columnWidth - 10,
              align: 'left'
            });
          });
        });
      }
      
      doc.end();
    } else {
      res.status(400).json({ message: 'Invalid file type' });
    }
  } catch (error) {
    console.error('Error exporting bookings:', error);
    res.status(500).json({ message: 'Error exporting bookings', error: error.message });
  }
};

// Update participant details after payment
const updateParticipantDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { participants, emergencyContact, additionalRequests } = req.body;

    console.log('updateParticipantDetails called for booking:', id);
    console.log('Request body:', { participants, additionalRequests, emergencyContact });

    const booking = await Booking.findById(id)
      .populate('trek')
      .populate('user', 'name email');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log('Booking found:', {
      id: booking._id,
      status: booking.status,
      user: booking.user?.email,
      trek: booking.trek?.name
    });

    // Check if the booking belongs to the logged-in user
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      booking.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    // Validate number of participants
    if (participants.length !== booking.numberOfParticipants) {
      return res.status(400).json({ 
        message: "Number of participants does not match the booking" 
      });
    }

    // Validate emergency contact
    if (!emergencyContact || !emergencyContact.name || !emergencyContact.phone || !emergencyContact.relation) {
      return res.status(400).json({ 
        message: "Emergency contact information is required (name, phone, relation)" 
      });
    }

    // Validate and format participant data
    const formattedParticipants = participants.map((participant, index) => {
      // Validate required fields
      if (!participant.name || !participant.email || !participant.phone) {
        throw new Error(`Participant ${index + 1} is missing required fields (name, email, phone)`);
      }



      // Format the participant data
      return {
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        age: participant.age ? Number(participant.age) : null,
        gender: participant.gender,
        allergies: participant.allergies || '',
        extraComment: participant.extraComment || '',

        customFields: participant.customFields || {},
        medicalConditions: participant.medicalConditions || '',
        specialRequests: participant.specialRequests || ''
      };
    });

    // Update booking with participant details and emergency contact
    booking.participantDetails = formattedParticipants;
    booking.emergencyContact = {
      name: emergencyContact.name,
      phone: emergencyContact.phone,
      relation: emergencyContact.relation
    };

    booking.additionalRequests = additionalRequests || '';
    
    // Update status based on payment type
    if (booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
      // For partial payments, keep status as payment_confirmed_partial until full payment is complete
      if (booking.partialPaymentDetails.remainingAmount > 0) {
        booking.status = 'payment_confirmed_partial';
      } else {
        // If remaining amount is 0, then it's fully paid and can be confirmed
        booking.status = 'confirmed';
      }
    } else {
      // For full payments, update status to confirmed after collecting details
      booking.status = 'confirmed';
    }

    await booking.save();

    // If status transitions to confirmed/paid, update batch participant count
    if (['confirmed', 'payment_completed', 'payment_confirmed_partial'].includes(booking.status)) {
      await updateBatchParticipantCount(booking.trek._id, booking.batch);
    }

    console.log('Booking updated successfully, status:', booking.status);

    // Send booking confirmation email to all participants only if booking is fully confirmed
    if (booking.status === 'confirmed') {
      try {
        const trek = booking.trek;
        const user = booking.user;
        const batch = trek?.batches?.find(b => b._id.toString() === booking.batch?.toString());
        
        console.log('Sending booking confirmation email to all participants');

        await sendConfirmationEmailToAllParticipants(booking, trek, user, formattedParticipants, batch, additionalRequests);
        
        console.log('Booking confirmation emails sent successfully to all participants');
      } catch (emailError) {
        console.error('Error sending booking confirmation emails to all participants:', emailError);
        // Don't fail the participant details update if email fails
      }
    } else {
      console.log('Not sending booking confirmation email. Booking status:', booking.status);
    }

    res.json({ 
      message: "Participant details updated successfully",
      booking 
    });
  } catch (error) {
    console.error("Error updating participant details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark trek as completed
const markTrekCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is authorized (admin only)
    if (!req.user.isAdmin && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to mark trek as completed" });
    }

    // Only confirmed bookings can be marked as completed
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        message: "Only confirmed bookings can be marked as trek completed" 
      });
    }

    booking.status = 'trek_completed';
    await booking.save();

    res.json({ 
      message: "Trek marked as completed successfully",
      booking 
    });
  } catch (error) {
    console.error("Error marking trek as completed:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update admin remarks for a booking
const updateAdminRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    // Check if user is admin
    if (!req.user.isAdmin && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can update remarks" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update admin remarks
    booking.adminRemarks = adminRemarks || '';
    await booking.save();

    res.json({ 
      message: "Admin remarks updated successfully",
      booking: {
        _id: booking._id,
        adminRemarks: booking.adminRemarks
      }
    });
  } catch (error) {
    console.error("Error updating admin remarks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Download invoice for a booking
const downloadInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('trek')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has permission to download this invoice
    if (!req.user.isAdmin && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to download this invoice' });
    }

    // Create payment details object for invoice generation
    const paymentDetails = booking.paymentDetails || {
      id: booking._id.toString(),
      amount: booking.totalPrice * 100, // Convert to paise for consistency
      method: booking.paymentDetails?.method || 'Manual/Offline'
    };

    // Generate invoice PDF
    const invoiceBuffer = await generateInvoicePDF(booking, paymentDetails);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${booking._id}.pdf`);
    res.setHeader('Content-Length', invoiceBuffer.length);

    // Send the PDF buffer
    res.send(invoiceBuffer);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ message: 'Failed to generate invoice', error: error.message });
  }
};

// Send reminder email (admin only)
const sendReminderEmail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId).populate('user trek');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Send reminder email logic here
    // You can implement the actual email sending logic
    
    res.json({ message: 'Reminder email sent successfully' });
  } catch (error) {
    console.error('Error sending reminder email:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send confirmation email
const sendConfirmationEmail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('trek')
      .populate('batch');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is admin
    if (!req.user.isAdmin && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can send confirmation emails" });
    }

    // Create participant details for the email template
    const participants = booking.participantDetails || [{
      name: booking.userDetails.name,
      age: 'N/A',
      gender: 'N/A'
    }];

    // Send confirmation email to all participants using the proper template
    await sendConfirmationEmailToAllParticipants(
      booking, 
      booking.trek, 
      booking.user, 
      participants, 
      booking.batch, 
      booking.additionalRequests
    );

    res.json({ message: 'Confirmation email sent successfully' });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Send invoice email
const sendInvoiceEmail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('trek')
      .populate('batch');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is admin
    if (!req.user.isAdmin && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can send invoice emails" });
    }

    // Generate invoice and send email
    const paymentDetails = booking.paymentDetails || {
      id: booking._id.toString(),
      amount: booking.totalPrice * 100,
      method: booking.paymentDetails?.method || 'Manual/Offline'
    };
    
    const invoiceBuffer = await generateInvoicePDF(booking, paymentDetails);
    
    // Send professional invoice email
    await sendProfessionalInvoiceEmail(booking, booking.trek, booking.user, invoiceBuffer);

    res.json({ message: 'Invoice email sent successfully' });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Shift booking to another batch
const shiftBookingToBatch = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newBatchId } = req.body;

    if (!newBatchId) {
      return res.status(400).json({ message: 'New batch ID is required' });
    }

    // Check if user is admin
    if (!req.user.isAdmin && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can shift bookings" });
    }

    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('trek')
      .populate('batch');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Find the trek and new batch
    const trek = await Trek.findById(booking.trek._id);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    const newBatch = trek.batches.id(newBatchId);
    if (!newBatch) {
      return res.status(404).json({ message: 'New batch not found' });
    }

    // Check if new batch has enough capacity
    if (newBatch.currentParticipants + booking.numberOfParticipants > newBatch.maxParticipants) {
      return res.status(400).json({ message: 'New batch does not have enough capacity' });
    }

    // Check if new batch is in the future
    const currentDate = new Date();
    const newBatchStartDate = new Date(newBatch.startDate);
    if (newBatchStartDate <= currentDate) {
      return res.status(400).json({ message: 'Cannot shift to a batch that has already started' });
    }

    // Update old batch participants count
    const oldBatch = trek.batches.id(booking.batch._id);
    if (oldBatch) {
      oldBatch.currentParticipants = Math.max(0, oldBatch.currentParticipants - booking.numberOfParticipants);
    }

    // Update new batch participants count
    newBatch.currentParticipants += booking.numberOfParticipants;

    // Update booking batch
    booking.batch = newBatchId;

    // Update partial payment details if this is a partial payment booking
    if (booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
      const newBatchStartDate = new Date(newBatch.startDate);
      const finalPaymentDueDate = new Date(newBatchStartDate);
      finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() - trek.partialPayment.finalPaymentDueDays);
      
      booking.partialPaymentDetails.finalPaymentDueDate = finalPaymentDueDate;
      
      // Reset reminder sent flag since we're shifting to a new batch
      booking.partialPaymentDetails.reminderSent = false;
    }

    // Save changes
    await trek.save();
    await booking.save();

    // Send email notification to user
    try {
      await sendBatchShiftNotificationEmail(booking, trek, booking.user, oldBatch, newBatch);
    } catch (emailError) {
      console.error('Error sending batch shift notification email:', emailError);
      // Don't fail the operation if email fails
    }

    res.json({ 
      message: 'Booking shifted to new batch successfully',
      booking: {
        _id: booking._id,
        batch: booking.batch
      }
    });
  } catch (error) {
    console.error('Error shifting booking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create cancellation or reschedule request
const createCancellationRequest = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { requestType, reason, preferredBatch } = req.body;

    // Validate request type
    if (!['cancellation', 'reschedule'].includes(requestType)) {
      return res.status(400).json({ message: 'Invalid request type. Must be either "cancellation" or "reschedule"' });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('trek');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this booking' });
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot create request for cancelled booking' });
    }

    // Check if there's already a pending request
    if (booking.cancellationRequest && booking.cancellationRequest.status === 'pending') {
      return res.status(400).json({ message: 'There is already a pending request for this booking' });
    }

    // For reschedule requests, validate preferred batch
    if (requestType === 'reschedule' && !preferredBatch) {
      return res.status(400).json({ message: 'Preferred batch is required for reschedule requests' });
    }

    if (requestType === 'reschedule' && preferredBatch) {
      // Check if the preferred batch exists and belongs to the same trek
      const trek = booking.trek;
      if (!trek || !trek.batches) {
        return res.status(400).json({ message: 'Trek or batches not found' });
      }

      const batchExists = trek.batches.some(batch => batch._id.toString() === preferredBatch.toString());
      if (!batchExists) {
        return res.status(400).json({ message: 'Preferred batch does not belong to this trek' });
      }

      // Check if the preferred batch is the same as current batch
      if (booking.batch.toString() === preferredBatch.toString()) {
        return res.status(400).json({ message: 'Preferred batch cannot be the same as current batch' });
      }

      // Check if the preferred batch has available spots
      const preferredBatchData = trek.batches.find(batch => batch._id.toString() === preferredBatch.toString());
      if (preferredBatchData.currentParticipants >= preferredBatchData.maxParticipants) {
        return res.status(400).json({ message: 'Preferred batch is full' });
      }
    }

    // Update booking with the request
    booking.cancellationRequest = {
      type: requestType,
      reason: reason || '',
      preferredBatch: requestType === 'reschedule' ? preferredBatch : null,
      requestedAt: new Date(),
      status: 'pending',
      adminResponse: '',
      respondedAt: null
    };

    await booking.save();

    res.json({ 
      message: `${requestType} request created successfully`, 
      booking 
    });
  } catch (error) {
    console.error('Error creating cancellation request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update cancellation/reschedule request status
const updateCancellationRequest = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, adminResponse } = req.body;

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be either "approved" or "rejected"' });
    }

    // Find the booking with trek and user populated
    const booking = await Booking.findById(bookingId).populate('trek').populate('user');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if there's a pending request
    if (!booking.cancellationRequest || booking.cancellationRequest.status !== 'pending') {
      return res.status(400).json({ message: 'No pending request found for this booking' });
    }

    // Update the request
    booking.cancellationRequest.status = status;
    booking.cancellationRequest.adminResponse = adminResponse || '';
    booking.cancellationRequest.respondedAt = new Date();

    // Note: For cancellation requests, the actual cancellation is now handled by the adminCancelBooking API
    // This function only updates the request status and admin response
    if (status === 'approved' && booking.cancellationRequest.type === 'cancellation') {
      // The actual cancellation logic is handled by adminCancelBooking API
      // This function just updates the request status
      console.log(`Cancellation request approved for booking ${booking._id}. Actual cancellation handled by adminCancelBooking API.`);
    }

    // If approved and it's a reschedule request, shift the booking to the preferred batch
    if (status === 'approved' && booking.cancellationRequest.type === 'reschedule') {
      const preferredBatchId = booking.cancellationRequest.preferredBatch;
      
      if (!preferredBatchId) {
        return res.status(400).json({ message: 'Preferred batch not found in reschedule request' });
      }

      // Get the trek with full batch details
      const trek = await require('../models/Trek').findById(booking.trek._id);
      if (!trek || !trek.batches) {
        return res.status(400).json({ message: 'Trek or batches not found' });
      }

      // Find the preferred batch
      const preferredBatch = trek.batches.find(batch => 
        batch._id.toString() === preferredBatchId.toString()
      );

      if (!preferredBatch) {
        return res.status(400).json({ message: 'Preferred batch not found in trek' });
      }

      // Check if the preferred batch is the same as current batch
      if (booking.batch.toString() === preferredBatchId.toString()) {
        return res.status(400).json({ message: 'Preferred batch is the same as current batch' });
      }

      // Check if the preferred batch has available spots
      if (preferredBatch.currentParticipants >= preferredBatch.maxParticipants) {
        return res.status(400).json({ message: 'Preferred batch is full' });
      }

      // Check if new batch is in the future
      const currentDate = new Date();
      const newBatchStartDate = new Date(preferredBatch.startDate);
      if (newBatchStartDate <= currentDate) {
        return res.status(400).json({ message: 'Cannot shift to a batch that has already started' });
      }

      // Find the current batch to update participant count
      const currentBatch = trek.batches.find(batch => 
        batch._id.toString() === booking.batch.toString()
      );

      // Update old batch participants count
      if (currentBatch) {
        currentBatch.currentParticipants = Math.max(0, currentBatch.currentParticipants - booking.numberOfParticipants);
      }

      // Update new batch participants count
      preferredBatch.currentParticipants += booking.numberOfParticipants;

      // Update booking batch
      booking.batch = preferredBatchId;

      // Save trek changes
      await trek.save();

      // Send reschedule approval email notification to user
      try {
        await sendRescheduleApprovalEmail(booking, trek, booking.user, currentBatch, preferredBatch, adminResponse);
      } catch (emailError) {
        console.error('Error sending reschedule approval email:', emailError);
        // Don't fail the operation if email fails
      }

      console.log(`Booking ${booking._id} shifted from batch ${booking.batch} to ${preferredBatchId}`);
    }

    await booking.save();

    res.json({ 
      message: `Request ${status} successfully${status === 'approved' && booking.cancellationRequest.type === 'reschedule' ? ' and booking shifted to preferred batch' : ''}`, 
      booking 
    });
  } catch (error) {
    console.error('Error updating cancellation request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Calculate refund amount for cancellation
const calculateRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { cancellationType, selectedParticipants, refundType, customRefundAmount } = req.body;

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('trek');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get the batch from trek
    const batch = booking.trek?.batches?.find(b => b._id.toString() === booking.batch?.toString());
    if (!batch) {
      return res.status(400).json({ message: 'Batch not found' });
    }

    let totalRefund = 0;

    if (cancellationType === 'individual' && selectedParticipants && selectedParticipants.length > 0) {
      // Calculate refund for individual participants
      const perPrice = booking.totalPrice / booking.participantDetails.length;
      
      for (const participantId of selectedParticipants) {
        const participant = booking.participantDetails.find(p => p._id.toString() === participantId);
        if (!participant || participant.isCancelled) continue;

        let participantRefund = 0;
        
        if (refundType === 'custom' && customRefundAmount) {
          participantRefund = customRefundAmount / selectedParticipants.length;
        } else {
          participantRefund = getRefundAmount(perPrice, batch.startDate, new Date(), refundType);
        }

        totalRefund += participantRefund;
      }
    } else {
      // Calculate refund for entire booking
      if (refundType === 'custom' && customRefundAmount) {
        totalRefund = customRefundAmount;
      } else {
        totalRefund = getRefundAmount(booking.totalPrice, batch.startDate, new Date(), refundType);
      }
    }

    // Get cancellation policy description
    const now = new Date();
    const start = new Date(batch.startDate);
    const diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

    let policyDescription = '';
    let policyColor = '';

    if (diffDays > 21) {
      policyDescription = 'Free cancellation (100% refund)';
      policyColor = 'text-green-600';
    } else if (diffDays >= 15) {
      policyDescription = '75% refund (25% cancellation charge)';
      policyColor = 'text-yellow-600';
    } else if (diffDays >= 8) {
      policyDescription = '50% refund (50% cancellation charge)';
      policyColor = 'text-orange-600';
    } else {
      policyDescription = 'No refund (within 7 days of trek)';
      policyColor = 'text-red-600';
    }

    res.json({
      totalRefund,
      policyDescription,
      policyColor,
      daysUntilTrek: diffDays
    });
  } catch (error) {
    console.error('Error calculating refund:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Cleanup expired pending bookings (admin only)
const cleanupExpiredBookings = async (req, res) => {
  try {
    // Check if user is authorized (admin only)
    if (!req.user.isAdmin && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to perform cleanup" });
    }

    const { cleanupExpiredPendingBookings } = require('../scripts/cleanupPendingBookings');
    
    // Run cleanup with error handling
    try {
      await cleanupExpiredPendingBookings();
      
      res.json({ 
        message: "Cleanup completed successfully",
        timestamp: new Date()
      });
    } catch (cleanupError) {
      console.error("Error during cleanup process:", cleanupError);
      res.status(500).json({ 
        message: "Cleanup process failed", 
        error: cleanupError.message 
      });
    }

  } catch (error) {
    console.error("Error setting up cleanup:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Send partial payment reminder (admin only)
const sendPartialPaymentReminder = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('user trek');
      
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'payment_confirmed_partial') {
      return res.status(400).json({ message: 'Booking is not in partial payment status' });
    }

    if (!booking.partialPaymentDetails) {
      return res.status(400).json({ message: 'No partial payment details found' });
    }

    // Check if reminder is already sent
    if (booking.partialPaymentDetails.reminderSent) {
      return res.status(400).json({ message: 'Reminder already sent for this booking' });
    }

    // Find the actual batch object from trek's batches array
    const batch = booking.trek?.batches?.find(
      (b) => b._id.toString() === booking.batch?.toString()
    );

    // Send reminder email using standard template
    const emailResult = await sendPartialPaymentReminderEmail(
      booking, 
      booking.trek, 
      booking.user, 
      batch
    );

    if (!emailResult) {
      return res.status(500).json({ message: 'Failed to send reminder email' });
    }

    // Update reminder sent flag
    booking.partialPaymentDetails.reminderSent = true;
    await booking.save();
    
    res.json({ 
      message: 'Partial payment reminder sent successfully',
      emailSent: true
    });
  } catch (error) {
    console.error('Error sending partial payment reminder:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark partial payment as complete (admin only)
const markPartialPaymentComplete = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId).populate('user trek');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'payment_confirmed_partial') {
      return res.status(400).json({ message: 'Booking is not in partial payment status' });
    }

    if (!booking.partialPaymentDetails) {
      return res.status(400).json({ message: 'No partial payment details found' });
    }

    // Update partial payment details
    booking.partialPaymentDetails.remainingAmount = 0;
    booking.partialPaymentDetails.finalPaymentDate = new Date();
    
    // Update status based on whether participant details exist
    if (booking.participantDetails && booking.participantDetails.length > 0) {
      booking.status = 'confirmed';
    } else {
      booking.status = 'payment_completed';
    }
    
    await booking.save();
    
    res.json({ 
      message: 'Partial payment marked as complete successfully',
      booking 
    });
  } catch (error) {
    console.error('Error marking partial payment as complete:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getBookings,
  updateBookingStatus,
  deleteBooking,
  restoreBooking,
  cancelParticipant,
  restoreParticipant,
  updateBooking,
  exportBookings,
  updateParticipantDetails,
  markTrekCompleted,
  createCustomTrekBooking,
  downloadInvoice,
  updateAdminRemarks,
  sendReminderEmail,
  sendConfirmationEmail,
  sendInvoiceEmail,
  shiftBookingToBatch,
  createCancellationRequest,
  updateCancellationRequest,
  calculateRefund,

  cleanupExpiredBookings,
  sendPartialPaymentReminder,
  markPartialPaymentComplete
};
