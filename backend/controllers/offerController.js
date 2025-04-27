const Offer = require('../models/Offer');
const Trek = require('../models/Trek');

// Get all offers
exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate('createdBy', 'name')
      .populate('applicableTreks', 'name price')
      .sort('-createdAt');
    
    res.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new offer
exports.createOffer = async (req, res) => {
  try {
    const {
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      applicableTreks,
      isActive
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !discountType || !discountValue || !startDate || !endDate || !applicableTreks || applicableTreks.length === 0) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Create new offer
    const offer = new Offer({
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      applicableTreks,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });
    
    const savedOffer = await offer.save();
    
    res.status(201).json(savedOffer);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an offer
exports.updateOffer = async (req, res) => {
  try {
    const {
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      applicableTreks,
      isActive
    } = req.body;
    
    // Find and update the offer
    const updatedOffer = await Offer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        discountType,
        discountValue,
        startDate,
        endDate,
        applicableTreks,
        isActive
      },
      { new: true }
    );
    
    if (!updatedOffer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    
    res.json(updatedOffer);
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an offer
exports.deleteOffer = async (req, res) => {
  try {
    const deletedOffer = await Offer.findByIdAndDelete(req.params.id);
    
    if (!deletedOffer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    
    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get active offers for public display
exports.getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('applicableTreks', 'name price');
    
    res.json(activeOffers);
  } catch (error) {
    console.error('Error fetching active offers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Calculate discounted price for a trek
exports.calculateDiscountedPrice = (originalPrice, offer) => {
  if (offer.discountType === 'percentage') {
    return originalPrice - (originalPrice * offer.discountValue / 100);
  } else {
    return Math.max(0, originalPrice - offer.discountValue);
  }
}; 