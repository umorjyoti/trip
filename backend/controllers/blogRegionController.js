const BlogRegion = require('../models/BlogRegion');

// Get all blog regions (admin)
exports.getAllBlogRegions = async (req, res) => {
  try {
    const regions = await BlogRegion.find().sort({ name: 1 });
    res.json(regions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all enabled blog regions (public)
exports.getEnabledBlogRegions = async (req, res) => {
  try {
    const regions = await BlogRegion.findEnabled();
    res.json(regions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get blog region by slug
exports.getBlogRegionBySlug = async (req, res) => {
  try {
    const region = await BlogRegion.findOne({ 
      slug: req.params.slug,
      isEnabled: true
    });

    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    res.json(region);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get blog region by ID
exports.getBlogRegionById = async (req, res) => {
  try {
    const region = await BlogRegion.findById(req.params.id);

    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    res.json(region);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new blog region
exports.createBlogRegion = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    // Validate required fields
    if (!name || !description || !image) {
      return res.status(400).json({ 
        message: 'Name, description, and image are required' 
      });
    }

    const region = new BlogRegion({
      name,
      description,
      image
    });

    const savedRegion = await region.save();
    res.status(201).json(savedRegion);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'A region with this name already exists' 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Update blog region
exports.updateBlogRegion = async (req, res) => {
  try {
    const { name, description, image, isEnabled } = req.body;

    // Validate required fields
    if (!name || !description || !image) {
      return res.status(400).json({ 
        message: 'Name, description, and image are required' 
      });
    }

    const region = await BlogRegion.findById(req.params.id);
    
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    Object.assign(region, {
      name,
      description,
      image,
      isEnabled: isEnabled !== undefined ? isEnabled : region.isEnabled
    });

    const updatedRegion = await region.save();
    res.json(updatedRegion);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'A region with this name already exists' 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete blog region
exports.deleteBlogRegion = async (req, res) => {
  try {
    const region = await BlogRegion.findById(req.params.id);
    
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    await region.deleteOne();
    res.json({ message: 'Region deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 