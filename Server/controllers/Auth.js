const bcrypt = require("bcrypt");
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();



//sendotp


//function to send otp for email verification
// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
	try {
		const { email } = req.body;

		// Check if user is already present
		// Find user with provided email
		const checkUserPresent = await User.findOne({ email });
		// to be used in case of signup

		// If user found with provided email
		if (checkUserPresent) {
			// Return 401 Unauthorized status code with error message
			return res.status(401).json({
				success: false,
				message: `User is Already Registered`,
			});
		}

		var otp = otpGenerator.generate(6, {
			upperCaseAlphabets: false,
			lowerCaseAlphabets: false,
			specialChars: false,
		});
		const result = await OTP.findOne({ otp: otp });
		console.log("Result is Generate OTP Func");
		console.log("OTP", otp);
		console.log("Result", result);
		while (result) {
			otp = otpGenerator.generate(6, {
				upperCaseAlphabets: false,
			});
		}
		const otpPayload = { email, otp };
		const otpBody = await OTP.create(otpPayload);
		console.log("OTP Body", otpBody);

		res.status(200).json({
			success: true,
			message: `OTP Sent Successfully`,
			otp,
		});
	} catch (error) {
		console.log(error.message);
		return res.status(500).json({ success: false, error: error.message });
	}
};








//signup
exports.signUp = async(req, res)=>{
  try{
       
        //steps :fetch data from req body
      //validate it 
      //match both pass
      //check if user already exist if yes return 
      //find most recent and unique otp stored for new user
      //validate otp(match with users entry)
      //hash pass
      //create entry in db
      //return res


      //fetching data (this data is entered by user as input)
      const {
        firstName, 
        lastName,
        email,
        password, 
        confirmPassword,
        accountType, 
        contactNumber,
        otp
      } = req.body;
      ///validate data
      if(
        !firstName || 
        !lastName || 
        !email || 
        !password || 
        !confirmPassword || 
        !otp
      ){
        return res.status(403).json({
          success: false,
          message: "All fields are required", 
        })
      }

      //match passwords
      if(password !== confirmPassword){
        return res.status(400).json({
          success: false,
          message:"Password and Confirm Password do not match. Please try again.",
        });
      }

      //check if user already exist or not

      const existingUser = await User.findOne({email});
      if(existingUser){
        return res.status(400).json({
          success: false,
          message:'User is already exists. Please sign in to continue.',
        });
      }
      

      //finding most recent otp (The sort({ createdAt: -1 }) part sorts the results in descending order based on the createdAt field, so the most recent OTP is first.  limit(1) part limits the result to just one document, so it fetches the most recent OTP.)
      
      const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
      console.log(recentOtp);


      //ye  recentotp by user aur otp generated in sendotp function are matched 

      //validate otp
      if(recentOtp.length===0){
        //otp not found
        return res.status(400).json({
          success:false,
          message:'OTP Not Found',
        })
      }else if(otp !== recentOtp[0].otp){
        //invalid otp
        return res.status(400).json({
          success: false,
          message:'Invalid OTP',
        });
      }

      //hash pass
      const hashedPassword = await bcrypt.hash(password, 10);   // salt rounds value of 10, ensuring password security.

      // creating entry in DB

      // stroing entry of profile in db
      const profileDetails = await Profile.create({
        gender: null, 
        dateOfBirth: null,
        about: null,
        contactNumber: null,
      });
      const user = await User.create({
        firstName,
        lastName, 
        email, 
        contactNumber,
        password: hashedPassword,
        accountType,
        additionalDetails: profileDetails._id,  //obje of additionaldetailes created above
        image: 'https://api.dicebear.com/5.x/initials/svg?seed=${firstname} ${lastname}',
      })

      //return resp
      return res.status(200).json({
        success: true,
        message: 'User is registered Successfully',
        user,
      })
  }
  catch(error){
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again"
    })
  }
}



//login
exports.login = async(req, res)=>{
  try{
    //steps =>  get data from req body
    //validate data
    //checek if user exist or not
    //generate jwt token after password matching
    //create cookie and send response

    //1)get data
    const {email, password}= req.body;

    //2)Check if email or password is missing
    if(!email || !password){// email ya pass empty hoga to
      return res.status(400). json({
        success: false,
        message: 'Please Fill up All the Required Fields',
      })
    }
    ///3) check if user exist before
    const user = await User.findOne({email}).populate("additionalDetails");// find using email

    // If user not found with provided email
    if(!user){ 
      return res.status(401).json({
        success: false,
        message:"User is not registered, Please SignUp to Continue",
      });
    }
    //4)generate jwt tokaen if all details are valid
    //first match password (for this the compare function of bcrypt will be used.)
    if(await bcrypt.compare(password, user.password)){
      // After a user logs in successfully, a JWT is generated using sign function
      const payload={
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      }
      //Generate JWT Token:
      const token = jwt.sign(
                            payload, 
                            process.env.JWT_SECRET, { 
                              expiresIn:"2h",
                            }
        //jwtsecrete defined in .env(Only the server that has the secret key can verify the integrity of the token.)
                            )
      //Store Token in the user document, password is removed
      user.token= token;
      user.password= undefined;


      //5)Set cookie for token and return success responses
      //token is set as an HTTP-only cookie (enhancing security by preventing client-side scripts from accessing it) and sent in the response.
      const options = {
          expires: new Date(Date.now() + 3*24*60*60*1000), //valid for 3 days
          httpOnly: true,  //avoid XSS Attack
      }
      //server sends token to the client.
      res.cookie("token", token, options).status(200).json({
                  success: true,
                  token,
                  user,
                  message:'Logged in Successfully',
      })

    }else{
      return res.status(401).json({
        success: false,
        message:'Password is Incorrect',
      })
    }


  }
  catch(error){
    console.log(error);
    return res.status(500).json({
      success: false,
      message:'Login failure, please try again',
    })
  }
}

// Controller for Changing Password
exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id)

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" })
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      )
      console.log("Email sent successfully:", emailResponse.response)
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      })
    }
    //return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error)
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })


  }
}
