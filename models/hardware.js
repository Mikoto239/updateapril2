const mongoose = require('mongoose');
const moment = require('moment-timezone');

// Set the default timezone to Asia/Manila
moment.tz.setDefault('Asia/Manila');

const hardwareSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true 
  },
  status: { type: Boolean, default: true },
  registeredAt: {
    type: Date,
    default: () => moment().toDate() // Use moment() to get the current date and time
  }
});

const Hardware = mongoose.model('Hardware', hardwareSchema);

module.exports = Hardware;