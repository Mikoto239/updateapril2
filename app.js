const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const homeRouter = require('./home.js');
const Hardware = require('./models/hardware.js');
const ArduinoData = require('./models/arduinoData.js');
const User = require('./models/user.js');
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
  const { vibrationDuration, latitude, longitude, uniqueId } = req.body; // Updated to include macAddress

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


app.post('/userregister', async (req,res)=>{
  const {name,uniqueId,email,cellphonenumber} = req.body;
  
   const finduser = await User.findOne({name,uniqueId,email,cellphonenumber});
   const hardwareId = await User.findOne({uniqueId});
  
   try{
    if(finduser){
      return res.status(400).json({message:"User and the Hardware is already registered!"});
     }
     else if(!finduser && hardwareId){
      return res.status(400).json({message:"Invalid UniqueId Please try again!"});
     }
     else{
         const user = new User({name,uniqueId,email,cellphonenumber});
         await user.save();
         return res.status(200).json({ message: 'registered successfully' });
     }
   }
   catch (error) {
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


app.get('/usernumber', async (req, res) => {
  const { uniqueId } = req.query;
  
  try {
    const user = await User.findOne({uniqueId:uniqueId});

    if (!user) {
      return res.status(404).json({ message: 'Cellphone Number not found!' });
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




app.get('/getme', async (req, res) => {
  ArduinoData.find()
    .then(data => {
      console.log('Retrieved data from MongoDB:', data);
      res.status(200).json(data);
    })
    .catch(error => {
      console.error('Error fetching data from MongoDB:', error);
      res.status(500).send('Failed to fetch data!');
    });
});


app.use('/', homeRouter);

app.listen(PORT, () => {
  console.log(`Node.js server listening on port ${PORT}`);
});
