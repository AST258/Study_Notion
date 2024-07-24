//profile details pehle sehi hai, to fir just update karo
const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
const {uploadImageToCloudinary } = require("../utils/imageUploader");

exports.updateProfile = async(req, res) =>{
  try{
        //get data
        const {
          dateOfBirth="",//(dob lo nahi ahe to np as it is optional
          about="", 
          contactNumber="", 
          firstName,
          lastName,
          gender} = req.body;

        //get userId(middlewear mai auth.js mai jab token ko decode kiya to use req.user mai daal diya hai, and this payload was generated at time of log in which has email id account type)
        //const userDetails = await User.findById(id);
        const id = req.user.id;
        //validate it
        if(
            !contactNumber || 
            !gender ||
            !id
          ){
          return res.status(400).json({
            success: false,
            message:'All fields are required',
          });
        }
        //findprofil as we have already made profile)/
        //we do not have profile id, but profile id is in userdetails
        const userDetails = await User.findById(id);
      
        const profile = await Profile.findById(userDetails.additionalDetails);
        
                // Update the profile fields
        userDetails.firstName = firstName || userDetails.firstName;
        userDetails.lastName = lastName || userDetails.lastName;
        profile.dateOfBirth = dateOfBirth || profile.dateOfBirth;
        profile.about = about || profile.about;
        profile.gender=gender || profile.gender;
        profile.contactNumber = contactNumber || profile.contactNumber;

        //db mai entry/update krne ke two ways 1)hamne obj nahi banaya hai then we can create entry usng create function 2)obj already hai, obj mai change krke save function se kkao
      // Save the updated profile
		    await profile.save();
		    await userDetails.save();
        //return resposne
        return res.status(200).json({
          success: true,
          message:'Profile Updated Successfully',
          profile,
          userDetails
        });
  }catch(error){
    return res.status(500).json({
      success: false,
      error:error.message,
    });
  }
};


//deleteAccount
exports.deleteAccount = async(req, res)=>{
  try{
    //to delete acct , we need id
    const id = req.user.id;
    //check valid id
		const user = await User.findById({ _id: id });
    if(!user){
      return res.status(404).json({
        success: false,
        message:'User not found',
      });
    }

    //deleteuser profile
    await Profile.findByIdAndDelete({_id: user.additionalDetails});

    //delete from enrolled account i.e unenrioll kro user ko



    //delete user
    await User.findByIdAndDelete({_id:id});
    
    //return response
    return res.status(200).json({
      success: true,
      message: 'User Deleted Successfully',
    })
///explore chrone job
  }catch(error){
    return res.status(500).json({
      success: false,
      message: 'User can not be deleted successfully',
    });
  }
};

//to get all user details
exports.getAllUserDetails = async (req, res)=>{
  try{
    //getid
    const id = req.user.id;
    //validation and get user  details
    //ifnd by id se puri details nahi milegi ex gender sirf id hai so use populate

    const userDetails = await User.findById(id)
                                        .populate("additionalDetails")
                                        .exec();
    console.log(userDetails);


    //return response
    return res.status(200).json({
      success: true,
      message: 'User Data fetched Successfully',
      data: userDetails,
    });
  }catch(error){
    return res.status(500).json({
      success:false,
      message:error.message,
    });
  }
}

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec()
    userDetails = userDetails.toObject()
    var SubsectionLength = 0
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0
      SubsectionLength = 0
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        )
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      })
      courseProgressCount = courseProgressCount?.completedVideos.length
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2)
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      })
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}


exports.updateDisplayPicture = async (req, res) => {
  try {

		const id = req.user.id;
	  const user = await User.findById(id);
	  if (!user) {
		return res.status(404).json({
            success: false,
            message: "User not found",
        });
	}
	const image = req.files.displayPicture ;
	if (!image) {
    //console.log("uploading");
		return res.status(404).json({
            success: false,
            message: "Image not found",
    });
  }
	const uploadDetails = await uploadImageToCloudinary(
	  	image,
		  process.env.FOLDER_NAME
	);
	//console.log(uploadDetails);

	const updatedImage = await User.findByIdAndUpdate(
                                        {_id:id},
                                        {image:uploadDetails.secure_url},
                                        { new: true }
                                      );

    res.status(200).json({
        success: true,
        message: "Image updated successfully",
        data: updatedImage,
    });
		
	} catch (error) {
    console.error('Error uploading profile picture:', error);

		return res.status(500).json({
            success: false,
            
            message: error.message,
        });
		
	}


}



exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id })

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnroled.length
      const totalAmountGenerated = totalStudentsEnrolled * course.price

      // Create a new object with the additional fields
      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        // Include other course properties as needed
        totalStudentsEnrolled,
        totalAmountGenerated,
      }

      return courseDataWithStats
    })

    res.status(200).json({ courses: courseData })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}