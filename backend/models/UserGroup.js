const mongoose = require('mongoose');

const userGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  permissions: {
    stats: {
      treks: Boolean,
      bookings: Boolean,
      region: Boolean,
      sales: Boolean,
      users: Boolean,
      ongoingTreks: Boolean
    },
    actions: {
      manageTreks: Boolean,
      manageWeekendGetaways: Boolean,
      manageRegions: Boolean,
      manageBookings: Boolean,
      manageUsers: Boolean,
      supportTickets: Boolean,
      salesDashboard: Boolean,
      manageLeads: Boolean,
      trekSections: Boolean,
      manageUserGroups: Boolean,
      manageBlogs: Boolean
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserGroup', userGroupSchema); 