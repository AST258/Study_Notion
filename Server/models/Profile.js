//
//creating instane of mongoose
const mongoose = require("mongoose");

//user schema
const profileSchema = new mongoose.Schema({
  
  gender:{
    type: String,
  },
  dateOfBirth: {
    type: String,
  },
  about: {
    type:String,
    trim: true,
  },
  contactNumber:{
    type: Number,
    train: true,
  }
})

module.exports = mongoose.model("Profile", profileSchema);
//