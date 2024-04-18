const mongoose = require('mongoose');
const moment = require('moment-timezone'); // Import the moment module

moment.tz.setDefault('Asia/Manila');

const pinlocationSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  uniqueId: String,
  pinAt: {
    type: Date,
    default: () => moment.tz('Asia/Manila').add(8, 'hours').toDate() 
  }
});


const Pinlocation = mongoose.model('pinlocation', pinlocationSchema);

module.exports = Pinlocation;
