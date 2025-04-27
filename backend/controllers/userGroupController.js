const UserGroup = require('../models/UserGroup');
const User = require('../models/User');

// Get all user groups
exports.getAllUserGroups = async (req, res) => {
  try {
    const userGroups = await UserGroup.find();
    res.json(userGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single user group
exports.getUserGroup = async (req, res) => {
  try {
    const userGroup = await UserGroup.findById(req.params.id);
    if (!userGroup) {
      return res.status(404).json({ message: 'User group not found' });
    }
    res.json(userGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create user group
exports.createUserGroup = async (req, res) => {
  const userGroup = new UserGroup({
    name: req.body.name,
    description: req.body.description,
    permissions: req.body.permissions
  });

  try {
    const newUserGroup = await userGroup.save();
    res.status(201).json(newUserGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update user group
exports.updateUserGroup = async (req, res) => {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const { name, description, permissions } = req.body;
    
    // Validate required fields
    if (!name && !description && !permissions) {
      return res.status(400).json({ message: 'At least one field (name, description, or permissions) is required' });
    }

    const userGroup = await UserGroup.findById(req.params.id);
    if (!userGroup) {
      return res.status(404).json({ message: 'User group not found' });
    }

    // Update only provided fields
    if (name) userGroup.name = name;
    if (description) userGroup.description = description;
    if (permissions) userGroup.permissions = permissions;
    userGroup.updatedAt = Date.now();

    const updatedUserGroup = await userGroup.save();
    res.json(updatedUserGroup);
  } catch (error) {
    console.error('Error updating user group:', error);
    res.status(400).json({ 
      message: 'Error updating user group',
      error: error.message 
    });
  }
};

// Delete user group
exports.deleteUserGroup = async (req, res) => {
  try {
    const userGroup = await UserGroup.findByIdAndDelete(req.params.id);
    if (!userGroup) {
      return res.status(404).json({ message: 'User group not found' });
    }
    res.json({ message: 'User group deleted successfully' });
  } catch (error) {
    console.error('Error deleting user group:', error);
    res.status(500).json({ message: 'Error deleting user group' });
  }
};

// Get users in a group
exports.getUsersInGroup = async (req, res) => {
  try {
    const users = await User.find({ userGroup: req.params.id });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 