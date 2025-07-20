const Settings = require('../models/Settings');

// Get all settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    
    // Update enquiry banner settings
    if (req.body.enquiryBanner) {
      settings.enquiryBanner = {
        ...settings.enquiryBanner,
        ...req.body.enquiryBanner
      };
    }
    
    // Add other settings updates here in the future
    
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get enquiry banner settings (public endpoint)
exports.getEnquiryBannerSettings = async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json({
      enquiryBanner: settings.enquiryBanner
    });
  } catch (error) {
    console.error('Error fetching enquiry banner settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 