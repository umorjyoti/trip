const CareerApplication = require('../models/CareerApplication');
const { sendEmail } = require('../utils/email');
const User = require('../models/User');

// Create a new career application
exports.createCareerApplication = async (req, res) => {
  try {
    const { name, email, contactNumber, message, skillsAndExperience, resumeUrl, resumeFileName } = req.body;

    if (!resumeUrl) {
      return res.status(400).json({ message: 'Resume URL is required' });
    }

    const careerApplication = new CareerApplication({
      name,
      email,
      contactNumber,
      message,
      skillsAndExperience,
      resumeUrl,
      resumeFileName
    });

    const savedApplication = await careerApplication.save();

    // Send notification email to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@trekbooker.com',
        subject: 'New Career Application Received',
        html: `
          <h2>New Career Application</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Contact:</strong> ${contactNumber}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Skills & Experience:</strong> ${skillsAndExperience}</p>
          <p><strong>Resume:</strong> <a href="${resumeUrl}">Download ${resumeFileName || 'Resume'}</a></p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send career application notification email:', emailError);
    }

    // Send confirmation email to applicant
    try {
      await sendEmail({
        to: email,
        subject: 'Career Application Received - TrekBooker',
        html: `
          <h2>Thank you for your application!</h2>
          <p>Dear ${name},</p>
          <p>We have received your career application and will review it carefully. We will get back to you soon.</p>
          <p>Best regards,<br>The TrekBooker Team</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email to applicant:', emailError);
    }

    res.status(201).json({
      message: 'Career application submitted successfully',
      application: savedApplication
    });
  } catch (error) {
    console.error('Error creating career application:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all career applications (admin only)
exports.getCareerApplications = async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const applications = await CareerApplication.find(filter)
      .populate('statusUpdatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching career applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single career application (admin only)
exports.getCareerApplication = async (req, res) => {
  try {
    const application = await CareerApplication.findById(req.params.id)
      .populate('statusUpdatedBy', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Career application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Error fetching career application:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update career application status (admin only)
exports.updateCareerApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;

    const application = await CareerApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Career application not found' });
    }

    const oldStatus = application.status;
    application.status = status;
    application.notes = notes || application.notes;
    application.statusUpdatedAt = new Date();
    application.statusUpdatedBy = req.user._id;

    const updatedApplication = await application.save();

    // Send status update email to applicant
    try {
      const statusMessages = {
        shortlisted: 'Congratulations! Your application has been shortlisted. We will contact you soon for the next steps.',
        rejected: 'Thank you for your interest. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.',
        pending: 'Your application is currently under review.'
      };

      await sendEmail({
        to: application.email,
        subject: `Career Application Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        html: `
          <h2>Application Status Update</h2>
          <p>Dear ${application.name},</p>
          <p>${statusMessages[status]}</p>
          ${notes ? `<p><strong>Additional Notes:</strong> ${notes}</p>` : ''}
          <p>Best regards,<br>The TrekBooker Team</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    res.json({
      message: 'Career application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Error updating career application status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete career application (admin only)
exports.deleteCareerApplication = async (req, res) => {
  try {
    const application = await CareerApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Career application not found' });
    }

    await CareerApplication.findByIdAndDelete(req.params.id);

    res.json({ message: 'Career application deleted successfully' });
  } catch (error) {
    console.error('Error deleting career application:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get career application statistics (admin only)
exports.getCareerStats = async (req, res) => {
  try {
    const total = await CareerApplication.countDocuments();
    const pending = await CareerApplication.countDocuments({ status: 'pending' });
    const shortlisted = await CareerApplication.countDocuments({ status: 'shortlisted' });
    const rejected = await CareerApplication.countDocuments({ status: 'rejected' });

    // Recent applications (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = await CareerApplication.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      total,
      pending,
      shortlisted,
      rejected,
      recent
    });
  } catch (error) {
    console.error('Error fetching career stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 