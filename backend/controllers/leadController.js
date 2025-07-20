const Lead = require("../models/Lead");
const Trek = require("../models/Trek");
const { sendEmail } = require("../utils/email");
const LeadHistory = require("../models/LeadHistory");
const User = require("../models/User");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');

// Helper function to get user info
const getUserInfo = async (userId) => {
  if (!userId) return null;
  const user = await User.findById(userId).select("name email");
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
  };
};

// Helper function to create history entry
const createHistoryEntry = async (
  leadId,
  action,
  field,
  oldValue,
  newValue,
  performedBy,
  details = ""
) => {
  // Get performed by user info
  const performedByUser = await getUserInfo(performedBy);

  // If this is an assignment change, get user info for old and new values
  let processedOldValue = oldValue;
  let processedNewValue = newValue;

  if (field === "assignedTo") {
    processedOldValue = await getUserInfo(oldValue);
    processedNewValue = await getUserInfo(newValue);
  }

  await LeadHistory.create({
    leadId,
    action,
    field,
    oldValue: processedOldValue,
    newValue: processedNewValue,
    performedBy: performedByUser,
    details,
  });
};

// Create a new lead
exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, trekId, source, notes, requestCallback } = req.body;

    // Only validate trek if trekId is provided
    if (trekId) {
      const trekExists = await Trek.findById(trekId);
      if (!trekExists) {
        return res.status(404).json({ message: "Trek not found" });
      }
    }

    const lead = new Lead({
      name,
      email,
      phone,
      trekId,
      source: source || "Other",
      notes,
      requestCallback: requestCallback || false,
    });

    const savedLead = await lead.save();

    // Create history entry for lead creation
    await createHistoryEntry(
      savedLead._id,
      "created",
      "status",
      null,
      savedLead.status,
      req.user?._id || null,
      "Lead created"
    );

    // Commenting out email sending for now
    /*
    // If callback requested, send notification
    if (savedLead.requestCallback) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'New Callback Request',
        text: `A new callback request has been received from ${savedLead.name} (${savedLead.phone}). Please contact them as soon as possible.`
      });
    }
    */

    res.status(201).json(savedLead);
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all leads
exports.getLeads = async (req, res) => {
  try {
    const {
      status,
      source,
      startDate,
      endDate,
      search,
      requestCallback,
      assignedTo,
    } = req.query;

    console.log("Received filters:", {
      status,
      source,
      startDate,
      endDate,
      search,
      requestCallback,
      assignedTo,
    });

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (requestCallback === "true") filter.requestCallback = true;
    if (assignedTo) filter.assignedTo = assignedTo;

    console.log("Built filter:", filter);

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const leads = await Lead.find(filter)
      .populate("trekId", "name regionName imageUrl displayPrice")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    console.log("Found leads:", leads.length);

    res.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single lead
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate("trekId", "name regionName imageUrl displayPrice")
      .populate("assignedTo", "name email");
    
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Get history with populated user details
    const history = await LeadHistory.find({ leadId: lead._id })
      .sort({ performedAt: -1 });

    // Format the history to ensure consistent user info display
    const formattedHistory = history.map(entry => {
      const historyEntry = entry.toObject();
      
      // Format performedBy
      if (historyEntry.performedBy) {
        historyEntry.performedBy = {
          _id: historyEntry.performedBy._id,
          name: historyEntry.performedBy.name,
          email: historyEntry.performedBy.email
        };
      }

      // For assignment changes, ensure oldValue and newValue have consistent format
      if (historyEntry.action === "assigned") {
        if (historyEntry.oldValue) {
          historyEntry.oldValue = {
            _id: historyEntry.oldValue._id,
            name: historyEntry.oldValue.name,
            email: historyEntry.oldValue.email
          };
        }
        if (historyEntry.newValue) {
          historyEntry.newValue = {
            _id: historyEntry.newValue._id,
            name: historyEntry.newValue.name,
            email: historyEntry.newValue.email
          };
        }
      }

      return historyEntry;
    });

    res.json({ lead, history: formattedHistory });
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update lead
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate(
      "assignedTo",
      "name email"
    );
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Track changes for each field
    const changes = [];
    for (const [field, newValue] of Object.entries(req.body)) {
      if (field === "assignedTo") {
        // Handle assignedTo changes specially to include user details
        if (lead[field]?.toString() !== newValue) {
          // Get old user details
          let oldUserDetails = null;
          if (lead.assignedTo) {
            oldUserDetails = {
              _id: lead.assignedTo._id,
              name: lead.assignedTo.name,
              email: lead.assignedTo.email
            };
          }

          // Get new user details
          let newUserDetails = null;
          if (newValue) {
            const newUser = await User.findById(newValue).select("name email");
            if (newUser) {
              newUserDetails = {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email
              };
            }
          }

          changes.push({
            field,
            oldValue: oldUserDetails,
            newValue: newUserDetails
          });
        }
      } else if (lead[field] !== newValue) {
        changes.push({
          field,
          oldValue: lead[field],
          newValue,
        });
      }
    }

    // Update lead
    Object.assign(lead, req.body);
    const updatedLead = await lead.save();

    // Create history entries for each change
    for (const change of changes) {
      let action;
      switch (change.field) {
        case "status":
          action = "status_changed";
          break;
        case "assignedTo":
          action = "assigned";
          break;
        case "notes":
          action = "note_added";
          break;
        case "requestCallback":
          action = change.newValue
            ? "callback_requested"
            : "callback_completed";
          break;
        default:
          action = "updated";
      }

      await createHistoryEntry(
        lead._id,
        action,
        change.field,
        change.oldValue,
        change.newValue,
        req.user._id
      );
    }

    // Fetch the updated lead with populated fields
    const populatedLead = await Lead.findById(updatedLead._id)
      .populate("trekId", "name regionName imageUrl displayPrice")
      .populate("assignedTo", "name email");

    res.json(populatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(400).json({ message: error.message });
  }
};

// Delete lead
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Create history entry for deletion
    await createHistoryEntry(
      lead._id,
      "deleted",
      "status",
      lead.status,
      null,
      req.user._id,
      "Lead deleted"
    );

    await lead.remove();
    res.json({ message: "Lead deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export leads
exports.exportLeads = async (req, res) => {
  try {
    const { fields, fileType } = req.body;
    
    // Get all leads with populated fields
    const leads = await Lead.find()
      .populate("assignedTo", "name email")
      .populate("trekId", "name regionName imageUrl displayPrice");

    if (fileType === "excel") {
      // Create a new Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Leads");

      // Add headers
      const headers = fields.map(field => {
        switch(field) {
          case "name": return "Name";
          case "email": return "Email";
          case "phone": return "Phone";
          case "status": return "Status";
          case "source": return "Source";
          case "createdAt": return "Created Date";
          case "assignedTo": return "Assigned To";
          case "notes": return "Notes";
          case "requestCallback": return "Callback Request";
          case "trekId": return "Trek Details";
          default: return field;
        }
      });
      worksheet.addRow(headers);

      // Add data rows
      leads.forEach(lead => {
        const row = fields.map(field => {
          switch(field) {
            case "assignedTo":
              return lead.assignedTo ? `${lead.assignedTo.name} (${lead.assignedTo.email})` : "Unassigned";
            case "trekId":
              return lead.trekId ? `${lead.trekId.name} - ${lead.trekId.regionName}` : "N/A";
            case "createdAt":
              return new Date(lead.createdAt).toLocaleString();
            case "requestCallback":
              return lead.requestCallback ? "Yes" : "No";
            default:
              return lead[field];
          }
        });
        worksheet.addRow(row);
      });

      // Set column widths
      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=leads-export.xlsx"
      );

      // Send the workbook
      await workbook.xlsx.write(res);
      res.end();

    } else if (fileType === "pdf") {
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      
      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=leads-export.pdf"
      );

      // Pipe the PDF to the response
      doc.pipe(res);

      // Add title
      doc.fontSize(16).text("Leads Export", { align: 'center' });
      doc.moveDown();

      // Prepare table data
      const tableHeaders = fields.map(field => {
        switch(field) {
          case "name": return "Name";
          case "email": return "Email";
          case "phone": return "Phone";
          case "status": return "Status";
          case "source": return "Source";
          case "createdAt": return "Created Date";
          case "assignedTo": return "Assigned To";
          case "notes": return "Notes";
          case "requestCallback": return "Callback";
          case "trekId": return "Trek";
          default: return field;
        }
      });

      const tableData = leads.map(lead => 
        fields.map(field => {
          switch(field) {
            case "assignedTo":
              return lead.assignedTo ? `${lead.assignedTo.name} (${lead.assignedTo.email})` : "Unassigned";
            case "trekId":
              return lead.trekId ? `${lead.trekId.name} - ${lead.trekId.regionName}` : "N/A";
            case "createdAt":
              return new Date(lead.createdAt).toLocaleString();
            case "requestCallback":
              return lead.requestCallback ? "Yes" : "No";
            default:
              return lead[field]?.toString() || "";
          }
        })
      );

      // Add table
      await doc.table({
        headers: tableHeaders,
        rows: tableData
      });

      // Finalize PDF
      doc.end();
    }
  } catch (error) {
    console.error("Error exporting leads:", error);
    res.status(500).json({ message: "Error exporting leads", error: error.message });
  }
};
