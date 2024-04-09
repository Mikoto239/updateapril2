const mongoose = require('mongoose');
const moment = require('moment-timezone');

// Set default timezone
moment.tz.setDefault('Asia/Manila');

const arduinoDataSchema = new mongoose.Schema({
  vibrationDuration: Number,
  latitude: Number,
  longitude: Number,
  uniqueId: String,
  vibrateAt: {
    type: Date,
    default: () => moment().toDate() // Use moment() to get current time
  }
});

const ArduinoData = mongoose.model('ArduinoData', arduinoDataSchema);

module.exports = ArduinoData;
