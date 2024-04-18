const mongoose = require('mongoose');

// Define the schema
const arduinoDataSchema = new mongoose.Schema({
  vibrationDuration: String,
  latitude: Number,
  longitude: Number,
  uniqueId: String
}, {
  timestamps: true // Add createdAt and updatedAt timestamps
});

// Create the model
const ArduinoData = mongoose.model('ArduinoData', arduinoDataSchema);

module.exports = ArduinoData;
