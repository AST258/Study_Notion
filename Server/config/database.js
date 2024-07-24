//env file loading
require("dotenv").config();
//instance of mongoose
const mongoose =require("mongoose");

exports.connect = () => {
  mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology:true,
  })
  .then( () => console.log("DB Connected Successfully"))
  .catch((error) => {
    console.log("DB Connection failed");
    console.error(error);
    process.exit(1);
  })
}; 

