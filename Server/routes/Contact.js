const express = require("express")
const router = express.Router()
const { contactUsController } = require("../controllers/ContactUs")

//router will tell 1)which path and what action to perform at that path(handlerfunction)
router.post("/contact", contactUsController)

module.exports = router