const mongoose = require('mongoose');
const moment = require('moment-timezone');

moment.tz.setDefault('Asia/Manila');

const theftdetailsschema = new mongoose.Schema({
  happenedAt: {
    type: Date,
    default: () => moment.tz('Asia/Manila').add(8, 'hours').toDate() 
  },
  currentlatitude: { type: String },
  currentlongitude: { type: String },
   uniqueId: { type: String }
});

const TheftDetails = mongoose.model('Theftdetails', theftdetailsschema);

module.exports = TheftDetails;
