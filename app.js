require('dotenv').config()
const express = require("express");
const path = require("path");
const handlebars = require('express-handlebars');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const jwt=require('jsonwebtoken');


var restaurant_routes = require("./routes/routes");


function verifyToken(req,res,next){
    const bearerHeadr = req.cookies.jwtToken
    if(bearerHeadr != null){
        const bearer = bearerHeadr.split(' ')
        const bearerToken = bearer[1]
        req.token = bearerToken
        next()
    }
    next()
  }

// Connect to database

let host=process.env.URL;
let mydb=process.env.myDB;
mongoose.connect(host+mydb)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Error connecting to MongoDB:', err));
let db = mongoose.connection;

// Initialize express app
const app = express();



// Initialize built-in middleware for urlencoding and json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())
app.use(express.static("public"));
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
app.use("/api/restaurant", restaurant_routes);

app.use("/",verifyToken,(req, res) => {
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded)=> {
        if (err)
            res.render("login", { layout: 'auth' });
        else{
            res.redirect('/api/restaurant')
        }
    })
  });


app.use("/*", (req,res)=>{
    res.render("error404");
})
// Set constant for port
const PORT = process.env.PORT || 8000;

// Listen on a port
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));