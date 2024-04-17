const mongoose = require('mongoose');
const moment = require('moment-timezone');

moment.tz.setDefault('Asia/Manila');

const theftdetailsschema = new mongoose.Schema({
  uniqueId: { type: String }, // No unique constraint specified
  happenedAt: {
    type: Date,
    default: () => moment.tz('Asia/Manila').add(8, 'hours').toDate() 
  },
  currentlatitude: { type: String },
  currentlongitude: { type: String }
});

const TheftDetails = mongoose.model('Theftdetails', theftdetailsschema);

module.exports = TheftDetails;
