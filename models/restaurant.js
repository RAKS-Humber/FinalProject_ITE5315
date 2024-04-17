// restaurantDB.js

const mongoose = require('mongoose');

// Define the Restaurant schema
const restaurantSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  restaurant_id: {
    type: String,
    required: false
  },
  grades: [{
    date: Date,
    grade: String,
    score: String
  }],
  address: {
    building: String,
    coord: [Number],
    street: String,
    zipcode: String
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

// Define the Restaurant model
let Restaurant =mongoose.model('Restaurant', restaurantSchema);

// Function to initialize the connection and model
function initialize(connectionString) {
  return new Promise((resolve, reject) => {
    mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

// Function to add a new restaurant
function addNewRestaurant(data) {
  const newRestaurant = new Restaurant(data);
  return newRestaurant.save();
}

// Function to get all restaurants with pagination and optional borough filter
function getAllRestaurants(page, perPage, borough) {
  const skip = (page - 1) * perPage;
  let query = Restaurant.find().skip(skip).limit(perPage).lean().sort({ restaurant_id: 1 });
  
  if (borough) {
    query = query.where('borough').equals(borough);
  }
  return query.exec();
}

// Function to get a restaurant by ID
function getRestaurantById(id) {
  return Restaurant.findById(id).lean().exec();
}

// Function to update a restaurant by ID
function updateRestaurantById(data, id) {
  return Restaurant.findByIdAndUpdate(id, data, { new: true }).exec();
}

// Function to delete a restaurant by ID
function deleteRestaurantById(id) {
  return Restaurant.findByIdAndDelete(id).exec();
}

function countRestaurants() {
    return Restaurant.countDocuments().exec();
}

module.exports = {
  Restaurant,
  initialize,
  addNewRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
  countRestaurants
};
