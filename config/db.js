const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');
// require('dotenv').config();
// const db = process.env.mongoURI;

const connectDB = async () => {
  try {
    //await to connect to cluster using URI
    await mongoose.connect(db);
    console.log('MongoDB Connected...');
  } catch (error) {
    console.log(error.message);
    //Exit Process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
