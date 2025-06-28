const { Booking, Batch, Trek, User } = require("../models");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { sendEmail, sendBookingConfirmationEmail } = require('../utils/email');

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

    // Check if batch is full
    if (batch.currentParticipants + participantsCount > batch.maxParticipants) {
      return res
        .status(400)
        .json({ message: "Not enough spots available in this batch" });
    }

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      trek: trekId,
      batch: batchId,
      numberOfParticipants: participantsCount,
      addOns: Array.isArray(addOns) ? addOns : [],
      userDetails,
      totalPrice,
      status: "pending",
    });

    // Save booking
    await booking.save();

    // Update batch participants count
    batch.currentParticipants += participantsCount;
    await trek.save();

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

    const bookings = await Booking.find({ user: req.user._id })
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
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      booking.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this booking" });
    }

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

    // Format the response data
    const responseData = {
      _id: booking._id,
      user: booking.user,
      trek: trekInfo
        ? {
            _id: trekInfo._id,
            name: trekInfo.name,
            imageUrl: trekInfo.imageUrl
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
    const booking = await Booking.findById(req.params.id);

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

    booking.status = "cancelled";
    await booking.save();

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

    const [bookings, total] = await Promise.all([
      Booking.find({})
        .populate("user", "name email")
        .populate("trek", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments({})
    ]);

    res.json({
      bookings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
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
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
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
      (p) => p._id === participantId
    );

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    if (participant.isCancelled) {
      return res
        .status(400)
        .json({ message: "Participant is already cancelled" });
    }

    // Mark participant as cancelled
    participant.isCancelled = true;
    participant.cancelledAt = new Date();

    // Update the total price by subtracting the price for this participant
    const batch = await Trek.findById(booking.trek).then((trek) =>
      trek.batches.id(booking.batch)
    );

    if (batch) {
      booking.totalPrice -= batch.price;
    }

    await booking.save();

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
      (p) => p._id === participantId
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
      booking.status = status;
    }

    await booking.save();

    // Send booking confirmation email if participant details are being updated
    if (isUpdatingParticipantDetails && booking.status === 'confirmed') {
      console.log('Sending booking confirmation email from updateBooking');
      try {
        const trek = booking.trek;
        const user = booking.user;
        const batch = trek?.batches?.find(b => b._id.toString() === booking.batch?.toString());
        
        // Get pickup/drop locations and additional requests from booking if available
        const pickupLocation = booking.pickupLocation || 'To be confirmed';
        const dropLocation = booking.dropLocation || 'To be confirmed';
        const additionalRequests = booking.additionalRequests || 'None';

        await sendBookingConfirmationEmail(booking, trek, user, participantDetails, batch, pickupLocation, dropLocation, additionalRequests);
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
    const { participants, pickupLocation, dropLocation, additionalRequests } = req.body;

    console.log('updateParticipantDetails called for booking:', id);
    console.log('Request body:', { participants, pickupLocation, dropLocation, additionalRequests });

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

    // Update booking with participant details
    booking.participantDetails = participants;
    booking.pickupLocation = pickupLocation;
    booking.dropLocation = dropLocation;
    booking.additionalRequests = additionalRequests;
    booking.status = 'confirmed'; // Update status to confirmed after collecting details

    await booking.save();

    console.log('Booking updated successfully, status:', booking.status);

    // Send booking confirmation email
    try {
      const trek = booking.trek;
      const user = booking.user;
      const batch = trek?.batches?.find(b => b._id.toString() === booking.batch?.toString());
      
      console.log('Sending booking confirmation email to:', user.email);

      await sendBookingConfirmationEmail(booking, trek, user, participants, batch, pickupLocation, dropLocation, additionalRequests);
      
      console.log('Booking confirmation email sent successfully');
    } catch (emailError) {
      console.error('Error sending booking confirmation email:', emailError);
      // Don't fail the participant details update if email fails
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

// Booking reminder email (to be called by a scheduler)
const sendBookingReminderEmail = async (booking, trek, batch) => {
  if (!booking || !trek || !batch) return;
  await sendEmail({
    to: booking.userDetails.email,
    subject: 'Booking Reminder',
    text: `Hi ${booking.userDetails.name},\n\nThis is a reminder for your upcoming trek: ${trek.name}.\nBatch: ${batch.startDate ? new Date(batch.startDate).toLocaleDateString() : ''} to ${batch.endDate ? new Date(batch.endDate).toLocaleDateString() : ''}\nParticipants: ${booking.numberOfParticipants}\n\nWe look forward to seeing you!\n\nSafe travels!`
  });
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
  sendBookingReminderEmail
};
