let mongoose = require("mongoose");

let restaurantSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    restaurant_id: {
        type: String,
        required: true
    },
    grades: 
        [{
            date:Date,
            grade:String,
            score:String
        }]
        
    ,
    address:{
        building:String,
        coord:[Number],
        street:String,
        zipcode:String
    },
    cuisine: {
        type: String,
        required: true
    },
    borough: {
        type: String,
        required: true
    }
});


let Restaurant = module.exports = mongoose.model("restaurants", restaurantSchema);