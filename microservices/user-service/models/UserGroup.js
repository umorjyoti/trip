const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['stats', 'actions', 'content', 'system']
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
}, { _id: false });

const userGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a group name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [permissionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  // Group hierarchy
  parentGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserGroup'
  },
  // Group settings
  settings: {
    canCreateBookings: {
      type: Boolean,
      default: true
    },
    canViewAllBookings: {
      type: Boolean,
      default: false
    },
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canManageTreks: {
      type: Boolean,
      default: false
    },
    canViewReports: {
      type: Boolean,
      default: false
    },
    maxBookingsPerUser: {
      type: Number,
      default: 10
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userGroupSchema.index({ name: 1 });
userGroupSchema.index({ isActive: 1 });

// Virtual for user count
userGroupSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'group',
  count: true
});

// Instance method to check if group has permission
userGroupSchema.methods.hasPermission = function(category, name) {
  return this.permissions.some(permission => 
    permission.category === category && permission.name === name
  );
};

// Instance method to add permission
userGroupSchema.methods.addPermission = function(category, name, description = '') {
  const existingPermission = this.permissions.find(p => 
    p.category === category && p.name === name
  );

  if (!existingPermission) {
    this.permissions.push({ category, name, description });
  }
};

// Instance method to remove permission
userGroupSchema.methods.removePermission = function(category, name) {
  this.permissions = this.permissions.filter(p => 
    !(p.category === category && p.name === name)
  );
};

// Static method to find active groups
userGroupSchema.statics.findActiveGroups = function() {
  return this.find({ isActive: true });
};

// Static method to get default permissions for different group types
userGroupSchema.statics.getDefaultPermissions = function(groupType) {
  const permissionSets = {
    admin: [
      { category: 'stats', name: 'bookings', description: 'View booking statistics' },
      { category: 'stats', name: 'users', description: 'View user statistics' },
      { category: 'stats', name: 'revenue', description: 'View revenue statistics' },
      { category: 'actions', name: 'manageBookings', description: 'Manage all bookings' },
      { category: 'actions', name: 'manageUsers', description: 'Manage user accounts' },
      { category: 'actions', name: 'manageTreks', description: 'Manage trek catalog' },
      { category: 'content', name: 'manageBlogs', description: 'Manage blog content' },
      { category: 'content', name: 'manageOffers', description: 'Manage offers and promotions' },
      { category: 'system', name: 'settings', description: 'Manage system settings' }
    ],
    moderator: [
      { category: 'stats', name: 'bookings', description: 'View booking statistics' },
      { category: 'actions', name: 'manageBookings', description: 'Manage bookings' },
      { category: 'content', name: 'manageBlogs', description: 'Manage blog content' }
    ],
    user: []
  };

  return permissionSets[groupType] || [];
};

module.exports = mongoose.model('UserGroup', userGroupSchema);