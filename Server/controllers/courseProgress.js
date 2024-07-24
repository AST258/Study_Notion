const Course = require("../models/Course")
const CourseProgress = require("../models/CourseProgress")
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
const mongoose = require("mongoose")

exports.updateCoursePorgress = async (req, res)=>{
  const{
    courseId,
    subsectionId
  }=req.body

  try{
    //validation
    const subsection = await SubSection.findById(subsectionId)
    if(!subsection){
      return res.status(404).json({
        error:"Invalid Sub-Section"
      })
    }

    //find course progress doc for user and course
    let courseProgress = await CourseProgress.findOne({
      courseId: courseId,
      userId: userId,
    })

    if(!courseProgress){
      //if course progress doesnt exist
      return res.status(404).json({
        success: false,
        message: "Course progress Does not exist",
      })
    }else{
      //if exist check if subsection is already completed
      if(courseProgress.completedVideos.includes(subsectionId)){
        return res.status(400).json({
          error: "Subsection is already completed"
        })
      }
      //then push that subsection into completed videos arrays
      courseProgress.completedVideos.push(subsectionId)
    }

    //save updated course progress
    await courseProgress.save()

    return res.status(500).json({
      error: "Inetrnal server error"
    })

  }catch(error){
    console.error(error)
    return res.status(500).json({
      error: "Internal server error"
    })
  }
}


