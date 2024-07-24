//
//creating instane of mongoose
const mongoose = require("mongoose");

//user schema
const categorySchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,

  },
  tag:{
    type: String,
  },  
  //multiple course exist(ek tag mutiple courses ko bhi ho skata hai)
  courses: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Course",
		},
	],

})

module.exports = mongoose.model("Category", categorySchema);
//