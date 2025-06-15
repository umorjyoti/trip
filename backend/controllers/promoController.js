const PromoCode = require('../models/PromoCode');
const Trek = require('../models/Trek');

// Get all promo codes
exports.getAllPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.find()
      .populate('createdBy', 'name')
      .populate('applicableTreks', 'name')
      .sort('-createdAt');
    
    res.json(promoCodes);
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new promo code
exports.createPromoCode = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      minOrderValue,
      applicableTreks,
      isActive
    } = req.body;
    
    // Validate required fields
    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if promo code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }
    
    // Create new promo code
    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      minOrderValue: minOrderValue || 0,
      applicableTreks: applicableTreks || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });
    
    const savedPromoCode = await promoCode.save();
    
    res.status(201).json(savedPromoCode);
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a promo code
exports.updatePromoCode = async (req, res) => {
  try {
    const {
      discountType,
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      minOrderValue,
      applicableTreks,
      isActive
    } = req.body;
    
    const promoCode = await PromoCode.findById(req.params.id);
    
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    
    // Update fields
    if (discountType) promoCode.discountType = discountType;
    if (discountValue) promoCode.discountValue = discountValue;
    if (maxUses !== undefined) promoCode.maxUses = maxUses;
    if (validFrom) promoCode.validFrom = validFrom;
    if (validUntil) promoCode.validUntil = validUntil;
    if (minOrderValue !== undefined) promoCode.minOrderValue = minOrderValue;
    if (applicableTreks) promoCode.applicableTreks = applicableTreks;
    if (isActive !== undefined) promoCode.isActive = isActive;
    
    const updatedPromoCode = await promoCode.save();
    
    res.json(updatedPromoCode);
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a promo code
exports.deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    
    await promoCode.remove();
    
    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Validate a promo code
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, trekId, orderValue } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Please provide a promo code' });
    }
    
    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });
    
    if (!promoCode) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }
    
    // Check if promo code is expired
    const now = new Date();
    if (now < new Date(promoCode.validFrom) || now > new Date(promoCode.validUntil)) {
      return res.status(400).json({ message: 'Promo code has expired' });
    }
    
    // Check if promo code has reached max uses
    if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({ message: 'Promo code has reached maximum uses' });
    }
    
    // Check minimum order value
    if (orderValue && orderValue < promoCode.minOrderValue) {
      return res.status(400).json({ 
        message: `Order value must be at least ${promoCode.minOrderValue} to use this code` 
      });
    }
    
    // Check if trek is applicable
    if (trekId && promoCode.applicableTreks.length > 0) {
      const isTrekApplicable = promoCode.applicableTreks.some(
        trek => trek.toString() === trekId
      );
      
      if (!isTrekApplicable) {
        return res.status(400).json({ message: 'Promo code not applicable for this trek' });
      }
    }
    
    // Calculate discount
    let discount = 0;
    if (promoCode.discountType === 'percentage') {
      discount = orderValue ? (orderValue * promoCode.discountValue / 100) : promoCode.discountValue;
    } else {
      discount = promoCode.discountValue;
    }
    
    res.json({
      valid: true,
      promoCode: {
        _id: promoCode._id,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        discount
      }
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const calculateDiscountedPrice = (basePrice) => {
  if (!appliedCoupon) return basePrice;
  const { discountType, discountValue } = appliedCoupon;
  if (discountType === 'percentage') {
    return basePrice * (1 - discountValue / 100);
  } else if (discountType === 'fixed') {
    return Math.max(0, basePrice - discountValue);
  }
  return basePrice;
}; 