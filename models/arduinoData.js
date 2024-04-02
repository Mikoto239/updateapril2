const mongoose = require('mongoose');
const timezone = require('moment-timezone');

timezone.tz.setDefault('Asia/Manila');

const arduinoDataSchema = new mongoose.Schema({
  vibrationDuration: Number,
  latitude: Number,
  longitude: Number,
  uniqueId: String,
  vibrateAt: {
    type: Date,
    default: () => timezone().toDate()
  }
});


const ArduinoData = mongoose.model('ArduinoData', arduinoDataSchema);

module.exports = ArduinoData;

