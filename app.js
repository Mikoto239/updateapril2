const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const homeRouter = require('./home.js');
const Hardware = require('./models/hardware.js');
const ArduinoData = require('./models/arduinoData.js');
const User = require('./models/user.js');
const TheftDetails = require('./models/theftdetails');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


app.use(bodyParser.json());




app.post('/checkpinlocation', async (req, res) => {
    const { uniqueId } = req.body;
    try {
        const pinlocation = await Hardware.findOne({ uniqueId });

        if (!pinlocation) {
            return res.status(400).json({ message: "Invalid uniqueId" });
        }

        const latitude = pinlocation.currentlatitude;
        const longitude = pinlocation.currentlongitude;
        return res.status(200).json({ latitude: latitude, longitude: longitude });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/getlocation', async (req, res) => {
  const { uniqueId } = req.query;

  if (!uniqueId) {
    return res.status(400).json({ message: 'uniqueId is required' });
  }

  try {
    const results = await ArduinoData.find({ uniqueId });

    if (results.length === 0) {
      return res.status(404).json({ message: 'No information found' });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});





app.post('/data', (req, res) => {
  const { vibrationDuration, latitude, longitude, uniqueId } = req.body;

  const arduinoData = new ArduinoData({
    vibrationDuration,
    latitude,
    longitude,
    uniqueId
  });

  arduinoData.save()
    .then(() => {
      console.log('Data saved to MongoDB:', arduinoData);
      res.status(200).send('Data saved successfully!');
    })
    .catch(error => {
      console.error('Error saving data to MongoDB:', error);
      res.status(500).send('Failed to save data!');
    });
});


app.post('/deletecurrentlocation', async (req, res) => {
  const { uniqueId } = req.body;

  try {
    // Find the hardware document with the given uniqueId
    const hardware = await Hardware.findOne({ uniqueId });

    // If hardware document exists
    if (hardware) {
      // Update the hardware document to remove the latitude and longitude fields
      hardware.currentlatitude = 0;
      hardware.currentlongitude = 0;
      
      // Save the updated hardware document
      await hardware.save();
      
      // Send response
      res.status(200).json({ message: 'Latitude and longitude deleted successfully' });
    } else {
      // If hardware document with the given uniqueId is not found
      res.status(404).json({ message: 'Hardware not found' });
    }
  } catch (error) {
    // If an error occurs
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/currentlocation', async (req, res) => {
  const { name, uniqueId, email, cellphonenumber, pinlocation } = req.body;
  const finduser = await User.findOne({ name, email, uniqueId, cellphonenumber });
  try {
    if (!finduser) {
      return res.status(400).json({ message: "User not Found!" });
    }
    const hardwareid = finduser.uniqueId;
    // Assuming you want to update the pinlocation field and retrieve the updated hardware document
    const hardware = await Hardware.findOneAndUpdate({ uniqueId: hardwareid }, { pinlocation }, { new: true });
    if (!hardware) {
      return res.status(400).json({ message: "Hardware not Found!" });
    }

    return res.status(200).json({message:"Pin Successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/stopcurrentlocation', async (req, res) => {
  const { uniqueId, pinlocation, currentlatitude, currentlongitude } = req.body;
  console.log('Request body:', req.body); // Debug: log the incoming request body

  try {
    const hardware = await Hardware.findOneAndUpdate(
      { uniqueId: uniqueId },
      { pinlocation, currentlatitude, currentlongitude },
      { new: true }
    );

    if (!hardware) {
      console.log('Hardware not found for uniqueId:', uniqueId); // Debug: log if not found
      return res.status(404).json({ message: "Hardware not found" });
    }

    console.log('Updated hardware:', hardware); // Debug: log the updated document
    return res.status(200).json({ latitude: currentlatitude, longitude: currentlongitude });
  } catch (error) {
    console.error('Error updating hardware:', error); // More informative error logging
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.post('/checkuserregister', async (req, res) => {
    const { userName, email } = req.body; // Renamed 'name' to 'userName'

    try {
        // Find the user based on userName and email
        const user = await User.findOne({ name: userName, email });

        if (!user) {
            // If user not found, return 404 status with a message
            return res.status(404).json({ message: 'User not registered yet' });
        }

        // If user found, extract relevant information
        const { uniqueId, name, email: userEmail, cellphonenumber } = user; // Renamed 'name' to 'userName'

        // Return user information
        return res.status(200).json({ uniqueId, name, email: userEmail, cellphonenumber });
    } catch (error) {
        // If an error occurs, return 500 status with an error message
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


app.get('/getcurrentlocation', async (req, res) => {
  const { uniqueId } = req.query;

  try {
    const hardware = await Hardware.findOne({ uniqueId });

    if (!hardware) {
      return res.status(404).json({ message: 'Hardware not found' });
    }

    const pinStatus = hardware.pinlocation; 

    return res.status(200).json({ status: pinStatus });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/sendtheftdetails', async (req, res) => {
  const { uniqueId, currentlatitude, currentlongitude } = req.body;

  try {
    // Create new theft detail
    const theft = new TheftDetails({ uniqueId, currentlatitude, currentlongitude });
    await theft.save();
    
    return res.status(200).json({ message: 'Theft details saved successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/removetheftdetails', async (req, res) => {
  const { uniqueId } = req.body;

  try {
    const count = await TheftDetails.countDocuments({ uniqueId });
    if (count > 5) {
      const oldestTheftDetail = await TheftDetails.findOneAndDelete({ uniqueId }, { sort: { createdAt: 1 } });
      return res.status(200).json({ message: "Success" });
    } else {
      return res.status(400).json({ message: "No need to delete. Count is less than or equal to 5." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/userregister', async (req, res) => {
    const { name, uniqueId, email, cellphonenumber } = req.body;

    try {
        // Check if user already exists
        const findUser = await User.findOne({ uniqueId });

        if (findUser) {
            return res.status(400).json({ message: "User is already registered!" });
        }

        // Check if hardware exists
        const hardwareId = await Hardware.findOne({ uniqueId });

        if (!hardwareId) {
            return res.status(400).json({ message: "Hardware ID not found!" });
        }

        // Create new user
        const newUser = new User({ name, uniqueId, email, cellphonenumber });
        await newUser.save();

        return res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/deleteuser', async (req,res)=>{
  const {name,uniqueId,email} = req.body;
  
  try{
    const deleteduser = await User.findOneAndDelete({name,uniqueId,email});
    if(deleteduser){
      return res.status(200).json({message:"successfully deleted!"});
     }
     else{
      return res.status(400).json({message:"Unable to delete!"});
     }
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
 
});



app.post('/hardwareregister', async (req, res) => {
const { uniqueId } = req.body; // Extract the uniqueId from the request body

  try {
    // Check if the hardware with the uniqueId already exists
    const existingHardware = await Hardware.findOne({ uniqueId });

    if (existingHardware) {
      return res.status(400).json({ message: 'Hardware already registered' });
    } else {
      // Create a new hardware document
      const newHardware = new Hardware({ uniqueId });
      await newHardware.save();
      return res.status(200).json({ message: 'Hardware registered successfully' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/usernumber', async (req, res) => {
  const { uniqueId } = req.body; // Retrieve uniqueId from query parameters
  
  try {
    const user = await User.findOne({ uniqueId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    } 

    const userNumber = user.cellphonenumber;
    return res.status(200).json({ cellphonenumber: userNumber });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/hardwarestatus', async (req, res) => {
  const { uniqueId } = req.query;

  try {
    const hardware = await Hardware.findOne({ uniqueId });

    if (!hardware) {
      return res.status(404).json({ message: 'Hardware not found' });
    }

    const hardwareStatus = hardware.status; 

    return res.status(200).json({ status: hardwareStatus });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/changestatus', async (req, res) => {
  const { uniqueId, status } = req.body;

  try {
    const hardware = await Hardware.findOneAndUpdate({ uniqueId }, { status }, { new: true });

    if (!hardware) {
      return res.status(404).json({ message: 'Hardware not found' });
    }

    const hardwareStatus = hardware.status;

    return res.status(200).json({ status: hardwareStatus });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



app.post('/gethistory', async (req, res) => {
  const { uniqueId } = req.body;

  try {
    const results = await ArduinoData.find({ uniqueId });

    if (!results) {
      return res.status(404).json({ message: 'No information found' });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



app.use('/', homeRouter);

app.listen(PORT, () => {
  console.log(`Node.js server listening on port ${PORT}`);
});
