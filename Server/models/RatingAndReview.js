//
//creating instane of mongoose
const mongoose = require("mongoose");

//user schema
const ratingAndReviews = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref:"user",
  },
  rating : {
    type: Number,
    required: true,
  },
  review:{
    type: String,
    required:true,
  },
  course: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "Course",
		index: true,
	},
  
})

module.exports = mongoose.model("RatingAndReview", ratingAndReviews);
//