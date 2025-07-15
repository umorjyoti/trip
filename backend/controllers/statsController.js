const Booking = require('../models/Booking');
const Trek = require('../models/Trek');
const mongoose = require('mongoose');

// Get sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    console.log('Sales stats request received with query:', req.query);
    const { 
      timeRange, 
      trekId, 
      batchId, 
      startDate, 
      endDate 
    } = req.query;
    
    let dateFilter = {};
    
    // Handle custom date range if provided
    if (startDate && endDate) {
      dateFilter = { 
        createdAt: { 
          $gte: new Date(startDate), 
          $lte: new Date(endDate) 
        } 
      };
    } else {
      // Set date filter based on time range
      const now = new Date();
      if (timeRange === 'month') {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateFilter = { createdAt: { $gte: lastMonth } };
      } else if (timeRange === 'quarter') {
        const lastQuarter = new Date(now);
        lastQuarter.setMonth(lastQuarter.getMonth() - 3);
        dateFilter = { createdAt: { $gte: lastQuarter } };
      } else if (timeRange === 'year') {
        const lastYear = new Date(now);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        dateFilter = { createdAt: { $gte: lastYear } };
      }
    }
    
    console.log('Date filter:', dateFilter);
    
    // Build booking filter
    let bookingFilter = {
      ...dateFilter,
      status: 'confirmed'
    };
    
    // Add trek filter if provided
    if (trekId) {
      bookingFilter.trek = trekId;
    }
    
    // Add batch filter if provided
    if (batchId) {
      bookingFilter.batch = batchId;
    }
    
    console.log('Booking filter:', JSON.stringify(bookingFilter));
    
    // Get total revenue and bookings
    const bookings = await Booking.find(bookingFilter).populate({
      path: 'trek',
      select: 'name region',
      populate: {
        path: 'region',
        select: 'name'
      }
    });
    
    console.log(`Found ${bookings.length} bookings`);
    
    // After the bookings query
    if (bookings.length === 0) {
      // Return empty stats if no bookings found
      return res.json({
        totalRevenue: 0,
        totalBookings: 0,
        avgBookingValue: 0,
        avgParticipants: 0,
        revenueByRegion: [],
        revenueByPeriod: [],
        bookingsByPeriod: [],
        topTreks: [],
        revenueByTrek: [],
        revenueByBatch: []
      });
    }
    
    // Calculate basic stats - only subtract successful refunds
    const totalRevenue = bookings.reduce((sum, booking) => {
      const paid = booking.totalPrice || 0;
      // Only subtract refunds if they were successfully processed
      let refunded = 0;
      if (booking.refundStatus === 'success') {
        refunded += booking.refundAmount || 0;
      }
      // Participant-level refunds (for partial cancellations) - only successful ones
      if (Array.isArray(booking.participantDetails)) {
        refunded += booking.participantDetails.reduce((rSum, p) => {
          if (p.refundStatus === 'success') {
            return rSum + (p.refundAmount || 0);
          }
          return rSum;
        }, 0);
      }
      return sum + (paid - refunded);
    }, 0);
    const totalBookings = bookings.length;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const totalParticipants = bookings.reduce((sum, booking) => sum + booking.participants, 0);
    const avgParticipants = totalBookings > 0 ? totalParticipants / totalBookings : 0;
    
    // Calculate revenue by region
    const revenueByRegion = [];
    const regionMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.trek && booking.trek.region) {
        const region = booking.trek.region.name || booking.trek.region; // Use name if populated, fallback to ID
        const paid = booking.totalPrice || 0;
        // Only subtract refunds if they were successfully processed
        let refunded = 0;
        if (booking.refundStatus === 'success') {
          refunded += booking.refundAmount || 0;
        }
        if (Array.isArray(booking.participantDetails)) {
          refunded += booking.participantDetails.reduce((rSum, p) => {
            if (p.refundStatus === 'success') {
              return rSum + (p.refundAmount || 0);
            }
            return rSum;
          }, 0);
        }
        const amount = paid - refunded;
        
        if (regionMap.has(region)) {
          regionMap.set(region, regionMap.get(region) + amount);
        } else {
          regionMap.set(region, amount);
        }
      }
    });
    
    regionMap.forEach((amount, region) => {
      revenueByRegion.push({ region, amount });
    });
    
    // Sort by amount descending
    revenueByRegion.sort((a, b) => b.amount - a.amount);
    
    // Calculate revenue by trek
    const revenueByTrek = [];
    const trekMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.trek) {
        const trekId = booking.trek._id.toString();
        const trekName = booking.trek.name;
        const trekRegion = booking.trek.region.name || booking.trek.region; // Use name if populated, fallback to ID
        const paid = booking.totalPrice || 0;
        // Only subtract refunds if they were successfully processed
        let refunded = 0;
        if (booking.refundStatus === 'success') {
          refunded += booking.refundAmount || 0;
        }
        if (Array.isArray(booking.participantDetails)) {
          refunded += booking.participantDetails.reduce((rSum, p) => {
            if (p.refundStatus === 'success') {
              return rSum + (p.refundAmount || 0);
            }
            return rSum;
          }, 0);
        }
        const amount = paid - refunded;
        
        if (trekMap.has(trekId)) {
          const trek = trekMap.get(trekId);
          trek.revenue += amount;
          trek.bookings += 1;
        } else {
          trekMap.set(trekId, {
            id: trekId,
            name: trekName,
            region: trekRegion,
            revenue: amount,
            bookings: 1
          });
        }
      }
    });
    
    trekMap.forEach((trek) => {
      revenueByTrek.push(trek);
    });
    
    // Sort by revenue descending
    revenueByTrek.sort((a, b) => b.revenue - a.revenue);
    
    // Calculate revenue by batch
    const revenueByBatch = [];
    const batchMap = new Map();
    
    // First, get all treks with their batches to map batch IDs to dates
    const trekIds = [...new Set(bookings.map(booking => booking.trek._id.toString()))];
    const treksWithBatches = await Trek.find({ _id: { $in: trekIds } })
      .select('_id name batches');
    
    // Create a map of batch ID to batch details
    const batchDetailsMap = new Map();
    treksWithBatches.forEach(trek => {
      trek.batches.forEach(batch => {
        batchDetailsMap.set(batch._id.toString(), {
          trekName: trek.name,
          startDate: batch.startDate,
          endDate: batch.endDate
        });
      });
    });
    
    bookings.forEach(booking => {
      if (booking.batch) {
        const batchId = booking.batch.toString();
        const batchDetails = batchDetailsMap.get(batchId);
        
        if (batchDetails) {
          const trekName = batchDetails.trekName;
          const startDate = new Date(batchDetails.startDate);
          const formattedDate = startDate.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });
          
          const paid = booking.totalPrice || 0;
          // Only subtract refunds if they were successfully processed
          let refunded = 0;
          if (booking.refundStatus === 'success') {
            refunded += booking.refundAmount || 0;
          }
          if (Array.isArray(booking.participantDetails)) {
            refunded += booking.participantDetails.reduce((rSum, p) => {
              if (p.refundStatus === 'success') {
                return rSum + (p.refundAmount || 0);
              }
              return rSum;
            }, 0);
          }
          const amount = paid - refunded;
          
          if (batchMap.has(batchId)) {
            const batch = batchMap.get(batchId);
            batch.revenue += amount;
            batch.bookings += 1;
          } else {
            batchMap.set(batchId, {
              id: batchId,
              trekName: trekName,
              startDate: startDate,
              formattedDate: formattedDate,
              displayName: `${formattedDate}\n${trekName}`,
              revenue: amount,
              bookings: 1
            });
          }
        }
      }
    });
    
    batchMap.forEach((batch) => {
      revenueByBatch.push(batch);
    });
    
    // Sort by start date descending (most recent first)
    revenueByBatch.sort((a, b) => b.startDate - a.startDate);
    
    // Calculate revenue by period (month, week, or day depending on time range)
    const revenueByPeriod = [];
    const bookingsByPeriod = [];
    const periodMap = new Map();
    const bookingCountMap = new Map();
    
    // Format date based on time range
    const formatPeriod = (date) => {
      if (timeRange === 'month' || (startDate && endDate)) {
        return date.toISOString().substring(0, 10); // YYYY-MM-DD
      } else if (timeRange === 'quarter') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      } else {
        return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`; // YYYY-Q#
      }
    };
    
    bookings.forEach(booking => {
      const period = formatPeriod(new Date(booking.createdAt));
      const paid = booking.totalPrice || 0;
      // Only subtract refunds if they were successfully processed
      let refunded = 0;
      if (booking.refundStatus === 'success') {
        refunded += booking.refundAmount || 0;
      }
      if (Array.isArray(booking.participantDetails)) {
        refunded += booking.participantDetails.reduce((rSum, p) => {
          if (p.refundStatus === 'success') {
            return rSum + (p.refundAmount || 0);
          }
          return rSum;
        }, 0);
      }
      const amount = paid - refunded;
      
      if (periodMap.has(period)) {
        periodMap.set(period, periodMap.get(period) + amount);
        bookingCountMap.set(period, bookingCountMap.get(period) + 1);
      } else {
        periodMap.set(period, amount);
        bookingCountMap.set(period, 1);
      }
    });
    
    // Convert maps to arrays and sort by period
    periodMap.forEach((amount, period) => {
      revenueByPeriod.push({ period, amount });
    });
    
    bookingCountMap.forEach((count, period) => {
      bookingsByPeriod.push({ period, count });
    });
    
    // Sort by period
    revenueByPeriod.sort((a, b) => a.period.localeCompare(b.period));
    bookingsByPeriod.sort((a, b) => a.period.localeCompare(b.period));
    
    // Get top performing treks (limit to 5 for the overview)
    const topTreks = revenueByTrek.slice(0, 5);
    
    res.json({
      totalRevenue,
      totalBookings,
      avgBookingValue,
      avgParticipants,
      revenueByRegion,
      revenueByPeriod,
      bookingsByPeriod,
      topTreks,
      revenueByTrek,
      revenueByBatch
    });
    
  } catch (error) {
    console.error('Error getting sales stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Get total treks
    const totalTreks = await Trek.countDocuments();
    
    // Get total users
    const totalUsers = await mongoose.model('User').countDocuments();
    
    // Get total bookings
    const totalBookings = await Booking.countDocuments();
    
    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'name')
      .populate('trek', 'name');
    
    // Get upcoming treks (batches starting in the next 30 days)
    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    const upcomingTreks = await Trek.find({
      'batches.startDate': { $gte: now, $lte: thirtyDaysLater }
    }).limit(5);
    
    res.json({
      totalTreks,
      totalUsers,
      totalBookings,
      recentBookings,
      upcomingTreks
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get treks for sales dashboard filters
exports.getSalesTreks = async (req, res) => {
  try {
    const treks = await Trek.find({ isEnabled: true })
      .select('_id name region')
      .populate('region', 'name')
      .sort({ name: 1 });
    
    // Format the response to include region names
    const formattedTreks = treks.map(trek => ({
      _id: trek._id,
      name: trek.name,
      region: trek.region ? trek.region.name : trek.region
    }));
    
    res.json(formattedTreks);
  } catch (error) {
    console.error('Error getting sales treks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get batches for sales dashboard filters
exports.getSalesBatches = async (req, res) => {
  try {
    const { trekId } = req.query;
    
    let query = {};
    if (trekId) {
      query._id = trekId;
    }
    
    const treks = await Trek.find(query)
      .select('_id name batches')
      .sort({ name: 1 });
    
    const batches = [];
    treks.forEach(trek => {
      trek.batches.forEach(batch => {
        const startDate = new Date(batch.startDate);
        const formattedDate = startDate.toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
        
        batches.push({
          id: batch._id.toString(),
          trekId: trek._id.toString(),
          trekName: trek.name,
          startDate: batch.startDate,
          endDate: batch.endDate,
          formattedDate: formattedDate,
          displayName: `${formattedDate} - ${trek.name}`
        });
      });
    });
    
    // Sort by start date descending
    batches.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    
    res.json(batches);
  } catch (error) {
    console.error('Error getting sales batches:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 