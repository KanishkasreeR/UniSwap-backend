// const wishlistSchema = new Schema({
//     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//     productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
//     addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }

//   });
  
//   const Wishlist = mongoose.model('Wishlist', wishlistSchema);
  
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define the schema for the Wishlist
const WishlistSchema = new mongoose.Schema({
    products: [{ type: Schema.Types.ObjectId, ref: 'Product', required: true }],
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' }

});

// Create the Wishlist model
const Wishlist = mongoose.model('Wishlist', WishlistSchema);

module.exports = Wishlist;