const Trek = require('../models/Trek'); // Make sure this path is correct
const mongoose = require('mongoose');
const Booking = require('../models/Booking'); // Implied import for Booking model

// Get trek statistics
exports.getTrekStats = async (req, res) => {
  try {
    console.log('Getting trek stats...');
    const totalTreks = await Trek.countDocuments();
    console.log('Total treks:', totalTreks);
    
    // Get region stats
    const regions = await Trek.aggregate([
      { $group: { _id: "$region", count: { $sum: 1 } } },
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
    const treks = await Trek.find().sort({ createdAt: -1 });
    res.json(treks);
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

    // Fetch trek with populated batches
    const trek = await Trek.findById(id).select('+gstPercent +gstType +gatewayPercent +gatewayType');
    
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
    
    console.log('Trek found:', trek.name);
    console.log('Available future batches:', trek.batches.length);
    console.log('GST and Gateway details:', { gst: response.gstDetails, gateway: response.gatewayDetails });
    
    res.json(response);
  } catch (error) {
    console.error('Error getting trek by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createTrek = async (req, res) => {
  try {
    console.log('Creating trek with data:', req.body);
    
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
      gatewayType: req.body.gatewayType || 'customer'
    };
    
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
    res.status(201).json(trek);
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
      name, description, region, difficulty, duration, distance, maxAltitude,
      displayPrice, images, itinerary, includes, excludes, mapUrl,
      isEnabled, isFeatured, isWeekendGetaway,
      category, addOns, highlights, batches, faqs, thingsToPack,
      gstPercent, gstType, gatewayPercent, gatewayType,
      tags, itineraryPdfUrl
    } = req.body;

    // Filter out empty highlights
    const filteredHighlights = highlights?.filter(h => h.trim()) || trek.highlights;

    // Validate highlights
    if (!filteredHighlights || !filteredHighlights.length) {
      return res.status(400).json({ message: 'At least one highlight is required' });
    }

    // Prepare the update data object
    const updateData = {
      name, description, region, difficulty, duration, distance, maxAltitude,
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
      thingsToPack: thingsToPack || trek.thingsToPack
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
    
    // Create new batch
    const newBatch = {
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
    
    res.status(201).json(trek);
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
      includeDisabled
    } = req.query;

    // Build filter object
    const filter = {};

    // Only show enabled treks for non-admin users
    if (!includeDisabled) {
      filter.isEnabled = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (region) filter.region = region;
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
      .select('+gstPercent +gstType +gatewayPercent +gatewayType')
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
      region, 
      isEnabled: true 
    }).populate('region', 'name location coverImage');
    
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
    
    // Use strict equality with the region ID
    const treks = await Trek.find({ 
      region: regionId,
      isEnabled: true 
    }).populate('region', 'name location coverImage');
    
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
    const { id, batchId } = req.params;
    const { startDate, endDate, price, availableSlots, status } = req.body;
    
    console.log(`Updating batch ${batchId} for trek ${id}`);
    
    const trek = await Trek.findById(id);
    
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    // Find the batch to update
    const batchIndex = trek.batches.findIndex(batch => batch._id.toString() === batchId);
    
    if (batchIndex === -1) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    // Update batch fields
    if (startDate) trek.batches[batchIndex].startDate = startDate;
    if (endDate) trek.batches[batchIndex].endDate = endDate;
    if (price) trek.batches[batchIndex].price = price;
    if (availableSlots !== undefined) trek.batches[batchIndex].availableSlots = availableSlots;
    if (status) trek.batches[batchIndex].status = status;
    
    await trek.save();
    
    res.json({
      message: 'Batch updated successfully',
      batch: trek.batches[batchIndex]
    });
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
  try {
    const { trekId, batchId } = req.params;

    // Find the trek and the specific batch
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
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

    // Calculate performance metrics
    const performanceData = {
      batchDetails: {
        startDate: batch.startDate,
        endDate: batch.endDate,
        price: batch.price,
        maxParticipants: batch.maxParticipants,
        status: batch.status
      },
      bookings: {
        total: bookings.length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        completed: bookings.filter(b => b.status === 'completed').length
      },
      revenue: {
        total: bookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
        confirmed: bookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, booking) => sum + booking.totalPrice, 0),
        cancelled: bookings
          .filter(b => b.status === 'cancelled')
          .reduce((sum, booking) => sum + booking.totalPrice, 0)
      },
      participants: {
        total: bookings.reduce((sum, booking) => sum + booking.participants, 0),
        confirmed: bookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, booking) => sum + booking.participants, 0),
        cancelled: bookings
          .filter(b => b.status === 'cancelled')
          .reduce((sum, booking) => sum + booking.participants, 0)
      },
      bookingDetails: bookings.map(booking => ({
        bookingId: booking._id,
        user: {
          name: booking.user.name,
          email: booking.user.email,
          phone: booking.user.phone
        },
        participants: booking.participants,
        totalPrice: booking.totalPrice,
        status: booking.status,
        bookingDate: booking.createdAt
      })),
      feedback: batch.feedback
    };

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
    
    const trek = await Trek.findById(req.params.id).populate('batches');
    
    if (!trek) {
      console.log('Trek not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Trek not found' });
    }

    console.log('Found trek:', trek.name);
    console.log('Number of batches:', trek.batches.length);

    // Get all bookings for this trek's batches
    const bookings = await Booking.find({
      batch: { $in: trek.batches.map(batch => batch._id) }
    }).populate('user', 'name email');

    console.log('Number of bookings found:', bookings.length);

    // Calculate total revenue and bookings
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0);
    const totalBookings = bookings.length;

    // Calculate batch-specific metrics
    const batchPerformance = trek.batches.map(batch => {
      const batchBookings = bookings.filter(booking => booking.batch.toString() === batch._id.toString());
      const revenue = batchBookings.reduce((sum, booking) => sum + booking.amount, 0);
      const currentParticipants = batchBookings.reduce((sum, booking) => sum + booking.participants, 0);

      let status = 'upcoming';
      const now = new Date();
      if (new Date(batch.endDate) < now) {
        status = 'completed';
      } else if (new Date(batch.startDate) <= now) {
        status = 'ongoing';
      }

      return {
        _id: batch._id,
        startDate: batch.startDate,
        endDate: batch.endDate,
        price: batch.price,
        maxParticipants: batch.maxParticipants,
        currentParticipants,
        revenue,
        status
      };
    });

    const response = {
      trek: {
        _id: trek._id,
        name: trek.name
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