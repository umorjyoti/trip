const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  email: String
}, { _id: false });

const leadHistorySchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  action: {
    type: String,
    enum: ['created', 'status_changed', 'assigned', 'note_added', 'callback_requested', 'callback_completed'],
    required: true
  },
  field: {
    type: String,
    enum: ['status', 'assignedTo', 'notes', 'requestCallback', 'callbackStatus'],
    required: true
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  performedBy: userInfoSchema,
  performedAt: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String
  }
});

const LeadHistory = mongoose.model('LeadHistory', leadHistorySchema);

module.exports = LeadHistory; 