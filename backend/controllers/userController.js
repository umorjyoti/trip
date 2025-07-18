const User = require('../models/User');
const UserGroup = require('../models/UserGroup');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('group', 'name _id');
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('group', 'name _id');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
};

// Update user group assignment
exports.updateUserGroupAssignment = async (req, res) => {
  try {
    const { groupId } = req.body;
    
    // Check if group exists (if groupId is provided)
    if (groupId) {
      const group = await UserGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'User group not found' });
      }
    }
    
    // Update user's group
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { group: groupId || null },
      { new: true }
    ).populate('group', 'name _id');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User group updated successfully', user });
  } catch (error) {
    console.error('Error updating user group:', error);
    res.status(500).json({ message: 'Error updating user group', error: error.message });
  }
};

// Get all user groups
exports.getAllUserGroups = async (req, res) => {
  try {
    const groups = await UserGroup.find();
    res.json(groups);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ message: 'Error fetching user groups', error: error.message });
  }
};

// Get single user group
exports.getUserGroup = async (req, res) => {
  try {
    const group = await UserGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'User group not found' });
    }
    res.json(group);
  } catch (error) {
    console.error('Error fetching user group:', error);
    res.status(500).json({ message: 'Error fetching user group', error: error.message });
  }
};

// Create user group
exports.createUserGroup = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Check if group with same name exists
    const existingGroup = await UserGroup.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group with this name already exists' });
    }
    
    const group = await UserGroup.create({
      name,
      description,
      permissions
    });
    
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating user group:', error);
    res.status(500).json({ message: 'Error creating user group', error: error.message });
  }
};

// Update user group
exports.updateUserGroup = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    const group = await UserGroup.findByIdAndUpdate(
      req.params.id,
      { name, description, permissions, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!group) {
      return res.status(404).json({ message: 'User group not found' });
    }
    
    res.json(group);
  } catch (error) {
    console.error('Error updating user group:', error);
    res.status(500).json({ message: 'Error updating user group', error: error.message });
  }
};

// Delete user group
exports.deleteUserGroup = async (req, res) => {
  try {
    // Check if any users are assigned to this group
    const usersInGroup = await User.countDocuments({ group: req.params.id });
    if (usersInGroup > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete group. There are users assigned to this group.' 
      });
    }
    
    const group = await UserGroup.findByIdAndDelete(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'User group not found' });
    }
    
    res.json({ message: 'User group deleted successfully' });
  } catch (error) {
    console.error('Error deleting user group:', error);
    res.status(500).json({ message: 'Error deleting user group', error: error.message });
  }
};

// Get all admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .populate('group', 'name _id');
    
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Error fetching admins', error: error.message });
  }
};

module.exports = exports; 