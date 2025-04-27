const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Trek = require('../models/Trek');
const mongoose = require('mongoose');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user has no wishlist or it's empty, return empty array
    if (!user.wishlist || user.wishlist.length === 0) {
      return res.json([]);
    }
    
    // Fetch the treks separately instead of using populate
    const wishlistTreks = await Trek.find({ _id: { $in: user.wishlist } });
    
    res.json(wishlistTreks);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add trek to wishlist
// @route   POST /api/wishlist/:trekId
// @access  Private
router.post('/:trekId', protect, async (req, res) => {
  try {
    const trekId = req.params.trekId;
    
    // Validate trekId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(trekId)) {
      return res.status(400).json({ message: 'Invalid trek ID format' });
    }
    
    // Check if trek exists
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    // Use findByIdAndUpdate instead of manually updating the user
    // This avoids validation issues with other fields
    const result = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $addToSet: { wishlist: trekId } // $addToSet ensures no duplicates
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(201).json({ message: 'Trek added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Remove trek from wishlist
// @route   DELETE /api/wishlist/:trekId
// @access  Private
router.delete('/:trekId', protect, async (req, res) => {
  try {
    const trekId = req.params.trekId;
    
    // Validate trekId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(trekId)) {
      return res.status(400).json({ message: 'Invalid trek ID format' });
    }
    
    // Use findByIdAndUpdate instead of manually updating the user
    const result = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $pull: { wishlist: trekId } // $pull removes the item from the array
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Trek removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 