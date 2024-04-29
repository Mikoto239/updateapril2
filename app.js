const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const homeRouter = require('./home.js');
const Hardware = require('./models/hardware.js');
const ArduinoData = require('./models/arduinoData.js');
const User = require('./models/user.js');
const TheftDetails = require('./models/theftdetails');
const Pinlocation = require('./models/pinlocation');
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
      // Assuming you have a PinLocation schema/model
      const pinLocation = await Pinlocation.findOne({ uniqueId,statusPin:true}).sort({ pinAt: -1 });

      if (!pinLocation) {
          console.log("No pin location found for uniqueId:", uniqueId);
          return res.status(400).json({ message: "Invalid uniqueId" });
      } 
      
      const latitude = pinLocation.currentlatitude;
      const longitude = pinLocation.currentlongitude;
      const time = pinLocation.pinAt
      // Include l in the response JSON object
      return res.status(200).json({ latitude: latitude, longitude: longitude, time:time});
  } catch (error) {
      console.error("Error fetching pin location:", error);
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
  const { vibrationDuration, latitude, longitude, uniqueId ,level} = req.body;

  const arduinoData = new ArduinoData({
    vibrationDuration,
    latitude,
    longitude,
    uniqueId,
    level
  });

  arduinoData.save()
    .then(() => {
      console.log('Data saved to MongoDB:', arduinoData);
      res.status(200).send('Data saved successfully!');
    })
    .catch(error => {
  if (error.name === 'ValidationError') {
    console.error('Validation error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
  res.status(500).send('Failed to save data!');
});
});

app.post('/deletecurrentlocation', async (req, res) => {
  const { uniqueId ,statusPin} = req.body;

  try {
    // Find all pin locations with the specified uniqueId and statusPin as true
    const pinLocations = await Pinlocation.find({ uniqueId, statusPin: true });

    if (pinLocations.length === 0) {
      return res.status(404).json({ message: 'No pin locations found with specified uniqueId and statusPin as true' });
    }

    // Update statusPin to false for all found pin locations
    await Pinlocation.updateMany({ uniqueId, statusPin: true }, { statusPin: false });

    return res.status(200).json({ message: 'Updated pin locations status to false' });
  } catch (error) {
    console.error('Error updating pin locations:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
  const { uniqueId, pinlocation, currentlatitude, currentlongitude, statusPin } = req.body;

  try {
    // Find the hardware device by unique ID and update its pin location
    const hardware = await Hardware.findOneAndUpdate(
      { uniqueId },
      { pinlocation },
      { new: true }
    );

    if (!hardware) {
      // If hardware is not found, log the error and return a 404 error
      console.log('Hardware not found for uniqueId:', uniqueId);
      return res.status(404).json({ message: "Hardware not found" });
    }

    // Validate the current latitude and longitude
    if (currentlatitude == 0 || currentlongitude == 0) {
      // If location is invalid (assumes 0,0 is invalid), return an error
      return res.status(400).json({ message: "Invalid location" }); // Using 400 for bad request
    }

    // Since hardware exists and location is valid, save the new pin location
    const pinLocationSave = new Pinlocation({
      uniqueId,
      currentlatitude,
      currentlongitude,
      statusPin
    });
    await pinLocationSave.save();
    return res.status(200).json({
      message: "Location updated successfully",
      latitude: currentlatitude,
      longitude: currentlongitude
    });

  } catch (error) {
    // If there's an error during processing, log and return a 500 error
    console.error('Error updating hardware:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
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
  const { uniqueId, currentlatitude, currentlongitude ,description,level} = req.body;

  try {
    // Create a new theft detail instance
    const theftDetail = new TheftDetails({
      uniqueId,
      currentlatitude,
      currentlongitude,
      description,
      level
    });

    // Save the theft detail to the database
    await theftDetail.save();

    return res.status(200).json({ message: 'Theft details saved successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/removetheftdetails', async (req, res) => {
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

app.post('/gettheftdetails',async(req,res)=>{
  const {uniqueId} = req.body;
  
    try{
       const theft = await TheftDetails.findOne({ uniqueId }).sort({ happenedAt:-1 });
        if(!theft){
      return res.status(400).json({message:"no theft report"});
        }
      const theftlatitude = theft.currentlatitude;
      const theftlongitude = theft.currentlongitude;
      const theftdescription = theft.description;
      const theftlevel =theft.level
      const happened = theft.happenedAt;
  
      return res.status(200).json({latitude:theftlatitude,longitude:theftlongitude,time:happened,description:theftdescription,level:theftlevel});
  
    }catch(error){
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
    // Retrieve data from all collections
    const allPinLocation = await Pinlocation.find({ uniqueId });
    const allVibrate = await ArduinoData.find({ uniqueId });
    const allTheft = await TheftDetails.find({ uniqueId });

    // Merge data from all collections into one array
    let allData = [];
    allData = allData.concat(allPinLocation.map(data => ({ ...data.toObject(), collection: 'Pinlocation' })));
    allData = allData.concat(allVibrate.map(data => ({ ...data.toObject(), collection: 'ArduinoData' })));
    allData = allData.concat(allTheft.map(data => ({ ...data.toObject(), collection: 'TheftDetails' })));

    // Reverse the sort order based on timestamps
    allData.sort((a, b) => {
      const timestampA = a.pinAt || a.vibrateAt || a.happenedAt;
      const timestampB = b.pinAt || b.vibrateAt || b.happenedAt;
      return new Date(timestampB) - new Date(timestampA); // Reversed order here
    });

    if (!allData.length) {
      return res.status(400).json({ message: "No record found" });
    }

    res.status(200).json({ data: allData });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/getnotification', async (req, res) => {
  const { uniqueId } = req.body;
  try {
    // Retrieve the latest data from ArduinoData collection
    const latestVibrate = await ArduinoData.findOne({ uniqueId }).sort({ vibrateAt: -1 }).limit(1);

    // Retrieve the latest data from TheftDetails collection
    const latestTheft = await TheftDetails.findOne({ uniqueId }).sort({ happenedAt: -1 }).limit(1);

    // Determine which data is the latest based on timestamps
    let latestData = null;
    if (latestVibrate && latestTheft) {
      // Compare timestamps to find the latest data
      latestData = latestVibrate.vibrateAt > latestTheft.happenedAt ? { ...latestVibrate.toObject(), collection: 'ArduinoData' } : { ...latestTheft.toObject(), collection: 'TheftDetails' };
    } else if (latestVibrate) {
      latestData = { ...latestVibrate.toObject(), collection: 'ArduinoData' };
    } else if (latestTheft) {
      latestData = { ...latestTheft.toObject(), collection: 'TheftDetails' };
    }

    if (!latestData) {
      return res.status(400).json({ message: "No record found" });
    }

    res.status(200).json({ data: [latestData] });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});



app.post('/getpinhistory', async (req, res) => {
  const { uniqueId } = req.body; // Destructure uniqueId from req.body

  try {
    const pinhistory = await Pinlocation.find({ uniqueId });

    if (!pinhistory || pinhistory.length === 0) { // Check if pinhistory is empty
      return res.status(400).json({ message: 'No pin history recorded' });
    }

    return res.status(200).json({ pinhistory });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ message: 'Internal server error' });
  }
});



app.use('/', homeRouter);

app.listen(PORT, () => {
  console.log(`Node.js server listening on port ${PORT}`);
});
