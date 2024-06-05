const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adTitle: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true
  },
  category:{
    type:String,
    required: true
  },
  photos: {
    type: [String],
    validate: [photosLimit, 'Maximum of 5 photos allowed'],
    required:true
  },
  // Other fields like price, condition, category, etc. can be added as needed
}, { timestamps: true });

// Custom validator function to limit the number of photos to 12
function photosLimit(value) {
  return value.length <= 5;
}

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
