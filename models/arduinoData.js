  const mongoose = require('mongoose');
  
  // Define the schema
  const arduinoDataSchema = new mongoose.Schema({
    vibrationDuration: String,
    latitude: Number,
    longitude: Number,
    uniqueId: String,
    CreatedAt: {
      type: Date,
          default: () => moment.tz('Asia/Manila').add(8, 'hours').toDate() 
    }
  });
  
  // Create the model
  const ArduinoData = mongoose.model('ArduinoData', arduinoDataSchema);
  
  module.exports = ArduinoData;
