const mongoose = require('mongoose');
const moment = require('moment-timezone');

moment.tz.setDefault('Asia/Manila');
const theftdetailsschema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true 
  },
  status: { type:Number},
 happenedAt: {
    type: Date,
    default: () => moment.tz('Asia/Manila').add(8, 'hours').toDate() 
  },
  currentlatitude: { type: String }, // Corrected typo in field name
  currentlongitude: { type: String } // Corrected typo in field name 
});

const TheftDetails = mongoose.model('Theftdetails', theftdetailsschema);

module.exports = TheftDetails;
