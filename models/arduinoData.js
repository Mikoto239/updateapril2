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
    default: () => moment.tz('Asia/Manila').add(8, 'hours').toDate() 
  }
});


const ArduinoData = mongoose.model('ArduinoData', arduinoDataSchema);

module.exports = ArduinoData;

