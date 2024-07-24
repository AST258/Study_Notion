//importing required modules
const express = require("express")
const router = express.Router()

//importing controllers

//1. course controller
const{
  createCourse,
  getAllCourses,
  getCourseDetails,
  getFullCourseDetails,
  editCourse,
  getInstructorCourses,
  deleteCourse,
} = require("../controllers/Course")

//2.categories ccontroller
const{
  showAllCategory,
  createCategory,
  categoryPageDetails,
} = require("../controllers/Category")

//section controller
const {
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/Section")

//subsection controller
const {
  createSubSection,
  updateSubSection,
  deleteSubSection,
} = require("../controllers/Subsection")

//rating 
const{
  createRating,
  getAverageRating,
  getAllRating,
}= require("../controllers/RatingAndReview")

//update course progress
const{
  updateCoursePorgress
} = require("../controllers/courseProgress");


//importing middleweares

const {
  auth,
  isInstructor,
  isAdmin,
  isStudent
} = require("../middlewares/auth")



//course routes

///courses can only be created by instructor
router.post("/createCourse", auth, isInstructor, createCourse)

//Add a Section to a Course
router.post("/addSection", auth, isInstructor, createSection)
// Update a Section
router.post("/updateSection", auth, isInstructor, updateSection)
// Delete a Section
router.post("/deleteSection", auth, isInstructor, deleteSection)
// Edit Sub Section
router.post("/updateSubSection", auth, isInstructor, updateSubSection)
// Delete Sub Section
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection)
// Add a Sub Section to a Section
router.post("/addSubSection", auth, isInstructor, createSubSection)

//get all registered courses
router.get("/getAllCourses", getAllCourses)

router.post("/getCourseDetails", getCourseDetails)
//get details of specific course
router.post("/getFullCourseDetails", auth, getFullCourseDetails)

// Edit Course routes
router.post("/editCourse", auth, isInstructor, editCourse)
// Get all Courses Under a Specific Instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)
// Delete a Course
router.delete("/deleteCourse", deleteCourse)

router.post("/updateCourseProgress", auth, isStudent, updateCoursePorgress);
// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************
// Category can Only be Created by Admin
// TODO: Put IsAdmin Middleware here
router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/showAllCategories", showAllCategory)
router.post("/getCategoryPageDetails", categoryPageDetails)

// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************
router.post("/createRating", auth, isStudent, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRating)

module.exports = router