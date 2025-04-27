const Region = require('../models/Region');

// Get all regions
exports.getAllRegions = async (req, res) => {
  try {
    const regions = await Region.find().sort('name');
    res.status(200).json(regions);
  } catch (err) {
    console.error('Error fetching regions:', err);
    res.status(500).json({ message: 'Error fetching regions' });
  }
};

// Create a new region
exports.createRegion = async (req, res) => {
  try {
    console.log('Creating region with data:', req.body);
    
    const {
      name,
      location,
      description,
      bestSeason,
      avgTrekDuration,
      coverImage,
      images,
      descriptionImages,
      videos,
      relatedRegions,
      isEnabled,
      trekSectionTitle,
      welcomeMessage,
      detailedDescription
    } = req.body;

    // Validate required fields
    if (!name || !location || !description) {
      return res.status(400).json({ message: 'Name, location, and description are required' });
    }

    // Create the region with explicit field mapping
    const region = await Region.create({
      name,
      location,
      description,
      bestSeason: bestSeason || '',
      avgTrekDuration: avgTrekDuration || 0,
      coverImage: coverImage || '',
      images: Array.isArray(images) ? images : [],
      descriptionImages: Array.isArray(descriptionImages) ? descriptionImages : [],
      videos: Array.isArray(videos) ? videos : [],
      relatedRegions: Array.isArray(relatedRegions) ? relatedRegions : [],
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      trekSectionTitle: trekSectionTitle || '',
      welcomeMessage: welcomeMessage || '',
      detailedDescription: detailedDescription || ''
    });

    console.log('Region created successfully:', region);
    res.status(201).json(region);
  } catch (error) {
    console.error('Error creating region:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a region
exports.updateRegion = async (req, res) => {
  try {
    console.log('Updating region with ID:', req.params.id);
    console.log('Update data:', req.body);
    
    const {
      name,
      location,
      description,
      bestSeason,
      avgTrekDuration,
      coverImage,
      images,
      descriptionImages,
      videos,
      relatedRegions,
      isEnabled,
      trekSectionTitle,
      welcomeMessage,
      detailedDescription
    } = req.body;

    // Validate required fields
    if (!name || !location || !description) {
      return res.status(400).json({ message: 'Name, location, and description are required' });
    }

    // Create an update object with explicit field mapping
    const updateData = {
      name,
      location,
      description,
      bestSeason: bestSeason || '',
      avgTrekDuration: avgTrekDuration || 0,
      coverImage: coverImage || '',
      images: Array.isArray(images) ? images : [],
      descriptionImages: Array.isArray(descriptionImages) ? descriptionImages : [],
      videos: Array.isArray(videos) ? videos : [],
      relatedRegions: Array.isArray(relatedRegions) ? relatedRegions : [],
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      trekSectionTitle: trekSectionTitle || '',
      welcomeMessage: welcomeMessage || '',
      detailedDescription: detailedDescription || '',
      updatedAt: Date.now()
    };

    const region = await Region.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    console.log('Region updated successfully:', region);
    res.json(region);
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a region
exports.deleteRegion = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    
    // Use deleteOne instead of remove (which is deprecated)
    await Region.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Region deleted successfully' });
  } catch (err) {
    console.error('Error deleting region:', err);
    res.status(500).json({ message: 'Error deleting region' });
  }
};

// Get region by ID
exports.getRegionById = async (req, res) => {
  try {
    console.log('Fetching region with ID:', req.params.id);
    
    const region = await Region.findById(req.params.id)
      .populate('relatedRegions', 'name coverImage');
    
    if (!region) {
      console.log('Region not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Region not found' });
    }
    
    console.log('Region found:', region.name);
    res.json(region);
  } catch (error) {
    console.error('Error fetching region:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 