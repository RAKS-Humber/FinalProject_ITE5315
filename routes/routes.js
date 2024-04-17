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
router.route("/").post(verifyToken, 
check("restaurant_name", "Name is required").notEmpty().isLength({ min: 2 }),
check("cuisine", "cuisine is required").notEmpty().isLength({ min: 2 }),
check("borough", "Borough is required").notEmpty().isLength({ min: 2 }),
check("building", "Building is required").notEmpty(),
check("street_address", "Street_address is required").notEmpty(),
check("postal_code", "Postal Code is required").notEmpty().isLength({ max: 6 }),
 (req, res) => {
        jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
          if (err){
            res.render('error401');
          } else {
            console.log("Adding a restaurant")
        try{
        
        const errors = validationResult(req);
        
        if (errors.isEmpty()) {
          

          
          const restaurant ={
          
          name : req.body.restaurant_name,
          cuisine : req.body.cuisine,
          
          borough : req.body.borough,

          address:{
            building:req.body.building,
            street:req.body.street_address,
            zipcode:req.body.postal_code
          }
          
          };

          //console.log(typeof req.body.grades);

          restaurant.grades = [];

          
          let grades = req.body.grades;

          if (!Array.isArray(grades)) {
              
              grades = [grades];
          }


          
          const restaurantGrades = [];
          grades.forEach((gradeEntry) => {
              console.log(gradeEntry.grade);
              const dateArray = gradeEntry.date;
              const gradeArray = gradeEntry.grade;
              const scoreArray = gradeEntry.score;
              
              
              
      
              if(dateArray!=null)
              {
                for (let i = 0; i < dateArray.length; i++) {
                    
                    const gradeObject = {
                        date: new Date(dateArray[i]), 
                        grade: gradeArray[i], 
                        score: scoreArray[i] 
                    };
        
                    
                    restaurantGrades.push(gradeObject);
                }
             }
              
          });

          restaurant.grades = restaurantGrades;  



          Restaurant.addNewRestaurant(restaurant).then(()=>{
            
            console.log(restaurant+"restaurant-------")
            res.redirect("/api/restaurant/?page=1&perPage=10")
            //res.render('addForm');
          })
          .catch((err) => {
            
            console.log(err.message+"error while adding a restaurant");
            const alert = err.array()
            res.render('addForm', {
              errs: alert
              
          });
              
          }); 
          
        }
        else
        {
          
            const alert = errors.array()
            res.render('addForm', {
                errs: alert
                
            });
        
        } 
      }
      catch(err)
      {
        res.render('error401');
        console.log(err.message);
      }
      console.log("adding form data");
      console.log("adding form data"+req.body.restaurant_name);
      
      }
      
    })
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
              res.redirect("/api/restaurant/?page=1&perPage=10");
              
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
  })
  
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
          res.render("editForm", {restaurant:restaurant,rest_id:req.params.id});
        })
        .catch((err) => {
          res.status(500).json({ message: err.message });
        }); 
      }
    })
  })
  .delete(verifyToken,(req,res) =>{
    console.log("delete");
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {

          if (err){
            console.log("error deleting")
            res.render('error401');
          } else {
          
            console.log("Deleting the restaurant"+req.params.rest_id);
          //Restaurant.deleteOne({_id:req.params.id})
          //.then(()=>{
          //  res.status(200).send("Deleted Successfully");
          //})
          //.catch((err) => {
          //  res.status(500).json({ message: err.message });
          //});
        }
      })  
    })
    .post(verifyToken,(req,res) =>{
      jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
            if (err){
              res.render('error401');
            } else {
              // TODO: Update Restaurant data 


             if(req.body.method_type =='delete')
             {
                console.log("Deleting the restaurant"+req.body.rest_id);
                Restaurant.deleteRestaurantById(req.body.rest_id).then(()=>{
                  //console.log('Deleted Successfully');
                  //res.render("addForm");
                  res.redirect("/api/restaurant/?page=1&perPage=10")
                  //console.log(restaurant+"restaurant updated successfully-------")
                  //res.render('addForm');
                })
                .catch((err) => {
                  //res.status(500).json({ message: err.message });
                  console.log(err.message+"error while updating a restaurant");
                    res.render('error401');
                    
                });
             } 
             else
             {
              console.log("uppdating restaurant details"+req.body.rest_id);

              const restaurant ={
               // Assign attributes based on form data
               name : req.body.restaurant_name,
               cuisine : req.body.cuisine,
               //restaurant.restaurant_id = req.body.restaurant_id;
               borough : req.body.borough,
   
               address:{
                 building:req.body.building,
                 street:req.body.street_address,
                 zipcode:req.body.postal_code
               }
               
               };
   
               console.log(typeof req.body.grades);
   
               restaurant.grades = [];
 
             
               const dateArray = req.body.grade_date;
               const gradeArray = req.body.grade_grade;
               const scoreArray = req.body.grade_score;
               
               console.log("dates as array"+req.body.grade_date);
               const restaurantGrades = [];
       
               if(dateArray!=null)
               {
                 for (let i = 0; i < dateArray.length; i++) {
                     
                     const gradeObject = {
                         date: new Date(dateArray[i]), 
                         grade: gradeArray[i], 
                         score: scoreArray[i] 
                     };
         
                     
                     restaurantGrades.push(gradeObject);
                 }
              }
              restaurant.grades = restaurantGrades;
             
   
               Restaurant.updateRestaurantById(restaurant,req.body.rest_id).then(()=>{
                 //res.render("editForm", {restaurant:restaurant});
                 //console.log(restaurant+"restaurant updated successfully-------")
                 //res.render('addForm');
                 res.redirect("/api/restaurant/?page=1&perPage=10")
               })
               .catch((err) => {
                 //res.status(500).json({ message: err.message });
                 console.log(err.message+"error while updating a restaurant");
                   res.render('error401');
                   
               });
             }
             
            }
      })
  })













module.exports = router;
