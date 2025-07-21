const Trek = require('../models/Trek'); // Make sure this path is correct
const mongoose = require('mongoose');
const Booking = require('../models/Booking'); // Implied import for Booking model
const Region = require('../models/Region'); // Add Region model import
const crypto = require('crypto');

// Get trek statistics
exports.getTrekStats = async (req, res) => {
  try {
    console.log('Getting trek stats...');
    const totalTreks = await Trek.countDocuments();
    console.log('Total treks:', totalTreks);
    
    // Get region stats
    const regions = await Trek.aggregate([
      { $group: { _id: "$regionName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get difficulty stats
    const difficulties = await Trek.aggregate([
      { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get season stats
    const seasons = await Trek.aggregate([
      { $group: { _id: "$season", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const response = {
      totalTreks,
      regions,
      difficulties,
      seasons
    };
    
    console.log('Trek stats response:', response);
    res.status(200).json(response);
  } catch (err) {
    console.error('Error getting trek stats:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all treks
exports.getAllTreks = async (req, res) => {
  try {
    const { showCustom } = req.query;
    
    let query = {};
    
    // If showCustom is not specified or false, exclude custom treks
    if (!showCustom || showCustom === 'false') {
      query.isCustom = { $ne: true };
    } else if (showCustom === 'true') {
      query.isCustom = true;
    }
    console.log("Hellokitty")
    const treks = await Trek.find(query)
      .select('+customAccessToken')
      .sort({ createdAt: -1 });

    // Calculate actual current participants for each trek's batches
    const treksWithActualParticipants = await Promise.all(treks.map(async (trek) => {
      const trekObj = trek.toObject();
      
      if (trek.batches && Array.isArray(trek.batches)) {
        // Get all batch IDs for this trek
        const batchIds = trek.batches
          .filter(batch => batch && batch._id)
          .map(batch => batch._id);
        
        let bookings = [];
        if (batchIds.length > 0) {
          // Get all bookings for this trek's batches
          bookings = await Booking.find({
            batch: { $in: batchIds }
          }).populate('user', 'name email');
        }

        // Safely filter bookings
        const safeBookings = bookings.filter(booking => booking != null);

        // Calculate actual current participants for each batch
        trekObj.batches = trek.batches.map(batch => {
          const batchBookings = safeBookings.filter(booking => {
            if (!booking || !booking.batch || !batch || !batch._id) {
              return false;
            }
            // Safe string comparison
            const bookingBatchId = booking.batch.toString ? booking.batch.toString() : String(booking.batch);
            const batchId = batch._id.toString ? batch._id.toString() : String(batch._id);
            return bookingBatchId === batchId;
          });

          // Calculate actual current participants using the new logic
          const actualCurrentParticipants = batchBookings.reduce((sum, booking) => {
            if (!booking) return sum;
            
            if (booking.status === 'payment_completed') {
              // For payment_completed bookings, use numberOfParticipants directly
              return sum + (booking.numberOfParticipants || 0);
            } else if (booking.status === 'confirmed') {
              // For confirmed bookings, check participantDetails and count non-cancelled participants
              if (booking.participantDetails && Array.isArray(booking.participantDetails)) {
                const activeParticipants = booking.participantDetails.filter(p => !p.isCancelled).length;
                return sum + activeParticipants;
              } else {
                // Fallback to numberOfParticipants if no participantDetails
                return sum + (booking.numberOfParticipants || 0);
              }
            }
            
            return sum;
          }, 0);

          return {
            ...batch.toObject(),
            actualCurrentParticipants: actualCurrentParticipants
          };
        });
      }
      
      return trekObj;
    }));

    res.json(treksWithActualParticipants);
  } catch (error) {
    console.error('Error fetching all treks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get trek by ID
exports.getTrekById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid trek ID format' });
    }
    
    // Get current date for filtering batches
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of day

    // Fetch trek with populated batches and include customFields
    const trek = await Trek.findById(id).select('+gstPercent +gstType +gatewayPercent +gatewayType +customFields');
    
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    // Get all bookings for this trek's batches to calculate actual current participants
    const batchIds = trek.batches
      .filter(batch => batch && batch._id)
      .map(batch => batch._id);
    
    let bookings = [];
    if (batchIds.length > 0) {
      bookings = await Booking.find({
        batch: { $in: batchIds }
      }).populate('user', 'name email');
    }

    // Safely filter bookings
    const safeBookings = bookings.filter(booking => booking != null);

    // Calculate actual current participants and confirmed booking count for each batch
    const updatedBatches = await Promise.all(trek.batches.map(async batch => {
      const batchBookings = safeBookings.filter(booking => {
        if (!booking || !booking.batch || !batch || !batch._id) {
          return false;
        }
        // Safe string comparison
        const bookingBatchId = booking.batch.toString ? booking.batch.toString() : String(booking.batch);
        const batchId = batch._id.toString ? batch._id.toString() : String(batch._id);
        return bookingBatchId === batchId;
      });

      // Query DB for confirmed bookings for this batch
      const bookingCountConfirmed = await Booking.countDocuments({
        batch: batch._id,
        status: 'confirmed'
      });

      // Calculate actual current participants using the improved logic
      const actualCurrentParticipants = batchBookings.reduce((sum, booking) => {
        if (!booking) return sum;
        
        if (booking.status === 'payment_completed') {
          // For payment_completed bookings, use numberOfParticipants directly
          return sum + (booking.numberOfParticipants || 0);
        } else if (booking.status === 'confirmed') {
          // For confirmed bookings, check participantDetails and count non-cancelled participants
          if (booking.participantDetails && Array.isArray(booking.participantDetails)) {
            const activeParticipants = booking.participantDetails.filter(p => !p.isCancelled).length;
            return sum + activeParticipants;
          } else {
            // Fallback to numberOfParticipants if no participantDetails
            return sum + (booking.numberOfParticipants || 0);
          }
        }
        
        return sum;
      }, 0);

      // Calculate available spots based on confirmed booking count (not participant count)
      const availableSpots = Math.max(0, batch.maxParticipants - bookingCountConfirmed);

      return {
        ...batch.toObject(),
        currentParticipants: actualCurrentParticipants,
        availableSpots: availableSpots,
        bookingCountConfirmed: bookingCountConfirmed // new attribute
      };
    }));

    // Filter batches to only show future batches with available spots
    // Check if this is an admin request (no filtering) or user request (filtering)
    const isAdminRequest = req.query.admin === 'true' || req.user?.isAdmin || req.user?.role === 'admin';
    
    let availableBatches;
    if (isAdminRequest) {
      // For admin requests, show all batches without filtering
      availableBatches = updatedBatches;
    } else {
      // For user requests, filter to only show future batches with available spots
      availableBatches = updatedBatches.filter(batch => {
        const batchStartDate = new Date(batch.startDate);
        batchStartDate.setHours(0, 0, 0, 0);
        
        return (
          // Batch hasn't started yet
          batchStartDate > currentDate &&
          // Has available spots
          batch.availableSpots > 0
        );
      });
    }

    // Ensure GST and gateway details are included in the response
    const response = trek.toObject();
    response.batches = availableBatches;
    response.gstDetails = {
      percent: trek.gstPercent || 0,
      type: trek.gstType || 'excluded'
    };
    response.gatewayDetails = {
      percent: trek.gatewayPercent || 0,
      type: trek.gatewayType || 'customer'
    };
    
    console.log('Trek found:', trek.name);
    console.log('Available future batches:', availableBatches.length);
    console.log('Custom fields:', trek.customFields);
    console.log('GST and Gateway details:', { gst: response.gstDetails, gateway: response.gatewayDetails });
    
    // Debug the specific batch that's showing 3 participants
    const debugBatch = availableBatches.find(batch => batch._id.toString() === '6868f9c33aaf550003d8807e');
    if (debugBatch) {
      console.log(`\n=== DEBUG: Specific batch ${debugBatch._id} ===`);
      console.log(`currentParticipants: ${debugBatch.currentParticipants}`);
      console.log(`availableSpots: ${debugBatch.availableSpots}`);
    }
    
    // Debug all bookings for this trek
    console.log(`\n=== DEBUG: All bookings for trek ${trek._id} ===`);
    safeBookings.forEach(booking => {
      console.log(`Booking ${booking._id}: batch=${booking.batch}, status=${booking.status}, numberOfParticipants=${booking.numberOfParticipants}`);
    });
    
    res.json(response);
  } catch (error) {
    console.error('Error getting trek by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get trek by slug
exports.getTrekBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ message: 'Trek slug is required' });
    }
    
    // Get current date for filtering batches
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of day

    // Fetch trek by slug with populated batches and include customFields
    const trek = await Trek.findOne({ slug: slug.toLowerCase() }).select('+gstPercent +gstType +gatewayPercent +gatewayType +customFields');
    
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    // Filter batches manually to ensure proper date comparison
    trek.batches = trek.batches.filter(batch => {
      const batchStartDate = new Date(batch.startDate);
      batchStartDate.setHours(0, 0, 0, 0);
      
      return (
        // Batch hasn't started yet
        batchStartDate > currentDate &&
        // Has available spots
        batch.currentParticipants < batch.maxParticipants
      );
    });
    
    // Ensure GST and gateway details are included in the response
    const response = trek.toObject();
    response.gstDetails = {
      percent: trek.gstPercent || 0,
      type: trek.gstType || 'excluded'
    };
    response.gatewayDetails = {
      percent: trek.gatewayPercent || 0,
      type: trek.gatewayType || 'customer'
    };
    
    console.log('Trek found by slug:', trek.name);
    console.log('Available future batches:', trek.batches.length);
    console.log('Custom fields:', trek.customFields);
    console.log('GST and Gateway details:', { gst: response.gstDetails, gateway: response.gatewayDetails });
    
    res.json(response);
  } catch (error) {
    console.error('Error getting trek by slug:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get trek by custom access token
exports.getTrekByCustomToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: 'Access token is required' });
    }
    
    const trek = await Trek.findOne({ 
      customAccessToken: token,
      isCustom: true 
    }).select('+gstPercent +gstType +gatewayPercent +gatewayType +customFields');
    
    if (!trek) {
      return res.status(404).json({ message: 'Custom trek not found' });
    }
    
    // Get current date for filtering batches
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Get all bookings for this trek's batches to calculate actual current participants
    const batchIds = trek.batches
      .filter(batch => batch && batch._id)
      .map(batch => batch._id);
    
    let bookings = [];
    if (batchIds.length > 0) {
      bookings = await Booking.find({
        batch: { $in: batchIds }
      }).populate('user', 'name email');
    }

    // Safely filter bookings
    const safeBookings = bookings.filter(booking => booking != null);

    // Calculate actual current participants for each batch
    const updatedBatches = trek.batches.map(batch => {
      const batchBookings = safeBookings.filter(booking => {
        if (!booking || !booking.batch || !batch || !batch._id) {
          return false;
        }
        
        // Safe string comparison
        const bookingBatchId = booking.batch.toString ? booking.batch.toString() : String(booking.batch);
        const batchId = batch._id.toString ? batch._id.toString() : String(batch._id);
        
        return bookingBatchId === batchId;
      });
      
      // Calculate actual current participants using the same logic as getTrekPerformance
      const actualCurrentParticipants = batchBookings.reduce((sum, booking) => {
        // Only count participants from confirmed bookings
        if (booking && booking.status === 'confirmed') {
          // Count only non-cancelled participants
          const activeParticipants = booking.participantDetails ? 
            booking.participantDetails.filter(p => !p.isCancelled).length : 
            booking.numberOfParticipants || 0;
          return sum + activeParticipants;
        }
        return sum;
      }, 0);

      // Calculate available spots
      const availableSpots = Math.max(0, batch.maxParticipants - actualCurrentParticipants);
      
      return {
        ...batch.toObject(),
        currentParticipants: actualCurrentParticipants,
        availableSpots: availableSpots
      };
    });

    // Filter batches to only show future batches with available spots
    const availableBatches = updatedBatches.filter(batch => {
      const batchStartDate = new Date(batch.startDate);
      batchStartDate.setHours(0, 0, 0, 0);
      
      return (
        // Batch hasn't started yet
        batchStartDate > currentDate &&
        // Has available spots
        batch.availableSpots > 0
      );
    });
    
    // Ensure GST and gateway details are included in the response
    const response = trek.toObject();
    response.batches = availableBatches;
    response.gstDetails = {
      percent: trek.gstPercent || 0,
      type: trek.gstType || 'excluded'
    };
    response.gatewayDetails = {
      percent: trek.gatewayPercent || 0,
      type: trek.gatewayType || 'customer'
    };
    
    console.log('Custom trek found:', trek.name);
    console.log('Available future batches:', availableBatches.length);
    console.log('Custom fields:', trek.customFields);
    
    res.json(response);
  } catch (error) {
    console.error('Error getting custom trek by token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createTrek = async (req, res) => {
  try {
    console.log('Creating trek with data:', req.body);
    
    // Check for duplicate trek name
    const existingTrek = await Trek.findOne({ name: req.body.name });
    if (existingTrek) {
      return res.status(400).json({ 
        message: 'A trek with this name already exists. Please choose a different name.',
        field: 'name'
      });
    }
    
    // Get region name if region ID is provided
    let regionName = req.body.regionName || 'Unknown Region';
    if (req.body.region && !req.body.regionName) {
      try {
        const region = await Region.findById(req.body.region);
        if (region) {
          regionName = region.name;
        }
      } catch (error) {
        console.error('Error fetching region name:', error);
      }
    }
    
    // Ensure required fields are included in the request body
    const trekData = {
      ...req.body,
      itinerary: req.body.itinerary || [],
      addOns: req.body.addOns || [],
      highlights: req.body.highlights?.filter(h => h.trim()) || [], // Filter out empty highlights
      itineraryPdfUrl: req.body.itineraryPdfUrl || '',
      gstPercent: Number(req.body.gstPercent) || 0,
      gstType: req.body.gstType || 'excluded',
      gatewayPercent: Number(req.body.gatewayPercent) || 0,
      gatewayType: req.body.gatewayType || 'customer',
      regionName: regionName // Use the fetched region name
    };
    
    // Handle custom trek creation
    if (trekData.isCustom) {
      // Generate unique access token
      trekData.customAccessToken = crypto.randomBytes(32).toString('hex');
      
      // Set expiration date to 2 weeks from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);
      trekData.customLinkExpiry = expiryDate;
      
      // Create a single custom batch
      trekData.batches = [{
        startDate: new Date(),
        endDate: new Date(),
        price: trekData.displayPrice,
        maxParticipants: 999, // Large number for custom treks
        currentParticipants: 0,
        status: 'upcoming'
      }];
    }
    
    // Ensure itinerary meals are strings
    if (trekData.itinerary && Array.isArray(trekData.itinerary)) {
      trekData.itinerary = trekData.itinerary.map(day => ({
        ...day,
        meals: typeof day.meals === 'object' ? JSON.stringify(day.meals) : day.meals
      }));
    }

    // Validate highlights
    if (!trekData.highlights || !trekData.highlights.length) {
      return res.status(400).json({ message: 'At least one highlight is required' });
    }
    
    const trek = new Trek(trekData);
    await trek.save();
    
    console.log('Trek created successfully with ID:', trek._id);
    
    // If it's a custom trek, include the access token in response
    if (trek.isCustom) {
      const response = trek.toObject();
      response.customAccessUrl = `/trek/${trek.name.replace(/\s+/g, '-').toLowerCase()}?token=${trek.customAccessToken}`;
      res.status(201).json(response);
    } else {
      res.status(201).json(trek);
    }
  } catch (error) {
    console.error('Error creating trek:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateTrek = async (req, res) => {
  try {
    const trek = await Trek.findById(req.params.id);

    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    // Extract fields from req.body
    const {
      name, description, region, regionName, difficulty, duration, season, distance, maxAltitude,
      displayPrice, images, itinerary, includes, excludes, mapUrl,
      isEnabled, isFeatured, isWeekendGetaway,
      category, addOns, highlights, batches, faqs, thingsToPack,
      gstPercent, gstType, gatewayPercent, gatewayType,
      tags, itineraryPdfUrl , customFields, isCustom, partialPayment
    } = req.body;

    // Get region name if region ID is provided and regionName is not
    let finalRegionName = regionName;
    if (region && !regionName) {
      try {
        const regionDoc = await Region.findById(region);
        if (regionDoc) {
          finalRegionName = regionDoc.name;
        }
      } catch (error) {
        console.error('Error fetching region name:', error);
        finalRegionName = trek.regionName || 'Unknown Region';
      }
    }

    // Filter out empty highlights
    const filteredHighlights = highlights?.filter(h => h.trim()) || trek.highlights;

    // Validate highlights
    if (!filteredHighlights || !filteredHighlights.length) {
      return res.status(400).json({ message: 'At least one highlight is required' });
    }

    // Prepare the update data object
    const updateData = {
      name, description, region, regionName: finalRegionName,
      difficulty, duration, season, distance, maxAltitude,
      displayPrice, images, itinerary, includes, excludes, mapUrl,
      isEnabled, isFeatured, isWeekendGetaway,
      category, addOns,
      highlights: filteredHighlights,
      gstPercent: Number(gstPercent) || trek.gstPercent,
      gstType: gstType || trek.gstType,
      gatewayPercent: Number(gatewayPercent) || trek.gatewayPercent,
      gatewayType: gatewayType || trek.gatewayType,
      tags, itineraryPdfUrl,
      faqs: faqs || trek.faqs,
      thingsToPack: thingsToPack || trek.thingsToPack,
      customFields: customFields || trek.customFields,
      isCustom: isCustom !== undefined ? isCustom : trek.isCustom,
      partialPayment: partialPayment !== undefined ? partialPayment : trek.partialPayment
    };

    // Handle batches update
    if (batches && Array.isArray(batches)) {
      updateData.batches = batches.map(batch => ({
        _id: batch._id, // Preserve existing batch IDs
        startDate: batch.startDate,
        endDate: batch.endDate,
        price: Number(batch.price),
        maxParticipants: Number(batch.maxParticipants),
        currentParticipants: Number(batch.currentParticipants || 0)
      }));
    }

    // Remove undefined fields to avoid overwriting existing data with undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    console.log('Updating trek in backend with data:', updateData);

    const updatedTrek = await Trek.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTrek) {
      return res.status(404).json({ message: 'Trek not found during update' });
    }

    res.json(updatedTrek);
  } catch (error) {
    console.error('Error updating trek:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteTrek = async (req, res) => {
  try {
    const trek = await Trek.findByIdAndDelete(req.params.id);
    
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    res.json({ message: 'Trek deleted successfully' });
  } catch (error) {
    console.error('Error deleting trek:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle trek enabled status
exports.toggleTrekStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { isEnabled } = req.body;
    
    console.log('Toggle trek status request:', { id, isEnabled });
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid trek ID format' });
    }
    
    // Convert isEnabled to boolean if it's a string
    if (typeof isEnabled === 'string') {
      isEnabled = isEnabled.toLowerCase() === 'true';
    }
    
    // Validate isEnabled is a boolean
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ message: 'isEnabled must be a boolean value' });
    }
    
    // Check if trek exists
    const trek = await Trek.findById(id);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    // If enabling, check if there are batches
    if (isEnabled && (!trek.batches || trek.batches.length === 0)) {
      return res.status(400).json({ 
        message: 'Cannot enable trek without batches. Please add at least one batch first.' 
      });
    }
    
    // Update trek status using findByIdAndUpdate to ensure atomic operation
    const updatedTrek = await Trek.findByIdAndUpdate(
      id,
      { $set: { isEnabled: isEnabled } },
      { new: true, runValidators: true }
    );
    
    if (!updatedTrek) {
      return res.status(404).json({ message: 'Trek not found during update' });
    }
    
    console.log('Trek status updated:', updatedTrek);
    res.json(updatedTrek);
  } catch (error) {
    console.error('Error toggling trek status:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

exports.testToggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isEnabled, startDate, endDate } = req.body;
    
    console.log('Test toggle status request:', { id, isEnabled, startDate, endDate });
    
    // Skip validation for testing
    
    // Update the trek
    const updateData = { isEnabled };
    if (isEnabled) {
      updateData.startDate = startDate ? new Date(startDate) : null;
      updateData.endDate = endDate ? new Date(endDate) : null;
    } else {
      updateData.startDate = null;
      updateData.endDate = null;
    }
    
    console.log('Test updating trek with data:', updateData);
    
    // Check if trek exists before updating
    const existingTrek = await Trek.findById(id);
    if (!existingTrek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    const trek = await Trek.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('Trek updated successfully:', trek);
    res.json(trek);
  } catch (error) {
    console.error('Error in test toggle status:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Add a new batch to a trek
exports.addBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, price, maxParticipants } = req.body;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid trek ID format' });
    }
    
    // Validate required fields
    if (!startDate || !price) {
      return res.status(400).json({ message: 'Start date and price are required' });
    }
    
    // Validate dates
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ message: 'Invalid start date format' });
    }
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    if (parsedStartDate < currentDate) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }
    
    let parsedEndDate = null;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ message: 'Invalid end date format' });
      }
      
      if (parsedEndDate <= parsedStartDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }
    
    // Explicitly generate a new ObjectId for the batch
    const batchId = new mongoose.Types.ObjectId();
    // Create new batch
    const newBatch = {
      _id: batchId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      price: Number(price),
      maxParticipants: maxParticipants ? Number(maxParticipants) : 10,
      currentParticipants: 0,
      isFull: false
    };
    
    // Add batch to trek
    const trek = await Trek.findByIdAndUpdate(
      id,
      { 
        $push: { batches: newBatch },
        isEnabled: true // Enable the trek when adding a batch
      },
      { new: true, runValidators: true }
    );
    
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    // Return the new batch ID as well for frontend use
    res.status(201).json({ trek, batchId });
  } catch (error) {
    console.error('Error adding batch:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Remove a batch from a trek
exports.removeBatch = async (req, res) => {
  try {
    const { id, batchId } = req.params;
    
    // Validate MongoDB IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    // Remove batch from trek
    const trek = await Trek.findByIdAndUpdate(
      id,
      { $pull: { batches: { _id: batchId } } },
      { new: true }
    );
    
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    // If no batches left, disable the trek
    if (trek.batches.length === 0) {
      trek.isEnabled = false;
      await trek.save();
    }
    
    res.json(trek);
  } catch (error) {
    console.error('Error removing batch:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get treks
exports.getTreks = async (req, res) => {
  try {
    const {
      search,
      region,
      season,
      duration,
      sort,
      category,
      includeDisabled,
      showCustom
    } = req.query;

    // Build filter object
    const filter = {};

    // Only show enabled treks for non-admin users
    if (!includeDisabled) {
      filter.isEnabled = true;
    }

    // Always exclude custom treks unless showCustom=true is explicitly set
    if (!showCustom || showCustom === 'false') {
      filter.isCustom = { $ne: true };
    } else if (showCustom === 'true') {
      filter.isCustom = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (region) filter.regionName = region;
    if (season) filter.season = season;
    if (duration) {
      // Parse duration range
      const [min, max] = duration.split('-').map(Number);
      if (min === max) {
        // For exact matches (e.g., "1-1", "2-2")
        filter.duration = min;
      } else if (max) {
        // For ranges (e.g., "2-5", "15-100")
        filter.duration = { $gte: min, $lte: max };
      } else {
        // Fallback case
        filter.duration = { $gte: min };
      }
    }
    if (category) filter.category = category;

    // Get current date
    const currentDate = new Date();

    // Fetch treks with populated batches and include GST/gateway fields
    let treks = await Trek.find(filter)
      .select('+gstPercent +gstType +gatewayPercent +gatewayType +customAccessToken')
      .populate({
        path: 'batches',
        match: !req.user?.isAdmin ? {
          endDate: { $gt: currentDate },
          $expr: { 
            $lt: ["$currentParticipants", "$maxParticipants"] 
          }
        } : {}
      })
      .sort(sort === 'price' ? { displayPrice: 1 } : { createdAt: -1 });

    // Filter out treks with no available batches for non-admin users
    if (!req.user?.isAdmin) {
      treks = treks.filter(trek => trek.batches.length > 0);
    }

    // Format response to include GST and gateway details
    const formattedTreks = treks.map(trek => {
      const trekObj = trek.toObject();
      trekObj.gstDetails = {
        percent: trek.gstPercent || 0,
        type: trek.gstType || 'excluded'
      };
      trekObj.gatewayDetails = {
        percent: trek.gatewayPercent || 0,
        type: trek.gatewayType || 'customer'
      };
      return trekObj;
    });

    res.json(formattedTreks);
  } catch (error) {
    console.error('Error in getTreks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get treks by region
exports.getTreksByRegion = async (req, res) => {
  try {
    const { region } = req.query;
    console.log('Fetching treks for region:', region);
    
    if (!region) {
      return res.status(400).json({ message: 'Region ID is required' });
    }
    
    const treks = await Trek.find({ 
      regionName: region, 
      isEnabled: true 
    }).select('name regionName location coverImage');
    
    console.log(`Found ${treks.length} treks for region ${region}`);
    res.json(treks);
  } catch (error) {
    console.error('Error fetching treks by region:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get treks by exact region ID match
exports.getTreksByExactRegion = async (req, res) => {
  try {
    const regionId = req.params.regionId;
    console.log('Fetching treks for exact region ID match:', regionId);
    
    if (!regionId) {
      return res.status(400).json({ message: 'Region ID is required' });
    }
    
    // Use strict equality with the region name
    const treks = await Trek.find({ 
      regionName: regionId,
      isEnabled: true 
    }).select('name regionName location coverImage');
    
    console.log(`Found ${treks.length} treks for exact region ${regionId}`);
    res.json(treks);
  } catch (error) {
    console.error('Error fetching treks by exact region:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get weekend getaways
exports.getWeekendGetaways = async (req, res) => {
  try {
    console.log('Received weekend getaways request with query:', req.query);
    
    // Check if Trek model is properly defined
    if (!Trek) {
      console.error('Trek model is not defined');
      return res.status(500).json({ message: 'Trek model is not defined' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    // Build query for weekend getaways
    const query = { 
      isWeekendGetaway: true,
      isEnabled: true 
    };
    
    console.log('Weekend getaway query:', JSON.stringify(query));
    
    // Find weekend getaways with limit
    const weekendGetaways = await Trek.find(query)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    console.log(`Found ${weekendGetaways ? weekendGetaways.length : 0} weekend getaways`);
    
    // Return response
    return res.json({
      weekendGetaways: weekendGetaways || [],
      total: weekendGetaways ? weekendGetaways.length : 0,
      limit: limit
    });
  } catch (error) {
    console.error('Error getting weekend getaways:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: error.stack
    });
  }
};

// Toggle weekend getaway status
exports.toggleWeekendGetaway = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Toggling weekend getaway for trek ID: ${id}`);
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid trek ID format' });
    }
    
    const { isWeekendGetaway, weekendHighlights, transportation, departureTime, returnTime, meetingPoint } = req.body;
    
    const trek = await Trek.findById(id);
    
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    // Update weekend getaway fields
    trek.isWeekendGetaway = isWeekendGetaway;
    
    if (isWeekendGetaway) {
      trek.weekendHighlights = weekendHighlights || trek.weekendHighlights;
      trek.transportation = transportation || trek.transportation;
      trek.departureTime = departureTime || trek.departureTime;
      trek.returnTime = returnTime || trek.returnTime;
      trek.meetingPoint = meetingPoint || trek.meetingPoint;
    }
    
    await trek.save();
    
    res.json({
      message: `Trek ${isWeekendGetaway ? 'added to' : 'removed from'} weekend getaways`,
      trek
    });
  } catch (error) {
    console.error('Error toggling weekend getaway status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add this method to your trekController.js file
exports.updateBatch = async (req, res) => {
  try {
    const { id: trekId, batchId } = req.params;
    const updateData = req.body;
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    const batch = trek.batches.id(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    // Update only provided fields
    Object.keys(updateData).forEach(key => {
      batch[key] = updateData[key];
    });
    await trek.save();
    res.json(batch);
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add this method to your trekController.js file
exports.deleteBatch = async (req, res) => {
  try {
    const { id, batchId } = req.params;
    
    console.log(`Deleting batch ${batchId} from trek ${id}`);
    
    const trek = await Trek.findById(id);
    
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    // Find the batch to delete
    const batchIndex = trek.batches.findIndex(batch => batch._id.toString() === batchId);
    
    if (batchIndex === -1) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    // Remove the batch from the array
    trek.batches.splice(batchIndex, 1);
    
    await trek.save();
    
    res.json({
      message: 'Batch deleted successfully',
      trekId: id
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get weekend getaway details
exports.getWeekendGetawayDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const trek = await Trek.findById(id);
    
    if (!trek) {
      return res.status(404).json({ message: 'Weekend getaway not found' });
    }
    
    if (!trek.isWeekendGetaway) {
      return res.status(400).json({ message: 'This trek is not a weekend getaway' });
    }
    
    res.json(trek);
  } catch (error) {
    console.error('Error fetching weekend getaway details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all weekend getaway galleries
exports.getWeekendGetawayGalleries = async (req, res) => {
  try {
    const weekendGetaways = await Trek.find({ 
      isWeekendGetaway: true,
      isEnabled: true
    }).select('name gallery');
    
    res.json(weekendGetaways);
  } catch (error) {
    console.error('Error fetching weekend getaway galleries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all weekend getaway mini blogs
exports.getWeekendGetawayBlogs = async (req, res) => {
  try {
    const weekendGetaways = await Trek.find({ 
      isWeekendGetaway: true,
      isEnabled: true,
      miniBlogs: { $exists: true, $ne: [] }
    }).select('name miniBlogs');
    
    // Flatten all mini blogs into a single array with trek info
    const blogs = weekendGetaways.reduce((acc, trek) => {
      const trekBlogs = trek.miniBlogs.map(blog => ({
        ...blog.toObject(),
        trekId: trek._id,
        trekName: trek.name
      }));
      return [...acc, ...trekBlogs];
    }, []);
    
    // Sort by date descending
    blogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching weekend getaway blogs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all weekend getaway activities
exports.getWeekendGetawayActivities = async (req, res) => {
  try {
    const weekendGetaways = await Trek.find({ 
      isWeekendGetaway: true,
      isEnabled: true,
      activities: { $exists: true, $ne: [] }
    }).select('name activities');
    
    // Flatten all activities into a single array with trek info
    const activities = weekendGetaways.reduce((acc, trek) => {
      const trekActivities = trek.activities.map(activity => ({
        ...activity.toObject(),
        trekId: trek._id,
        trekName: trek.name
      }));
      return [...acc, ...trekActivities];
    }, []);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching weekend getaway activities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update weekend getaway gallery
exports.updateWeekendGetawayGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { gallery } = req.body;
    
    const trek = await Trek.findById(id);
    
    if (!trek) {
      return res.status(404).json({ message: 'Weekend getaway not found' });
    }
    
    if (!trek.isWeekendGetaway) {
      return res.status(400).json({ message: 'This trek is not a weekend getaway' });
    }
    
    trek.gallery = gallery;
    await trek.save();
    
    res.json(trek);
  } catch (error) {
    console.error('Error updating weekend getaway gallery:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get batch performance data
exports.getBatchPerformance = async (req, res) => {
  console.log("meow meow meow meow meow meow meow meow meow meow");
  try {
    console.log('Batch performance - req.params:', req.params);
    
    // The route uses :id and :batchId, so we need to extract them correctly
    const trekId = req.params.id; // Changed from req.params.trekId
    const batchId = req.params.batchId;

    console.log('Extracted IDs - trekId:', trekId, 'batchId:', batchId);

    // Validate input parameters
    if (!trekId || !batchId) {
      return res.status(400).json({ message: 'Trek ID and Batch ID are required' });
    }

    // Find the trek and the specific batch
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    console.log('Trek found:', trek.name);
    console.log('Trek customFields:', trek.customFields);
    console.log('Trek customFields length:', trek.customFields?.length);

    if (!trek.batches || !Array.isArray(trek.batches)) {
      return res.status(404).json({ message: 'No batches found for this trek' });
    }

    const batch = trek.batches.id(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Get all bookings for this batch
    const bookings = await Booking.find({
      trek: trekId,
      batch: batchId
    }).populate('user', 'name email phone');

    console.log('Raw bookings found:', bookings.length);
    console.log('Booking statuses:', bookings.map(b => ({ id: b._id, status: b.status })));

    // Safely filter bookings
    const safeBookings = bookings.filter(booking => booking != null);
    
    console.log('Safe bookings count:', safeBookings.length);
    console.log('Safe booking statuses:', safeBookings.map(b => ({ id: b._id, status: b.status })));

    // Calculate performance metrics with null safety
    const performanceData = {
      trek: {
        _id: trek._id,
        name: trek.name,
        customFields: trek.customFields || []
      },
      batchDetails: {
        startDate: batch.startDate || null,
        endDate: batch.endDate || null,
        price: batch.price || 0,
        maxParticipants: batch.maxParticipants || 0,
        status: batch.status || 'unknown'
      },
      bookings: {
        total: safeBookings.length,
        confirmed: safeBookings.filter(b => b && b.status === 'confirmed').length,
        cancelled: safeBookings.filter(b => b && b.status === 'cancelled').length,
        completed: safeBookings.filter(b => b && b.status === 'completed').length,
        pending_payment: safeBookings.filter(b => b && b.status === 'pending_payment').length
      },
      revenue: {
        total: safeBookings.reduce((sum, booking) => {
          // Calculate actual amount paid based on payment mode
          let paid = 0;
          if (booking && booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
            if (booking.status === 'payment_confirmed_partial') {
              // For partial payments in progress, use initial payment amount
              paid = booking.partialPaymentDetails.initialAmount || 0;
            } else if (booking.status === 'confirmed') {
              // For completed partial payments, use total amount
              paid = booking.totalPrice || 0;
            } else {
              // For other statuses, use total amount
              paid = booking.totalPrice || 0;
            }
          } else {
            // For full payments, use total amount
            paid = booking && booking.totalPrice ? booking.totalPrice : 0;
          }
          
          // Only subtract refunds if they were successfully processed
          let refunded = 0;
          if (booking && booking.refundStatus === 'success') {
            refunded += booking.refundAmount || 0;
          }
          // Participant-level refunds (for partial cancellations) - only successful ones
          if (booking && Array.isArray(booking.participantDetails)) {
            refunded += booking.participantDetails.reduce((rSum, p) => {
              if (p.refundStatus === 'success') {
                return rSum + (p.refundAmount || 0);
              }
              return rSum;
            }, 0);
          }
          return sum + (paid - refunded);
        }, 0),
        confirmed: safeBookings
          .filter(b => b && b.status === 'confirmed')
          .reduce((sum, booking) => {
            // Calculate actual amount paid based on payment mode
            let paid = 0;
            if (booking && booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
              // For completed partial payments, use total amount
              paid = booking.totalPrice || 0;
            } else {
              // For full payments, use total amount
              paid = booking && booking.totalPrice ? booking.totalPrice : 0;
            }
            
            // Only subtract refunds if they were successfully processed
            let refunded = 0;
            if (booking && booking.refundStatus === 'success') {
              refunded += booking.refundAmount || 0;
            }
            if (booking && Array.isArray(booking.participantDetails)) {
              refunded += booking.participantDetails.reduce((rSum, p) => {
                if (p.refundStatus === 'success') {
                  return rSum + (p.refundAmount || 0);
                }
                return rSum;
              }, 0);
            }
            return sum + (paid - refunded);
          }, 0),
        cancelled: safeBookings
          .filter(b => b && b.status === 'cancelled')
          .reduce((sum, booking) => {
            // Calculate actual amount paid based on payment mode
            let paid = 0;
            if (booking && booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
              if (booking.status === 'payment_confirmed_partial') {
                // For cancelled partial payments, use initial payment amount
                paid = booking.partialPaymentDetails.initialAmount || 0;
              } else {
                // For other cancelled statuses, use total amount
                paid = booking.totalPrice || 0;
              }
            } else {
              // For full payments, use total amount
              paid = booking && booking.totalPrice ? booking.totalPrice : 0;
            }
            
            // Only subtract refunds if they were successfully processed
            let refunded = 0;
            if (booking && booking.refundStatus === 'success') {
              refunded += booking.refundAmount || 0;
            }
            if (booking && Array.isArray(booking.participantDetails)) {
              refunded += booking.participantDetails.reduce((rSum, p) => {
                if (p.refundStatus === 'success') {
                  return rSum + (p.refundAmount || 0);
                }
                return rSum;
              }, 0);
            }
            return sum + (paid - refunded);
          }, 0)
      },
      participants: {
        total: safeBookings.reduce((sum, booking) => {
          if (!booking) return sum;
          
          if (booking.status === 'payment_completed') {
            // For payment_completed bookings, use numberOfParticipants directly
            return sum + (booking.numberOfParticipants || 0);
          } else if (booking.status === 'confirmed') {
            // For confirmed bookings, check participantDetails and count non-cancelled participants
            if (booking.participantDetails && Array.isArray(booking.participantDetails)) {
              const activeParticipants = booking.participantDetails.filter(p => !p.isCancelled).length;
              return sum + activeParticipants;
            } else {
              // Fallback to numberOfParticipants if no participantDetails
              return sum + (booking.numberOfParticipants || 0);
            }
          }
          
          return sum;
        }, 0),
        confirmed: safeBookings
          .filter(b => b && b.status === 'confirmed')
          .reduce((sum, booking) => {
            // For confirmed bookings, check participantDetails and count non-cancelled participants
            if (booking.participantDetails && Array.isArray(booking.participantDetails)) {
              const activeParticipants = booking.participantDetails.filter(p => !p.isCancelled).length;
              return sum + activeParticipants;
            } else {
              // Fallback to numberOfParticipants if no participantDetails
              return sum + (booking.numberOfParticipants || 0);
            }
          }, 0),
        cancelled: safeBookings
          .filter(b => b && b.status === 'cancelled')
          .reduce((sum, booking) => {
            // Count cancelled participants
            const cancelledParticipants = booking && booking.participantDetails ? 
              booking.participantDetails.filter(p => p.isCancelled).length : 
              (booking && booking.numberOfParticipants ? booking.numberOfParticipants : 0);
            return sum + cancelledParticipants;
          }, 0)
      },
      bookingDetails: (() => {
        const details = safeBookings
          .filter(booking => booking && booking.status !== 'pending_payment') // Exclude pending_payment bookings
          .map(booking => {
            if (!booking) return null;
            
            // Calculate actual amount paid based on payment mode
            let amountPaid = 0;
            if (booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
              if (booking.status === 'payment_confirmed_partial') {
                amountPaid = booking.partialPaymentDetails.initialAmount || 0;
              } else if (booking.status === 'confirmed') {
                amountPaid = booking.totalPrice || 0;
              } else {
                amountPaid = booking.totalPrice || 0;
              }
            } else {
              amountPaid = booking.totalPrice || 0;
            }
            
            return {
              bookingId: booking._id || null,
              user: {
                name: booking.user?.name || 'N/A',
                email: booking.user?.email || 'N/A',
                phone: booking.user?.phone || 'N/A'
              },
              participants: booking.numberOfParticipants || 0,
              participantDetails: booking.participantDetails || [],
              totalPrice: booking.totalPrice || 0,
              amountPaid: amountPaid,
              paymentMode: booking.paymentMode || 'full',
              partialPaymentDetails: booking.partialPaymentDetails || null,
              status: booking.status || 'unknown',
              bookingDate: booking.createdAt || null,
              adminRemarks: booking.adminRemarks || '',
              cancellationRequest: booking.cancellationRequest || null,
              refundStatus: booking.refundStatus || null,
              refundAmount: booking.refundAmount || 0
            };
          }).filter(detail => detail !== null);
        
        console.log('Booking details count (excluding pending_payment):', details.length);
        console.log('Booking details statuses:', details.map(d => ({ id: d.bookingId, status: d.status })));
        
        return details;
      })(),
      feedback: batch.feedback || []
    };

    console.log('Performance data trek.customFields:', performanceData.trek.customFields);
    console.log('Performance data trek.customFields length:', performanceData.trek.customFields.length);
    
    // Log final summary
    console.log('Final response summary:', {
      totalBookings: performanceData.bookings.total,
      bookingDetailsCount: performanceData.bookingDetails.length,
      bookingStatuses: performanceData.bookings
    });

    res.json(performanceData);
  } catch (error) {
    console.error('Error getting batch performance:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get trek performance data
exports.getTrekPerformance = async (req, res) => {
  try {
    console.log('Getting trek performance for ID:', req.params.id);

    console.log("meow meow meow meow meow meow meow meow meow meow");
    
    // Validate input parameter
    if (!req.params.id) {
      return res.status(400).json({ message: 'Trek ID is required' });
    }
    
    const trek = await Trek.findById(req.params.id);
    
    if (!trek) {
      console.log('Trek not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Trek not found' });
    }

    console.log('Found trek:', trek.name);
    
    // Check if trek has batches
    if (!trek.batches || !Array.isArray(trek.batches)) {
      console.log('No batches found for trek');
      return res.json({
        trek: {
          _id: trek._id,
          name: trek.name
        },
        totalRevenue: 0,
        totalBookings: 0,
        averageRating: trek.averageRating || 0,
        batches: []
      });
    }

    console.log('Number of batches:', trek.batches.length);

    // Get all bookings for this trek's batches - with null safety
    const batchIds = trek.batches
      .filter(batch => batch && batch._id)
      .map(batch => batch._id);
    
    if (batchIds.length === 0) {
      console.log('No valid batch IDs found');
      return res.json({
        trek: {
          _id: trek._id,
          name: trek.name
        },
        totalRevenue: 0,
        totalBookings: 0,
        averageRating: trek.averageRating || 0,
        batches: []
      });
    }

    const bookings = await Booking.find({
      batch: { $in: batchIds }
    }).populate('user', 'name email');

    console.log('Number of bookings found:', bookings.length);

    // Safely filter bookings
    const safeBookings = bookings.filter(booking => booking != null);

    // Calculate total revenue and bookings with null safety
    const totalRevenue = safeBookings.reduce((sum, booking) => {
      // Calculate actual amount paid based on payment mode
      let paid = 0;
      if (booking && booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
        if (booking.status === 'payment_confirmed_partial') {
          // For partial payments in progress, use initial payment amount
          paid = booking.partialPaymentDetails.initialAmount || 0;
        } else if (booking.status === 'confirmed') {
          // For completed partial payments, use total amount
          paid = booking.totalPrice || 0;
        } else {
          // For other statuses, use total amount
          paid = booking.totalPrice || 0;
        }
      } else {
        // For full payments, use total amount
        paid = booking && booking.totalPrice ? booking.totalPrice : 0;
      }
      
      // Only subtract refunds if they were successfully processed
      let refunded = 0;
      if (booking && booking.refundStatus === 'success') {
        refunded += booking.refundAmount || 0;
      }
      // Participant-level refunds (for partial cancellations) - only successful ones
      if (booking && Array.isArray(booking.participantDetails)) {
        refunded += booking.participantDetails.reduce((rSum, p) => {
          if (p.refundStatus === 'success') {
            return rSum + (p.refundAmount || 0);
          }
          return rSum;
        }, 0);
      }
      return sum + (paid - refunded);
    }, 0);
    const totalBookings = safeBookings.length;

    // Calculate batch-specific metrics with comprehensive null checks
    const batchPerformance = trek.batches
      .filter(batch => batch != null && batch._id != null)
      .map(batch => {
        try {
          const batchBookings = safeBookings.filter(booking => {
            if (!booking || !booking.batch || !batch || !batch._id) {
              return false;
            }
            
            // Safe string comparison
            const bookingBatchId = booking.batch.toString ? booking.batch.toString() : String(booking.batch);
            const batchId = batch._id.toString ? batch._id.toString() : String(batch._id);
            
            return bookingBatchId === batchId;
          });
          
          const revenue = batchBookings.reduce((sum, booking) => {
            // Calculate actual amount paid based on payment mode
            let paid = 0;
            if (booking && booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
              if (booking.status === 'payment_confirmed_partial') {
                // For partial payments in progress, use initial payment amount
                paid = booking.partialPaymentDetails.initialAmount || 0;
              } else if (booking.status === 'confirmed') {
                // For completed partial payments, use total amount
                paid = booking.totalPrice || 0;
              } else {
                // For other statuses, use total amount
                paid = booking.totalPrice || 0;
              }
            } else {
              // For full payments, use total amount
              paid = booking && booking.totalPrice ? booking.totalPrice : 0;
            }
            
            // Only subtract refunds if they were successfully processed
            let refunded = 0;
            if (booking && booking.refundStatus === 'success') {
              refunded += booking.refundAmount || 0;
            }
            if (booking && Array.isArray(booking.participantDetails)) {
              refunded += booking.participantDetails.reduce((rSum, p) => {
                if (p.refundStatus === 'success') {
                  return rSum + (p.refundAmount || 0);
                }
                return rSum;
              }, 0);
            }
            return sum + (paid - refunded);
          }, 0);
          
          const currentParticipants = batchBookings.reduce((sum, booking) => {
            if (!booking) return sum;
            
            if (booking.status === 'payment_completed') {
              // For payment_completed bookings, use numberOfParticipants directly
              return sum + (booking.numberOfParticipants || 0);
            } else if (booking.status === 'confirmed') {
              // For confirmed bookings, check participantDetails and count non-cancelled participants
              if (booking.participantDetails && Array.isArray(booking.participantDetails)) {
                const activeParticipants = booking.participantDetails.filter(p => !p.isCancelled).length;
                return sum + activeParticipants;
              } else {
                // Fallback to numberOfParticipants if no participantDetails
                return sum + (booking.numberOfParticipants || 0);
              }
            }
            
            return sum;
          }, 0);

          let status = 'upcoming';
          try {
            const now = new Date();
            if (batch.endDate && new Date(batch.endDate) < now) {
              status = 'completed';
            } else if (batch.startDate && new Date(batch.startDate) <= now) {
              status = 'ongoing';
            }
          } catch (dateError) {
            console.log('Date parsing error:', dateError);
            status = 'unknown';
          }

          return {
            _id: batch._id,
            startDate: batch.startDate || null,
            endDate: batch.endDate || null,
            price: batch.price || 0,
            maxParticipants: batch.maxParticipants || 0,
            currentParticipants,
            revenue,
            status,
            bookingsCount: batchBookings.length
          };
        } catch (batchError) {
          console.error('Error processing batch:', batchError);
          return {
            _id: batch._id || null,
            startDate: null,
            endDate: null,
            price: 0,
            maxParticipants: 0,
            currentParticipants: 0,
            revenue: 0,
            status: 'error',
            bookingsCount: 0
          };
        }
      });

    const response = {
      trek: {
        _id: trek._id,
        name: trek.name || 'Unknown Trek'
      },
      totalRevenue,
      totalBookings,
      averageRating: trek.averageRating || 0,
      batches: batchPerformance
    };

    console.log('Sending performance response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error getting trek performance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export batch participants to PDF
exports.exportBatchParticipants = async (req, res) => {
  try {
    console.log('Export participants - req.params:', req.params);
    console.log('Export participants - req.query:', req.query);
    
    const trekId = req.params.id;
    const batchId = req.params.batchId;
    const { fields, fileType = 'pdf' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(trekId) || !mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: 'Invalid trek or batch ID format' });
    }

    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    const batch = trek.batches.id(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Get all bookings for this batch
    const bookings = await Booking.find({ batch: batchId })
      .populate('user', 'name email phone');
    
    console.log('Found bookings:', bookings.length);
    console.log('Sample booking:', bookings[0]);

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No participants found for this batch' });
    }

    // Count bookings by status for logging
    const bookingStatusCounts = {};
    bookings.forEach(booking => {
      bookingStatusCounts[booking.status] = (bookingStatusCounts[booking.status] || 0) + 1;
    });
    console.log('Booking status distribution:', bookingStatusCounts);

    // Parse fields parameter
    const selectedFields = fields ? fields.split(',') : [];

    // Build headers
    const headers = selectedFields.map(field => {
      switch (field) {
        case 'participantName': return 'Participant Name';
        case 'participantAge': return 'Age';
        case 'participantGender': return 'Gender';
        case 'contactNumber': return 'Contact Number';
        case 'emergencyContactName': return 'Emergency Contact Name';
        case 'emergencyContactPhone': return 'Emergency Contact Phone';
        case 'emergencyContactRelation': return 'Emergency Contact Relation';
        case 'medicalConditions': return 'Medical Conditions';
        case 'specialRequests': return 'Special Requests';
        case 'bookingUserName': return 'Booking User Name';
        case 'bookingUserEmail': return 'Booking User Email';
        case 'bookingUserPhone': return 'Booking User Phone';
        case 'bookingDate': return 'Booking Date';
        case 'status': return 'Booking Status';
        case 'bookingStatus': return 'Booking Status';
        case 'totalPrice': return 'Total Price';

        case 'additionalRequests': return 'Additional Requests';
        default:
          // Custom fields - use the field name as header
          if (field.startsWith('custom_')) {
            const customFieldKey = field.replace('custom_', '');
            const customField = trek.customFields?.find(f => f.fieldName === customFieldKey);
            return customField?.fieldName || customFieldKey;
          }
          return field;
      }
    });

    const tableData = [headers];
    
    let totalParticipantsProcessed = 0;
    let cancelledBookingsSkipped = 0;
    let cancelledParticipantsSkipped = 0;

    bookings.forEach(booking => {
      console.log('Processing booking:', booking._id);
      console.log('Booking status:', booking.status);
      console.log('Participant details:', booking.participantDetails);
      
      // Booking-level check: Skip cancelled bookings
      if (booking.status === 'cancelled') {
        console.log('Skipping cancelled booking:', booking._id);
        cancelledBookingsSkipped++;
        return;
      }
      
      if (booking.participantDetails && Array.isArray(booking.participantDetails)) {
        booking.participantDetails.forEach(participant => {
          console.log('Processing participant:', participant);
          
          // Participant-level check: Skip cancelled participants
          if (participant.isCancelled === true) {
            console.log('Skipping cancelled participant:', participant.name);
            cancelledParticipantsSkipped++;
            return;
          }
          
          const row = selectedFields.map(field => {
            switch (field) {
              case 'participantName':
                return participant.name || 'N/A';
              case 'participantAge':
                return participant.age || 'N/A';
              case 'participantGender':
                return participant.gender || 'N/A';
              case 'participantPhone':
                // Check multiple possible field names for phone
                console.log('Looking for phone in participant:', {
                  contactNumber: participant.contactNumber,
                  phone: participant.phone,
                  contactPhone: participant.contactPhone,
                  allKeys: Object.keys(participant)
                });
                return participant.phone || participant.contactNumber || 'N/A';
              case 'emergencyContactName':
                return booking.emergencyContact?.name || 'N/A';
              case 'emergencyContactPhone':
                return booking.emergencyContact?.phone || 'N/A';
              case 'emergencyContactRelation':
                return booking.emergencyContact?.relation || 'N/A';
              case 'medicalConditions':
                return participant.allergies || participant.medicalConditions || 'N/A';
              case 'specialRequests':
                return participant.extraComment || participant.specialRequests || 'N/A';
              case 'bookingUserName':
                return booking.user?.name || 'N/A';
              case 'bookingUserEmail':
                return booking.user?.email || 'N/A';
              case 'bookingUserPhone':
                return booking.user?.phone || 'N/A';
              case 'bookingDate':
                return booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A';
              case 'bookingStatus':
                return booking.status || 'N/A';
              case 'totalPrice':
                return booking.totalPrice || 'N/A';

              case 'additionalRequests':
                return booking.additionalRequests || 'N/A';
              default:
                // Handle custom fields
                if (field.startsWith('custom_')) {
                  const customFieldKey = field.replace('custom_', '');
                  const customField = trek.customFields?.find(f => f.fieldName === customFieldKey);
                  console.log('Processing custom field:', customFieldKey, 'Found field:', customField);
                  
                  if (customField) {
                    let value = null;
                    
                    // First try to get from customFields Map
                    if (participant.customFields && participant.customFields instanceof Map) {
                      value = participant.customFields.get(customFieldKey);
                      console.log('Found custom field value from Map:', value);
                    }
                    
                    // If not found in Map, try customFields object
                    if (!value && participant.customFields && typeof participant.customFields === 'object') {
                      value = participant.customFields[customFieldKey];
                      console.log('Found custom field value from object:', value);
                    }
                    
                    // Fallback to customFieldResponses array
                    if (!value && participant.customFieldResponses) {
                      const customFieldResponse = participant.customFieldResponses.find(f => 
                        f.fieldId === customFieldKey || f.fieldName === customFieldKey
                      );
                      console.log('Found custom field response:', customFieldResponse);
                      value = customFieldResponse?.value;
                    }
                    
                    // Handle array values (for checkbox fields)
                    if (Array.isArray(value)) {
                      return value.join(', ') || 'N/A';
                    }
                    
                    return value || 'N/A';
                  }
                }
                return 'N/A';
            }
          });
          tableData.push(row);
          totalParticipantsProcessed++;
        });
      } else {
        // No participants, export booking-level info (only for non-cancelled bookings)
        // Note: This case is already handled by the booking-level check above
        // But we'll keep this for completeness in case the booking has no participantDetails
        const row = selectedFields.map(field => {
          switch (field) {
            case 'bookingUserName':
              return booking.user?.name || 'N/A';
            case 'bookingUserEmail':
              return booking.user?.email || 'N/A';
            case 'bookingUserPhone':
              return booking.user?.phone || 'N/A';
            case 'bookingDate':
              return booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A';
            case 'status':
              return booking.status || 'N/A';
            case 'totalPrice':
              return booking.totalPrice || 'N/A';

            case 'additionalRequests':
              return booking.additionalRequests || 'N/A';
            default:
              return 'N/A';
          }
        });
        tableData.push(row);
      }
    });

    // Log export summary
    console.log('Export summary:', {
      totalBookings: bookings.length,
      cancelledBookingsSkipped,
      cancelledParticipantsSkipped,
      totalParticipantsProcessed,
      totalRowsExported: tableData.length - 1 // Subtract header row
    });

    // Check if we have any data to export after filtering
    if (tableData.length <= 1) {
      return res.status(404).json({ 
        message: 'No active participants found for this batch after filtering cancelled bookings and participants' 
      });
    }

    // Generate file based on fileType
    if (fileType === 'csv') {
      // Generate CSV
      const filename = `batch-participants-${trek.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Convert table data to CSV format
      const csvContent = tableData.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');

      res.send(csvContent);
    } else {
      // Generate PDF (default)
      const PDFDocument = require('pdfkit-table');
      const doc = new PDFDocument({ margin: 30 });

      // Set response headers
      const filename = `batch-participants-${trek.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Pipe PDF to response
      doc.pipe(res);

      // Add header
      doc.fontSize(18).text(`${trek.name} - Batch Participants`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Batch: ${new Date(batch.startDate).toLocaleDateString()} - ${new Date(batch.endDate).toLocaleDateString()}`, { align: 'center' });
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Add table
      const table = {
        headers: headers,
        rows: tableData.slice(1) // Skip header row
      };

      await doc.table(table, {
        prepareHeader: () => doc.fontSize(8),
        prepareRow: () => doc.fontSize(7)
      });

      doc.end();
    }

  } catch (error) {
    console.error('Error exporting batch participants:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send custom trek link via email
exports.sendCustomTrekLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Only allow admin (assume req.user.isAdmin is set by auth middleware)
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const trek = await Trek.findById(id);
    if (!trek || !trek.isCustom) {
      return res.status(404).json({ message: 'Custom trek not found' });
    }

    // Generate booking link
    const bookingLink = `${process.env.FRONTEND_URL || 'https://yourfrontend.com'}/custom-trek/${trek._id}`;

    // Get region name (handle both populated and ID cases)
    let regionName = 'N/A';
    if (trek.region && typeof trek.region === 'object' && trek.region.name) {
      regionName = trek.region.name;
    } else if (typeof trek.region === 'string') {
      regionName = trek.region;
    }

    // Compose HTML email (modern, banner, mobile-friendly, agency branding, no <style> tag)
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(16,185,129,0.10); overflow: hidden;">
        <div style="background: #10b981; padding: 18px 0; text-align: center;">
          <span style="color: #fff; font-size: 1.6rem; font-weight: bold; letter-spacing: 1px;">Bengaluru Trekkers</span>
        </div>
        <img src="${trek.imageUrl || (trek.images && trek.images[0]) || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'}" alt="${trek.name}" style="width: 100%; max-height: 280px; object-fit: cover; display: block;">
        <div style="padding: 24px 12px 20px 12px;">
          <h2 style="color: #10b981; font-size: 2rem; margin-bottom: 8px; font-weight: bold;">${trek.name}</h2>
          <p style="color: #374151; margin-bottom: 18px; font-size: 1.1rem; line-height: 1.6;">${trek.description || ''}</p>
          <div style="margin-bottom: 18px;">
            <span style="display: inline-block; background: #f3f4f6; color: #10b981; border-radius: 6px; padding: 4px 12px; font-size: 0.95rem; margin-right: 8px;">${regionName}</span>
            <span style="display: inline-block; background: #f3f4f6; color: #6366f1; border-radius: 6px; padding: 4px 12px; font-size: 0.95rem; margin-right: 8px;">${trek.difficulty}</span>
            <span style="display: inline-block; background: #f3f4f6; color: #f59e42; border-radius: 6px; padding: 4px 12px; font-size: 0.95rem;">${trek.duration} days</span>
          </div>
          <div style="margin-bottom: 18px;">
            <div style="margin-bottom: 8px;"><strong>Price:</strong> ₹${trek.displayPrice}</div>
            <div style="margin-bottom: 8px;"><strong>Best Season:</strong> ${trek.season || 'N/A'}</div>
            <div style="margin-bottom: 8px;"><strong>Highlights:</strong> ${Array.isArray(trek.highlights) ? trek.highlights.join(', ') : ''}</div>
          </div>
          <a href="${bookingLink}" style="display: block; width: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); color: #fff; padding: 18px 0; border-radius: 10px; text-decoration: none; font-size: 1.2rem; font-weight: bold; text-align: center; margin-top: 18px; box-shadow: 0 2px 8px rgba(16,185,129,0.10); max-width: 100%;">Book Your Private Trek Now</a>
        </div>
        <div style="background: #f3f4f6; text-align: center; padding: 18px 0; color: #6b7280; font-size: 1rem; border-radius: 0 0 16px 16px;">
          &copy; ${new Date().getFullYear()} Bengaluru Trekkers
        </div>
      </div>
    `;

    const subject = `Your Custom Trek: ${trek.name}`;
    const text = `You have been invited to a private trek: ${trek.name}\n\nDetails:\nRegion: ${trek.region?.name || trek.region}\nDuration: ${trek.duration} days\nDifficulty: ${trek.difficulty}\nPrice: ₹${trek.displayPrice}\nHighlights: ${(trek.highlights || []).join(', ')}\n\nBooking link: ${bookingLink}`;

    // Send email
    const { sendEmail } = require('../utils/email');
    const result = await sendEmail({ to: email, subject, text, html });
    if (!result) return res.status(500).json({ message: 'Failed to send email' });
    res.json({ message: 'Custom trek link sent successfully' });
  } catch (error) {
    console.error('Error sending custom trek link:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 

// Recalculate batch participant counts for a trek
exports.recalculateBatchParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid trek ID format' });
    }
    
    const trek = await Trek.findById(id);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    if (!trek.batches || trek.batches.length === 0) {
      return res.status(400).json({ message: 'No batches found for this trek' });
    }
    
    const { updateBatchParticipantCount } = require('../utils/batchUtils');
    const results = [];
    
    // Recalculate participant counts for all batches
    for (const batch of trek.batches) {
      try {
        const newCount = await updateBatchParticipantCount(trek._id, batch._id);
        results.push({
          batchId: batch._id,
          batchName: `${new Date(batch.startDate).toLocaleDateString()} - ${new Date(batch.endDate).toLocaleDateString()}`,
          oldCount: batch.currentParticipants,
          newCount: newCount,
          status: 'success'
        });
      } catch (error) {
        console.error(`Error updating batch ${batch._id}:`, error);
        results.push({
          batchId: batch._id,
          batchName: `${new Date(batch.startDate).toLocaleDateString()} - ${new Date(batch.endDate).toLocaleDateString()}`,
          oldCount: batch.currentParticipants,
          newCount: null,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({
      message: 'Batch participant counts recalculated',
      trek: {
        _id: trek._id,
        name: trek.name
      },
      results: results
    });
  } catch (error) {
    console.error('Error recalculating batch participants:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
}; 

// Get batch by ID (searches all treks' embedded batches)
exports.getBatchById = async (req, res) => {
  try {
    let { batchId } = req.params;
    if (!batchId) {
      return res.status(400).json({ message: 'Batch ID is required' });
    }

    // Try to convert to ObjectId if possible
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(batchId);
    } catch (e) {
      objectId = null;
    }

    // Find the trek that contains this batch (try both ObjectId and string)
    const trek = await require('../models/Trek').findOne({
      'batches._id': objectId || batchId
    });

    if (!trek) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Find the batch by string comparison as fallback
    let batch = trek.batches.id(batchId);
    if (!batch && objectId) {
      batch = trek.batches.id(objectId);
    }

    if (!batch) {
      // Try manual search as last resort
      batch = trek.batches.find(
        b => b._id.toString() === batchId || (objectId && b._id.equals(objectId))
      );
    }

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found in trek' });
    }

    // Attach trek name/id for context
    const batchObj = batch.toObject();
    batchObj.trekId = trek._id;
    batchObj.trekName = trek.name;
    res.json(batchObj);
  } catch (error) {
    console.error('Error fetching batch by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

