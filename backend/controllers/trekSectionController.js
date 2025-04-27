const TrekSection = require('../models/TrekSection');
const Trek = require('../models/Trek');

// Get all trek sections
exports.getTrekSections = async (req, res) => {
  try {
    const sections = await TrekSection.find().sort('displayOrder');
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
      .populate('treks');
    
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
    const { title, description, treks, displayOrder, isActive } = req.body;
    
    const section = new TrekSection({
      title,
      description,
      treks,
      displayOrder,
      isActive
    });
    
    await section.save();
    res.status(201).json(section);
  } catch (error) {
    console.error('Error creating trek section:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a trek section
exports.updateTrekSection = async (req, res) => {
  try {
    const { title, description, treks, displayOrder, isActive } = req.body;
    
    const section = await TrekSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: 'Trek section not found' });
    }
    
    section.title = title;
    section.description = description;
    section.treks = treks;
    section.displayOrder = displayOrder;
    section.isActive = isActive;
    
    await section.save();
    res.json(section);
  } catch (error) {
    console.error('Error updating trek section:', error);
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
    
    await section.remove();
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
        select: '-__v'
      })
      .sort({ displayOrder: 1 });
    
    console.log(`Found ${sections.length} active sections`);
    res.json(sections);
  } catch (error) {
    console.error('Error fetching active trek sections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 