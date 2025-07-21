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
    
    // Update landing page settings
    if (req.body.landingPage) {
      settings.landingPage = {
        ...settings.landingPage,
        ...req.body.landingPage
      };
    }
    
    // Update blog page settings
    if (req.body.blogPage) {
      settings.blogPage = {
        ...settings.blogPage,
        ...req.body.blogPage
      };
    }
    
    // Update weekend getaway page settings
    if (req.body.weekendGetawayPage) {
      settings.weekendGetawayPage = {
        ...settings.weekendGetawayPage,
        ...req.body.weekendGetawayPage
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

// Get landing page settings (public endpoint)
exports.getLandingPageSettings = async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json({
      landingPage: settings.landingPage
    });
  } catch (error) {
    console.error('Error fetching landing page settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get blog page settings (public endpoint)
exports.getBlogPageSettings = async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json({
      blogPage: settings.blogPage
    });
  } catch (error) {
    console.error('Error fetching blog page settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get weekend getaway page settings (public endpoint)
exports.getWeekendGetawayPageSettings = async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json({
      weekendGetawayPage: settings.weekendGetawayPage
    });
  } catch (error) {
    console.error('Error fetching weekend getaway page settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 