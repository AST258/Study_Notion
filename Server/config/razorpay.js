const Razorpay = require("razorpay");

//instance of razor pay(rafer razorpay doc)
exports.instance = new Razorpay({
  key_id : process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});