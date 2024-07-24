const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { mongo, default: mongoose } = require("mongoose");

//create rating 
exports.createRating = async(req, res)=>{
  try{
    //get useid(user will give rating)
    const userId = req.user.id;
    //fetch data from req body
    const { rating, review, courseId}=req.body;
    //check if user is enrolled or not
    const courseDetails = await Course.findOne({
                      _id: courseId,
                      studentsEnrolled:{
                        $elementMathc:
                                  {$req: userId},
                      }
                  });

    if(!courseDetails){
      return res.status(404).json({
        success: false,
        message:'Student is not enrolled in the course',
      });
    }
    //check if user already reviewd or not
    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });
    //allow only one time review
    if(alreadyReviewed){
      return res.status(403).json({
        success: false,
        message: 'Course is already reviewd by the user',
      });

    }
    //create rating and review
    const ratingReview = await RatingAndReview.create(
      {
        rating, 
        review, 
        course: courseId, 
        user:userId,
      }
    );
    //update course in the course
    const updatedCourseDetails= await Course.findByIdAndUpdate({_id:courseId},
      {
        $push:{
          ratingAndReview: ratingReview._id,
        }
      },
      {new: true}
    );
    console.log(updatedCourseDetails);
    //return response
    return res.status(200).json({
      success: true,
      message: "Rating and Review created successfully",
      ratingAndReview,
    })

  
  }catch(error){
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
//get average rating
exports.getAverageRating = async (req, res)=>{
  try{
    //get courseId
    const courseId=req.body.courseId;
    //calculate avg rating
    const result = await RatingAndReview.aggregate([
      {
        $match:{
          //courseid inititaly string this use obj id mai convert kr diya
          //fetched the all entries having has given courseid 
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $group:{
          _id: null,
          averageRating: {$avg: "$rating"},
        }
      }
    ])//aggreagate function returns a array
    //return rating
    if(result.length>0){

      return res.status(200).json({
        success: true,
        averageRating: result[0].aggregateRating,
        //result ke 0th index pr avg rating pass kr di jo ki upar define ki thi
      })
    }

    //if no rating/review exist
    return res.status(200).json({
      success: true,
      message:'Average Rating is 0, no rating given till now',
      averageRating:0,
    })

  }catch(error){
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

//get all ratingand reviews

exports.getAllRating = async(req, res)=>{
  try{
    const allReviews = await RatingAndReview.find(
                  { //koi criteria nahi hai sara data uthao
                  })
                  .sort({rating:"desc"})
                  //rating in descending order
                  .populate({
                    path:"user",
                    select:"firstName lastName email image",
                  })
                  .populate({
                    path:"course",
                    select:"courseName",
                  })
                  .exec();
    return res.status(200).json({
      success: true,
      message: "All reviews fetched successfully",
    });
  }catch(error){
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}