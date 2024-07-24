const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

//resetPasswordToken
exports.resetPasswordToken = async(req, res) => {
   try{
         //get email from req body

        const email = req.body.email;

        //check user for this email(email validation)
        const user = await User.findOne({ email:email });
        if(!user){
          return res.json({
            success: false,
            message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
          });
        }

        //generate token
        const token = crypto.randomBytes(20).toString("hex");
        //update user by adding token and expiry time of token

        const updatedDetails = await User.findOneAndUpdate(
                        {email: email},//email ke basis pr search kr
                        {
                          token: token,
                          resetPasswordExpires: Date.now() + 3600000,//5min
                          //ye changes update kr do
                        },
                        {new: true}
        );
        console.log("DETAILS", updatedDetails);

        //generate link(front end pooort no =3000)
        const url = `http://localhost:3000/update-password/${token}`;
        //send mail containing url
        await mailSender( 
                      email, 
                      "Password Reset link", 
                      `Your Link for email verification is ${url}. Please click this url to reset your password.`
                    );

        //resonse to mail
        return res.json({
          success: true,
          message: 'Email sent successfully, Please Check Your email and change password',
        });


    }
    catch(error){
        console.log(error);
        return res.status(500).json({
          success: false,
          message: 'Something went wrong while reset password'
        })
    }

}
//resetPassword

exports.resetPassword = async(req, res) => {
    //date fetch
    try{
        const {
          password, 
          confirmPassword, 
          token
        } = req.body;
        //validation
        if(password !== confirmPassword){
          return res.json({
            success:false,
            message : 'Password and Confirm Password Does not Match',
          })
        }
        //get user details from db using tokken
        const userDetails = await User.findOne({token: token});
        ///if no entry of user found
        if(!userDetails){
          console.log("uploading");
          return res.json({
            success: false,

            message: 'Toekn is Invalid',
          });
        }
        //token time check
        if(!(userDetails.resetPasswordExpires > Date.now())){
          return res.status(403).json({
            success: false,
            message:'Token is Expired, Please Regenerate Token',
          })
        }

        //hash pass
        const hashedPassword = await bcrypt.hash(password, 10);

        //update password
        await User.findOneAndUpdate(
          {token: token},
          {password: hashedPassword},
          {new: true},
        );

        //return response
        return res.status(200).json({
          success: true,
          message: 'Password reset successful',
        });
    }
    catch(error){
      console.log(error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong while sending request password mail'
      })
    }
}