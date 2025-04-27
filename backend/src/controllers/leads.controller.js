const Lead = require('../models/lead.model');
const { sendEmail } = require('../utils/email');

// Get all leads with filters
exports.getAllLeads = async (req, res) => {
  try {
    const { status, assignedTo, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email');

    const total = await Lead.countDocuments(query);

    res.json({
      leads,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single lead
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email');
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new lead
exports.createLead = async (req, res) => {
  try {
    // Map requestCall to requestCallback
    const leadData = {
      ...req.body,
      requestCallback: req.body.requestCall || false
    };
    
    const lead = new Lead(leadData);
    await lead.save();
    
    // If callback requested, send notification
    if (lead.requestCallback) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'New Callback Request',
        text: `A new callback request has been received from ${lead.name} (${lead.phone}). Please contact them as soon as possible.`
      });
    }

    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a lead
exports.updateLead = async (req, res) => {
  try {
    // Map frontend fields to backend fields
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      status: req.body.status,
      notes: req.body.notes,
      assignedTo: req.body.assignedTo,
      requestCallback: req.body.requestCall || false
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // If callback status changed to completed, send confirmation
    if (lead.requestCallback && lead.callbackStatus === 'completed') {
      await sendEmail({
        to: lead.email,
        subject: 'Callback Request Completed',
        text: `Dear ${lead.name},\n\nThank you for your callback request. We have completed your request. If you need any further assistance, please don't hesitate to contact us.\n\nBest regards,\nYour Team`
      });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete a lead
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update lead status
exports.updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Assign lead to a team member
exports.assignLead = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update callback status
exports.updateCallbackStatus = async (req, res) => {
  try {
    const { callbackStatus } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { callbackStatus },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // If callback completed, send confirmation email
    if (callbackStatus === 'completed') {
      await sendEmail({
        to: lead.email,
        subject: 'Callback Request Completed',
        text: `Dear ${lead.name},\n\nThank you for your callback request. We have completed your request. If you need any further assistance, please don't hesitate to contact us.\n\nBest regards,\nYour Team`
      });
    }

    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 