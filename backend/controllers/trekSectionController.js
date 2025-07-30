const TrekSection = require('../models/TrekSection');
const Trek = require('../models/Trek');

// Get all trek sections
exports.getTrekSections = async (req, res) => {
  try {
    const sections = await TrekSection.find()
      .populate('treks', 'name regionName slug')
      .populate('linkToTrek', 'name regionName slug')
      .sort('displayOrder');
    res.json(sections);
  } catch (error) {
    console.error('Error fetching trek sections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get trek section by ID
exports.getTrekSectionById = async (req, res) => {
  try {
    const section = await TrekSection.findById(req.params.id)
      .populate('treks', 'name regionName slug')
      .populate('linkToTrek', 'name regionName slug');
    
    if (!section) {
      return res.status(404).json({ message: 'Trek section not found' });
    }
    
    res.json(section);
  } catch (error) {
    console.error('Error fetching trek section:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new trek section
exports.createTrekSection = async (req, res) => {
  try {
    const { 
      title, 
      type, 
      treks, 
      displayOrder, 
      isActive,
      // Banner fields
      bannerImage,
      overlayText,
      overlayColor,
      overlayOpacity,
      textColor,
      linkToTrek,
      couponCode,
      discountPercentage,
      mobileOptimized
    } = req.body;
    
    // Validate banner-specific fields if type is banner
    if (type === 'banner') {
      if (!bannerImage) {
        return res.status(400).json({ message: 'Banner image is required for banner sections' });
      }
      if (!overlayText) {
        return res.status(400).json({ message: 'Overlay text is required for banner sections' });
      }
      
      // Validate that the trek exists if linkToTrek is provided
      if (linkToTrek) {
        const trek = await Trek.findById(linkToTrek);
        if (!trek) {
          return res.status(400).json({ message: 'Selected trek does not exist' });
        }
      }
    }
    
    // Validate trek-specific fields if type is trek
    if (type === 'trek') {
      if (!treks || treks.length === 0) {
        return res.status(400).json({ message: 'At least one trek is required for trek sections' });
      }
    }
    
    const sectionData = {
      title,
      type: type || 'trek',
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true
    };
    
    // Add type-specific fields
    if (type === 'trek') {
      sectionData.treks = treks;
    } else if (type === 'banner') {
      sectionData.bannerImage = bannerImage;
      sectionData.overlayText = overlayText;
      sectionData.overlayColor = overlayColor || '#000000';
      sectionData.overlayOpacity = overlayOpacity || 0.5;
      sectionData.textColor = textColor || '#FFFFFF';
      sectionData.linkToTrek = linkToTrek;
      sectionData.couponCode = couponCode;
      sectionData.discountPercentage = discountPercentage;
      sectionData.mobileOptimized = mobileOptimized !== undefined ? mobileOptimized : true;
    }
    
    const section = new TrekSection(sectionData);
    await section.save();
    
    const populatedSection = await TrekSection.findById(section._id)
      .populate('treks', 'name regionName slug')
      .populate('linkToTrek', 'name regionName slug');
    
    res.status(201).json(populatedSection);
  } catch (error) {
    console.error('Error creating trek section:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a trek section
exports.updateTrekSection = async (req, res) => {
  try {
    const { 
      title, 
      type, 
      treks, 
      displayOrder, 
      isActive,
      // Banner fields
      bannerImage,
      overlayText,
      overlayColor,
      overlayOpacity,
      textColor,
      linkToTrek,
      couponCode,
      discountPercentage,
      mobileOptimized
    } = req.body;
    
    const section = await TrekSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: 'Trek section not found' });
    }
    
    // Validate banner-specific fields if type is banner
    if (type === 'banner') {
      if (!bannerImage) {
        return res.status(400).json({ message: 'Banner image is required for banner sections' });
      }
      if (!overlayText) {
        return res.status(400).json({ message: 'Overlay text is required for banner sections' });
      }
      
      // Validate that the trek exists if linkToTrek is provided
      if (linkToTrek) {
        const trek = await Trek.findById(linkToTrek);
        if (!trek) {
          return res.status(400).json({ message: 'Selected trek does not exist' });
        }
      }
    }
    
    // Validate trek-specific fields if type is trek
    if (type === 'trek') {
      if (!treks || treks.length === 0) {
        return res.status(400).json({ message: 'At least one trek is required for trek sections' });
      }
    }
    
    // Update common fields
    section.title = title;
    section.type = type || section.type;
    section.displayOrder = displayOrder !== undefined ? displayOrder : section.displayOrder;
    section.isActive = isActive !== undefined ? isActive : section.isActive;
    
    // Update type-specific fields
    if (type === 'trek') {
      section.treks = treks;
      // Clear banner fields
      section.bannerImage = undefined;
      section.overlayText = undefined;
      section.overlayColor = undefined;
      section.overlayOpacity = undefined;
      section.textColor = undefined;
      section.linkToTrek = undefined;
      section.couponCode = undefined;
      section.discountPercentage = undefined;
      section.mobileOptimized = undefined;
    } else if (type === 'banner') {
      section.bannerImage = bannerImage;
      section.overlayText = overlayText;
      section.overlayColor = overlayColor || '#000000';
      section.overlayOpacity = overlayOpacity || 0.5;
      section.textColor = textColor || '#FFFFFF';
      section.linkToTrek = linkToTrek;
      section.couponCode = couponCode;
      section.discountPercentage = discountPercentage;
      section.mobileOptimized = mobileOptimized !== undefined ? mobileOptimized : true;
      // Clear trek fields
      section.treks = [];
    }
    
    await section.save();
    
    const updatedSection = await TrekSection.findById(section._id)
      .populate('treks', 'name regionName slug')
      .populate('linkToTrek', 'name regionName slug');
    
    res.json(updatedSection);
  } catch (error) {
    console.error('Error updating trek section:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a trek section
exports.deleteTrekSection = async (req, res) => {
  try {
    const section = await TrekSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: 'Trek section not found' });
    }
    
    await TrekSection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trek section removed' });
  } catch (error) {
    console.error('Error deleting trek section:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get active trek sections with populated treks for homepage
exports.getActiveSections = async (req, res) => {
  try {
    console.log('Getting active trek sections');
    const sections = await TrekSection.find({ isActive: true })
      .populate({
        path: 'treks',
        match: { isEnabled: true },
        select: 'name regionName slug displayPrice strikedPrice images duration difficulty'
      })
      .populate({
        path: 'linkToTrek',
        match: { isEnabled: true },
        select: 'name regionName slug displayPrice strikedPrice images duration difficulty'
      })
      .sort({ displayOrder: 1 });
    
    console.log(`Found ${sections.length} active sections`);
    res.json(sections);
  } catch (error) {
    console.error('Error fetching active trek sections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 