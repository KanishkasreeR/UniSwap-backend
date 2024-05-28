const mongoose = require('mongoose');

// Define the schema for the Wishlist
const CartSchema = new mongoose.Schema({
  productId: {
    type: String,
  },
  userID: [{
    type: String, 
  }],
  addedby:{
    type: String,
  }
});

// Create the Wishlist model
const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart;