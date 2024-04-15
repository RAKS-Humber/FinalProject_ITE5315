const express = require("express");
const router = express.Router();
// Import Express validatior
const { check, validationResult } = require("express-validator");

// Import Book Mongoose schemas
let Restaurant = require("../models/restaurant");

// Attach routes to router
router
  .route("/")
  .post(async (req, res) => {
    try{
    // Async validation check of form elements
    console.log("started");
    await check("name", "Name is required").notEmpty().run(req);
    await check("cuisine", "cuisine is required").notEmpty().run(req);
    await check("borough", "Borough is required").notEmpty().run(req);
    await check("restaurant_id", "restaurant_id is required").notEmpty().run(req);
    await check("address", "Address is required").notEmpty().run(req);
    await check("grades", "Grades is required").notEmpty().run(req);
    //await check("building", "building is required").notEmpty().run(req);
    //await check("coord_0", "coord_0 is required").notEmpty().run(req);
    //await check("coord_1", "coord_1 is required").notEmpty().run(req);
    //await check("grades", "grades is required").notEmpty().run(req);
    //await check("score", "score is required").notEmpty().run(req);
    // Get validation errors
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      // Create new Restaurant from mongoose model
      let restaurant = new Restaurant();
      // Assign attributes based on form data
      restaurant.name = req.body.name;
      restaurant.cuisine = req.body.cuisine;
      restaurant.restaurant_id = req.body.restaurant_id;
      restaurant.borough = req.body.borough;
      //console.log(req.body.address.coord[0]+"---------coord0")
      restaurant.address=req.body.address;
      //restaurant.address.building = req.body.address.building;
      //restaurant.address.street = req.body.address.street;
      //restaurant.address.zipcode = req.body.address.zipcode;
      //restaurant.address.coord[0] = req.body.address.coord[0];
      //restaurant.address.coord[1] = req.body.address.coord[1];
      
      //console.log(typeof(req.body.grades));
      //var result = Object.entries(req.body.grades);
      //console.log(result[0]);
      const gradesData = req.body.grades.map(grade => ({
        date: grade.date.$date,
        grade: grade.grade,
        score: grade.score
    }));
     
      restaurant.grades=gradesData;

      console.log("restaurant name"+req.body.name);
      // Save Restaurant to MongoDB

      await restaurant.save();
      res.status(201).json(restaurant);
    } 
  }
  catch(err)
  {
    console.log(err.message);
  }
  });

router
  .route("/addRestaurant")
  .get((req,res) =>{
    res.render('addForm');
    console.log("I am here");
  });

  router
  .route("/editRestaurant")
  .post((req,res) =>{
    res.render("editForm", {restaurant: req.body})
    console.log(req.body);
    
  });

  router
  .route("/search")
  .get((req,res) =>{
    res.render("search")
    
  });
// Route that returns and deletes Restaurant based on id
router
  .route("/:id")
  .get((req, res) => {
    // Get Restaurant by id from MongoDB
    console.log('restaurant by id'+req.params.id);
    Restaurant.findById({_id:req.params.id}).lean()
    .then((restaurant)=>{
      res.render("editForm", {restaurant:restaurant});
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
   
  })
  .delete((req, res) => {
    // Create query dict
    
    // MongoDB delete with Mongoose schema deleteOne
    Restaurant.deleteOne({_id:req.params.id})
    .then(()=>{
      res.status(200).send("Deleted Successfully");
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
    
  })
  .put((req, res) => {
    // Create query dict
    const restaurant = {};
    restaurant.cuisine = req.body.cuisine;
    restaurant.borough = req.body.borough;
    console.log("cuisine"+req.body.cuisine);
    console.log("borough"+req.body.borough);
    Restaurant.updateOne({_id:req.params.id},{$set:restaurant})
    .then(()=>{
      //res.status(200).send("Deleted Successfully");
      console.log('Updated Successfully');
      res.status(200).send("Updated Successfully");
      //res.redirect("api/restaurant/"+req.params.id);
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
    
  })



module.exports = router;
