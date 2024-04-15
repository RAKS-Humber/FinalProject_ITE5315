require('dotenv').config()
const express = require("express");
const exphbs = require('express-handlebars');
const path = require("path");
// Import mongoose
const mongoose = require("mongoose");

var restaurant_routes = require("./routes/restaurants");


// Connect to database

let host=process.env.URL;

let mydb=process.env.myDB;

mongoose.connect(host+mydb)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Error connecting to MongoDB:', err));
let db = mongoose.connection;

// Check connection

// Check for DB errors


// Initialize express app
const app = express();



// Initialize built-in middleware for urlencoding and json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
const handlebars = require('express-handlebars');
app.engine('.hbs', handlebars.engine(
    {
        extname: '.hbs',
        helpers: {
            nextPage: function(page) {
                console.log(page);
                return page+1;
            },
            prevPage: function(page) {
                console.log(page);
                return page-1;
            },
        },
    }
));
app.set('view engine', 'hbs');
let Restaurant = require("./models/restaurant");
const { Console } = require('console');

// Load view engine
//app.set("/", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use("/api/restaurant", restaurant_routes);


app.use("/", function (req, res) {
    const page=Number(req.query.page)||1;
    const perPage=Number(req.query.perPage)||5;
    const borough=req.query.borough;
    let filter={};

    if(borough!=undefined)
    {
        filter.borough=borough;
    }
    console.log(borough+"________borough");
    Restaurant.countDocuments().then((count)=>{
        console.log(count);
        numberOfPages = Math.ceil(count/perPage);
        console.log(`Page number: ${page}`);
        console.log(`Number of Pages: ${numberOfPages}`);
        if(page <= numberOfPages && perPage < count && page > 0 && perPage > 0){
            console.log(page);
            Restaurant.find(filter)
            .sort({restaurant_id:1})
            .skip((page-1)*perPage)
            .limit(perPage)
            .lean()
            .then((restaurants)=>{
                // console.log("Restaurants");
                // console.log(restaurants);
                // Render index.hbs for pagination
                res.render('index', {data: restaurants, count:count,page: page,perPage: perPage,start: (((page-1)*perPage)+1), end:((page-1)*perPage)+perPage});
                //res.status(200).render("index", {
                 //   restaurants: restaurants,layout: false 
                 // });
                //  res.status(200).send(restaurants);
            })
            .catch((err) => {
                res.status(500).json({ message: err.message });
            });
        } else{
            console.log("false");
            res.render('error404');
        }
    });



});

// Set constant for port
const PORT = process.env.PORT || 8000;

// Listen on a port
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));