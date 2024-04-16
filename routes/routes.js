const express = require("express");
const bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const router = express.Router();
// Import Express validatior
const { check,query, validationResult } = require("express-validator");

// Import Book Mongoose schemas
let Restaurant = require("../models/restaurant");
let User = require('../models/user');

// Use cookie-parser middleware

function verifyToken(req,res,next){
  console.log(req.cookies.jwtToken);
  const bearerHeadr = req.cookies.jwtToken
  if(typeof bearerHeadr != 'undefined'){
      const bearer = bearerHeadr.split(' ')
      const bearerToken = bearer[1]
      req.token = bearerToken
      next()
  }else{
    res.redirect('/login');
  }
}

const urlencodedParser = express.urlencoded({extended: false})
// api/restaurants
router.route("/").post((req,res)=>{
  // TODO: Add Restaurant to Db here
  async (req, res) => {
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
  }
}).get(cookieParser(), verifyToken, query('page').notEmpty().isNumeric(), query('perPage').notEmpty().isNumeric(), (req, res) => {
  console.log(validationResult(req));
  jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {

      if (err){
          console.log("here");
          res.render('error401');
   } else {
          const result = validationResult(req);
          if (result.isEmpty()) {
              const page = req.query.page;
              const perPage = req.query.perPage;
              const borough = req.query.borough;
              console.log(borough + "________borough");
              Restaurant.countRestaurants().then((count) => {
                      console.log(count);
                      numberOfPages = Math.ceil(count / perPage);
                      if (page <= numberOfPages && perPage < count && page >= 1 && perPage > 1) {
                          console.log(`page: ${page}`);

                          Restaurant.getAllRestaurants(page, perPage, borough).then((restaurants) => {
                                  // console.log("Restaurants");
                                  // console.log(restaurants);
                                  // Render index.hbs for pagination
                                  res.render('index', {
                                      data: restaurants,
                                      count: count,
                                      page: page,
                                      perPage: perPage,
                                      start: (((page - 1) * perPage) + 1),
                                      end: ((page - 1) * perPage) + perPage
                                  });
                                  //res.status(200).render("index", {
                                  //   restaurants: restaurants,layout: false 
                                  // });
                                  //  res.status(200).send(restaurants);
                              })
                              .catch((err) => {
                                  res.status(500).json({
                                      message: err.message
                                  });
                              });
                      } else {
                          console.log("false");
                          res.render('error404');
                      }
                  })
                  .catch((err) => {
                      res.status(500).json({
                          message: err.message
                      });
                  });
          } else {
              res.render('error400');
          }
      }
  });
});


  // TODO: Pagination
  // EXTRA: Validation of query params

// Views

  // Login And Registration
  router.route("/login").post(cookieParser(), (req, res) => {
    // Validate user input
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        bcrypt.compare(password, user.password)
          .then((result) => {
            if (result === true) {
              const accessToken = jwt.sign({email:email, password:user.password}, process.env.SECRETKEY);
              res.cookie('jwtToken',`bearer ${accessToken}`);
              // res.header('authorization', `Bearer ${accessToken}`);
              res.redirect("/api/restaurant/");
              
            } else {
              res.status(401).json({ message: "Invalid email or password" });
            }
          })
          .catch((err) => {
            res.status(500).json({ message: "Internal server error" });
          });
      })
      .catch((err) => {
        res.status(500).json({ message: "Internal server error" });
      });
  });

  router.route("/register").get((req,res)=>{
        res.render("register", {layout: 'auth'})
      }).post(urlencodedParser, [
        check('password', 'This Password must me 3+ characters long')
            .exists()
            .isLength({ min: 3 }),
        check('repassword', 'This Password must me 3+ characters long')
        .exists()
        .isLength({ min: 3 }),
        check('email', 'Email is not valid')
            .isEmail()
            .normalizeEmail()
    ],
    async (req, res) => {
            const errors =  validationResult(req)
            if(!errors.isEmpty()) {
                const alert = errors.array()
                res.render('register', {
                    errs: alert,
                    layout: 'auth.hbs' // do not use the default Layout (main.hbs) 
                });
            }
            if(errors.isEmpty()){
              try {
                // Validate user input
                const {email, password, repassword } = req.body;
                console.log(req.body);
                if(repassword != password){
                  return res.status(400).json({ message: 'Re-Enter the password correctly' });
                }
                // Check if the user already exists
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                  return res.status(400).json({ message: 'User already exists' });
                }
                // hash password
                bcrypt.hash(password, 10).then(
                      async hash=>{ 
                        // Create a new user
                        let user = User();
                        user.email = email
                        user.password = hash
                        user.isAdmin = false
                        try {
                          const result = await user.save();
                          res.redirect("/");  // this will be the new created ObjectId
                      } catch(error){
                        console.log(error);
                      }
                    }).catch(err=>{console.log(err); 
                });
              } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Internal server error' });
              }
            }
  

            
            
        }
  )
// Add Restaurant Form
router
  .route("/addRestaurant")
  .get(verifyToken,(req,res) =>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
      if (err){
        res.render('error401');
      } else {
        res.render('addForm');
        console.log("I am here");
      }
    })
  });
// Search Restaurant Form
  router
  .route("/search")
  .get(verifyToken,(req,res) =>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
      if (err){
        res.render('error401');
      } else {
    res.render("search")
      }
    })
  });

// Route that returns and deletes Restaurant based on id
router
  .route("/:id")
  .get(verifyToken,(req,res) =>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
      if (err){
        res.render('error401');
      } else {
        console.log('restaurant by id'+Restaurant.getRestaurantById(req.params.id));

        Restaurant.getRestaurantById(req.params.id).then((restaurant)=>{
          res.render("editForm", {restaurant:restaurant});
        })
        .catch((err) => {
          res.status(500).json({ message: err.message });
        }); 
      }
    })
  })
  .delete(verifyToken,(req,res) =>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
          if (err){
            res.render('error401');
          } else {
          Restaurant.deleteOne({_id:req.params.id})
          .then(()=>{
            res.status(200).send("Deleted Successfully");
          })
          .catch((err) => {
            res.status(500).json({ message: err.message });
          });
        }
      })  
    })
    .put(verifyToken,(req,res) =>{
      jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
            if (err){
              res.render('error401');
            } else {
              // TODO: Update Restaurant data 
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
            }
      })
  })













module.exports = router;
