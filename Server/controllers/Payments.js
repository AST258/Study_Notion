//install razor pay npm i razorpay
//instance of razorpay created in config file
const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");

//capture the payment and initiate razorpay order
exports.capturePayment = async(req, res) => {
  //get courseid and userid
  //then validate
  //check valid course id , coursedetails
  //check if user has already paid for the same course if yes then stop
  //create order and return response

  //course id user id
  const {course_id} = req.body;
  const userId = req.user.id;
  //validation

  if(!course_id){
    return res.json({
      success: false,
      message: ' Please provide valid course ID',
    })
  };
  ///check is the course details of given course id are valid or not
  let course;
  try{
    course = await Course.findById(course_id);
    if(!course){
      return res.json({
        success: false,
        message: 'Could not find the course',
      })
    }
    //check is user already paid for same course earlier
    //Course ke model mai user id is in form of obj id and here user id is for string. therefore convert it from string to obj id
    const uid = new mongoose.Types.ObjectId(userId);
    //is uid exist already 
    if(course.studentsEnrolled.includes(uid)){
      return res.status(200).json({
        success: false,
        message: 'Student is already enrolled',
      })
    }

  }catch(error){
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }

  //create order//referee razor pay doc
  //instance created in config- razor pay
  const amount = course.price;
  const currency= "INR";

  const options={
    amount: amount*100,
    currency,
    //below fields are optional
    //receipt no is taken as random no
    receipt: Math.random(Date.now()).toString(),
    notes:{
      courseId: course_id,
      userId,
    }
  };

  //for this function refer razor pay doc
  try{
    //initiate payment using razorpay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);

    return res.status(200).json({
      success: true,
      courseName : course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  }catch(error){
    console.log(error);
    res.json({
      success: false,
      message:"Could not initiate order",
    });
  }
};

//verify signature of razorpay and server

exports.verifySgnature = async(req, res)=>{
  //match the secrete in the server and razorpay secret
  
    const webhookSecrete = "12345678";

    const signature = req.headers("x-razorpay-signature");

    const shasum = crypto.createHmac("sha256", webhookSecrete);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

  if(signature===digest){
    console.log("Payment is Authorised");

    ///req api se ayi hai razorpay se , verify signature route ko, yaha front end se nahi aai to fir req body se courseid, userid nhi milega, above we have used notes in options thats why
    //now notes ka obj req-body-payload-entity-notes is path pr ha

    const {courseId, userId} = req.body.payload.payment.entity.notes;

    try{
        //fulfil the action of enrolling student in course
        const enrolledCourse = await Course.findOneAndUpdate(
          {_id: courseId},
          {$push:{
            studentsEnrolled: userId
          }},
          {new: true},
        );
        if(!enrolledCourse){
          return res.status(500).json({
            success: false,
            message: 'Course not Found',
          });
        }

        console.log(enrolledCourse);

        //studnet ki list bhi update kro
        //find the student and addd course to their enrolled courses

        const enrolledStudent = await user.findOneAndUpdate(
          {_id: userId},
          {$push:{
            courses: courseId
          }},
          {new: true},
        );
        console.log(enrolledStudent);
        
        //now send mail to student about his enrollement

        const emailResponse = await mailSender(
                            enrolledStudent.email,
                            "Congratulations from codehelp",
                            "Congratulations, you are onboearded into new CodeHelp Course",

        );
        console.log(emailResponse);
        return res.status(200).json({
          success: true,
          message: "Signature Verified and Course Added",
        });
    }catch(error){
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }

  }else{
    return res.status(400).json({
      success: false,
      message: "Invalid request",
    });
  }
  

};


// verify the payment
exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id
  const razorpay_payment_id = req.body?.razorpay_payment_id
  const razorpay_signature = req.body?.razorpay_signature
  const courses = req.body?.courses

  const userId = req.user.id

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(200).json({ success: false, message: "Payment Failed" })
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex")

  if (expectedSignature === razorpay_signature) {
    await enrollStudents(courses, userId, res)
    return res.status(200).json({ success: true, message: "Payment Verified" })
  }

  return res.status(200).json({ success: false, message: "Payment Failed" })
}



// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body

  const userId = req.user.id

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the details" })
  }

  try {
    const enrolledStudent = await User.findById(userId)

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    )
  } catch (error) {
    console.log("error in sending mail", error)
    return res
      .status(400)
      .json({ success: false, message: "Could not send email" })
  }
}
