const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define the schema for the Wishlist
const CartSchema = new mongoose.Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }

});

// Create the Wishlist model
const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart;