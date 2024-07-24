const Category = require("../models/Category");
const Course= require("../models/Course");

//create a tag handler function
exports.createCategory = async (req, res) => {
  try{
    //fetching data
    const {name, description}= req.body;
    //validation
    if(!name || !description){
      return res.status(400).json({
        success : false,
        message : 'All fields are required',
      })
    }
    
    //create entry in db
    const CategoryDetails = await Category.create({
                                      name: name,
                                      description: description,
                                    });
    console.log(CategoryDetails);

    //return response
    return res.status(200).json({
      success:true,
      message:"Category created Successfully",
    })
    
  }catch(error){
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};

//get all categories
exports.showAllCategory = async(req, res)=>{
  try{
    //get all categories only make sure that tag should have name and description
    const allCategories = await Category.find(
                    {}, 
                    {name: true, description: true}
                  );
    res.status(200).json({
      success: true,
      allCategories,
    })
  }catch(error){
    return res.status(200).json({
      success: false,
      message:error.message,
    })
  }
}


exports.categoryPageDetails = async (req, res) => {
  try {
    //get course id
    const { categoryId } = req.body

    // Get courses for the specified category
    const selectedCategory = await Category.findById(categoryId).populate("courses").exec();
    //populate because courses has ref and we dont want ref
    

    console.log("SELECTED COURSE", selectedCategory);
    
    // Handle the case when the category is not found(validation)
    if (!selectedCategory) {
      console.log("Category not found.")
      
      return res.status(404).json(
          { success: false, 
            message: "Category not found" 
          });
    }
    // Handle the case when there are no courses with selected category
    if (selectedCategory.courses.length === 0) {
      console.log("No courses found for the selected category.")
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      })
    }

    // Get courses for other categories
    const categoriesExceptSelected 
            = await Category.find({
                        _id: 
                            { 
                              $ne: categoryId 
                              //ne-not equal to
                            },
                      }).populate("courses");

    let differentCourses = [];
    for(const category of categoriesExceptSelected){
      differentCourses.push(...category.courses);
    }
    
    // Get top-selling courses across all categories
    const allCategories = await Category.find()
      .populate("courses");
    
    const allCourses = allCategories.flatMap((category) => category.courses);

    
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10)
     // console.log("mostSellingCourses COURSE", mostSellingCourses)
    res.status(200).json({
        selectedCourses: selectedCourses,
        differentCourses: differentCourses,
        mostSellingCourses: mostSellingCourses,
      
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}; 


//add course to category
exports.addCourseToCategory = async (req, res) => {
	const { courseId, categoryId } = req.body;
	// console.log("category id", categoryId);
	try {
		const category = await Category.findById(categoryId);
		if (!category) {
			return res.status(404).json({
				success: false,
				message: "Category not found",
			});
		}
		const course = await Course.findById(courseId);
		if (!course) {
			return res.status(404).json({
				success: false,
				message: "Course not found",
			});
		}
		if(category.courses.includes(courseId)){
			return res.status(200).json({
				success: true,
				message: "Course already exists in the category",
			});
		}
		category.courses.push(courseId);
		await category.save();
		return res.status(200).json({
			success: true,
			message: "Course added to category successfully",
		});
	}
	catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
}