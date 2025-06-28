const Trek = require('./models/Trek');
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

// Test function
exports.getTreks = async (req, res) => {
  res.json({ message: 'Test getTreks function' });
};

exports.getTrekById = async (req, res) => {
  res.json({ message: 'Test getTrekById function' });
};

module.exports = {
  getTreks,
  getTrekById
}; 