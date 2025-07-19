const { FailedBooking, Booking, Trek, User } = require("../models");

// Get all failed bookings (admin only)
const getFailedBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, failureReason, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Build filter query
    const filterQuery = {};
    
    if (failureReason) {
      filterQuery.failureReason = failureReason;
    }
    
    if (startDate && endDate) {
      filterQuery.archivedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [failedBookings, total, stats] = await Promise.all([
      FailedBooking.find(filterQuery)
        .populate("user", "name email")
        .populate("trek", "name")
        .sort({ archivedAt: -1 })
        .skip(skip)
        .limit(limit),
      FailedBooking.countDocuments(filterQuery),
      FailedBooking.aggregate([
        { $match: filterQuery },
        {
          $group: {
            _id: null,
            totalFailed: { $sum: 1 },
            totalValue: { $sum: "$totalPrice" },
            sessionExpired: {
              $sum: { $cond: [{ $eq: ["$failureReason", "session_expired"] }, 1, 0] }
            },
            paymentFailed: {
              $sum: { $cond: [{ $eq: ["$failureReason", "payment_failed"] }, 1, 0] }
            },
            userCancelled: {
              $sum: { $cond: [{ $eq: ["$failureReason", "user_cancelled"] }, 1, 0] }
            },
            systemError: {
              $sum: { $cond: [{ $eq: ["$failureReason", "system_error"] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalFailed: 1,
            totalValue: { $round: ["$totalValue", 2] },
            sessionExpired: 1,
            paymentFailed: 1,
            userCancelled: 1,
            systemError: 1,
            averageValue: {
              $round: [
                { $cond: [{ $eq: ["$totalFailed", 0] }, 0, { $divide: ["$totalValue", "$totalFailed"] }] },
                2
              ]
            }
          }
        }
      ])
    ]);

    // Extract stats from aggregation result
    const statsData = stats.length > 0 ? stats[0] : {
      totalFailed: 0,
      totalValue: 0,
      sessionExpired: 0,
      paymentFailed: 0,
      userCancelled: 0,
      systemError: 0,
      averageValue: 0
    };

    res.json({
      failedBookings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      stats: statsData
    });
  } catch (error) {
    console.error("Error getting failed bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get failed booking by ID
const getFailedBookingById = async (req, res) => {
  try {
    const failedBooking = await FailedBooking.findById(req.params.id)
      .populate("user", "name email")
      .populate("trek", "name imageUrl batches")
      .populate("batch");

    if (!failedBooking) {
      return res.status(404).json({ message: "Failed booking not found" });
    }

    res.json(failedBooking);
  } catch (error) {
    console.error("Error getting failed booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Restore failed booking (admin only)
const restoreFailedBooking = async (req, res) => {
  try {
    const failedBooking = await FailedBooking.findById(req.params.id);
    if (!failedBooking) {
      return res.status(404).json({ message: "Failed booking not found" });
    }

    // Check if the batch still has available spots
    const trek = await Trek.findById(failedBooking.trek);
    if (!trek) {
      return res.status(404).json({ message: "Trek not found" });
    }

    const batch = trek.batches.id(failedBooking.batch);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    if (batch.currentParticipants + failedBooking.numberOfParticipants > batch.maxParticipants) {
      return res.status(400).json({ 
        message: "Cannot restore booking - batch is now full" 
      });
    }

    // Create new booking from failed booking
    const newBooking = new Booking({
      user: failedBooking.user,
      trek: failedBooking.trek,
      batch: failedBooking.batch,
      numberOfParticipants: failedBooking.numberOfParticipants,
      addOns: failedBooking.addOns,
      userDetails: failedBooking.userDetails,
      totalPrice: failedBooking.totalPrice,
      status: "pending_payment",
      bookingSession: {
        sessionId: `restored_${Date.now()}_${failedBooking.user}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        paymentAttempts: 0,
        lastPaymentAttempt: new Date()
      }
    });

    await newBooking.save();

    // Update batch participant count
    batch.currentParticipants += failedBooking.numberOfParticipants;
    await trek.save();

    // Delete the failed booking
    await FailedBooking.findByIdAndDelete(failedBooking._id);

    res.json({ 
      message: "Failed booking restored successfully", 
      booking: newBooking 
    });
  } catch (error) {
    console.error("Error restoring failed booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete failed booking permanently (admin only)
const deleteFailedBooking = async (req, res) => {
  try {
    const failedBooking = await FailedBooking.findById(req.params.id);
    if (!failedBooking) {
      return res.status(404).json({ message: "Failed booking not found" });
    }

    await FailedBooking.findByIdAndDelete(req.params.id);

    res.json({ message: "Failed booking deleted permanently" });
  } catch (error) {
    console.error("Error deleting failed booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Export failed bookings to Excel
const exportFailedBookings = async (req, res) => {
  try {
    const { failureReason, startDate, endDate } = req.query;

    // Build filter query
    const filterQuery = {};
    
    if (failureReason) {
      filterQuery.failureReason = failureReason;
    }
    
    if (startDate && endDate) {
      filterQuery.archivedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const failedBookings = await FailedBooking.find(filterQuery)
      .populate("user", "name email")
      .populate("trek", "name")
      .sort({ archivedAt: -1 });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Failed Bookings');

    // Define columns
    worksheet.columns = [
      { header: 'Failed Booking ID', key: 'failedBookingId', width: 15 },
      { header: 'Original Booking ID', key: 'originalBookingId', width: 15 },
      { header: 'User Name', key: 'userName', width: 20 },
      { header: 'User Email', key: 'userEmail', width: 25 },
      { header: 'Trek Name', key: 'trekName', width: 30 },
      { header: 'Participants', key: 'participants', width: 12 },
      { header: 'Total Price', key: 'totalPrice', width: 15 },
      { header: 'Failure Reason', key: 'failureReason', width: 15 },
      { header: 'Payment Attempts', key: 'paymentAttempts', width: 15 },
      { header: 'Original Created', key: 'originalCreated', width: 20 },
      { header: 'Archived At', key: 'archivedAt', width: 20 },
      { header: 'Archived By', key: 'archivedBy', width: 12 }
    ];

    // Add data
    failedBookings.forEach(booking => {
      worksheet.addRow({
        failedBookingId: booking.bookingId,
        originalBookingId: booking.originalBookingId,
        userName: booking.user?.name || booking.userDetails?.name || 'N/A',
        userEmail: booking.user?.email || booking.userDetails?.email || 'N/A',
        trekName: booking.trek?.name || 'N/A',
        participants: booking.numberOfParticipants,
        totalPrice: `₹${booking.totalPrice}`,
        failureReason: booking.failureReason,
        paymentAttempts: booking.bookingSession?.paymentAttempts || 0,
        originalCreated: booking.originalCreatedAt ? new Date(booking.originalCreatedAt).toLocaleDateString() : 'N/A',
        archivedAt: booking.archivedAt ? new Date(booking.archivedAt).toLocaleDateString() : 'N/A',
        archivedBy: booking.archivedBy
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=failed-bookings-${new Date().toISOString().split('T')[0]}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error exporting failed bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getFailedBookings,
  getFailedBookingById,
  restoreFailedBooking,
  deleteFailedBooking,
  exportFailedBookings
}; 