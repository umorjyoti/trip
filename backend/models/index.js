const mongoose = require('mongoose');

// Import all models
const Batch = require('./Batch');
const Booking = require('./Booking');
const Trek = require('./Trek');
const User = require('./User');
const Blog = require('../src/models/Blog');

// Export all models
module.exports = {
  Batch,
  Booking,
  Trek,
  User,
  Blog
}; 