const mongoose = require('mongoose');

// Import all models
const Batch = require('./Batch');
const Booking = require('./Booking');
const Trek = require('./Trek');
const User = require('./User');
const UserGroup = require('./UserGroup');
const Ticket = require('./Ticket');
const TrekSection = require('./TrekSection');
const Offer = require('./Offer');
const PromoCode = require('./PromoCode');
const Region = require('./Region');
const Lead = require('./Lead');
const LeadHistory = require('./LeadHistory');
const CareerApplication = require('./CareerApplication');
const Blog = require('../src/models/Blog');

// Export all models
module.exports = {
  Batch,
  Booking,
  Trek,
  User,
  UserGroup,
  Ticket,
  TrekSection,
  Offer,
  PromoCode,
  Region,
  Lead,
  LeadHistory,
  CareerApplication,
  Blog
}; 