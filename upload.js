const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Cart = require('./Cart')
const Product = require('./Products');
const Category = require('./Category'); 

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
});
  
// Initialize Cloudinary
cloudinary.config({
    cloud_name: 'djxbzcayc',
    api_key: '177435834375344',
    api_secret: 'VC8o4lQSa551ADbsUtPtV3jIaO4'
});
  

const upload = multer({ storage: storage }).array('images', 12); // Accepts up to 12 images
  
// Multer error handler middleware
router.use(function(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed per file.' });
        } else {
            return res.status(400).json({ error: 'File upload error' });
        }
    } else if (err) {
        console.error('Unknown error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } else {
        next(); // No multer error, continue to next middleware
    }
});

router.post('/uploadProducts', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: 'File upload error' });
        }
  
        try {
            const { adTitle, description, price,category,userId } = req.body;
            const images = req.files.map(file => file.path); // Paths to the uploaded image files
  
            // Upload images to Cloudinary
            const uploadResponses = await Promise.all(images.map(image => cloudinary.uploader.upload(image)));
  
            // Extract URLs from Cloudinary responses
            const imageUrls = uploadResponses.map(response => response.url);

            // Check if the count of image URLs exceeds 5
            if (imageUrls.length > 5) {
                return res.status(400).json({ error: 'Maximum 5 images are allowed' });
            }
  
            // Save book details to database
            const product = new Product({
                adTitle,
                description,
                price,
                userId,
                category, // Use the userId received from frontend
                photos: imageUrls // Store the image URLs from Cloudinary in an array
            });
            await product.save();
  
            res.status(200).json({ message: 'Product added successfully' });
        } catch (error) {
            console.error('Error occurred while adding book:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.post('/addToCart', async (req, res) => {
        try {
          const { productId, userId, addedby } = req.body;
      
          // Check if any of the required values are missing
          if (!productId || !userId || !addedby) {
            return res.status(400).json({ error: 'Missing productId, userId, or addedby' });
          }
      
          // Check if the cart exists for the customer
          let cart = await Cart.findOne({ productId });
      
          // If Cart doesn't exist, create a new one
          if (!cart) {
            cart = new Cart({ productId, userId, addedby });
          }
      
          // Check if the product is already in the Cart
          if (cart.products.includes(productId)) {
            return res.status(400).json({ error: 'Product already exists in Cart' });
          }
      
          // Add the productId to the Cart
          cart.products.push(productId);
          
          // Save the updated Cart
          await cart.save();
      
          // Respond with success message
          res.status(200).json({ message: 'Product added to Cart successfully' });
        } catch (error) {
          console.error('Error adding product to Cart:', error);
          res.status(500).json({ error: 'Failed to add product to Cart' });
        }
      });
});

router.get('/products', async (req, res) => {
    try {
      const { category } = req.query;
      const filter = {};
  
      // Filter by category if provided
      if (category) {
        filter.category = category;
      }
  
      const products = await Product.find(filter);
  
      res.status(200).json(products);
    } catch (error) {
      console.error('Error occurred while fetching products:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  

const categoryImages = {
  "Fruits & Vegetables": "https://via.placeholder.com/150?text=Fruits+%26+Vegetables",
  "Dairy & Bakery": "https://via.placeholder.com/150?text=Dairy+%26+Bakery",
  "Staples": "https://via.placeholder.com/150?text=Staples",
  "Snacks & Branded Foods": "https://via.placeholder.com/150?text=Snacks+%26+Branded+Foods",
  "Beverages": "https://via.placeholder.com/150?text=Beverages",
  "Personal Care": "https://via.placeholder.com/150?text=Personal+Care",
  "Home Care": "https://via.placeholder.com/150?text=Home+Care",
  "Books": "https://via.placeholder.com/150?text=Books",
  "Pets": "https://via.placeholder.com/150?text=Pets"
};

// router.get('/categories-with-products', async (req, res) => {
//   try {
//     const categories = await Product.distinct('category');
//     const categoriesWithImages = categories.map(category => ({
//       name: category,
//       imageUrl: categoryImages[category] || 'https://via.placeholder.com/150?text=No+Image'
//     }));

//     res.status(200).json(categoriesWithImages);
//   } catch (error) {
//     console.error('Error occurred while fetching categories with products:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
router.get('/categories-with-products', async (req, res) => {
  try {
    // Get distinct categories from products
    const categories = await Product.distinct('category');
    
    // Find categories in Category collection
    const categoriesWithImages = await Category.find({ name: { $in: categories } });
    
    // const categoriesWithPredefinedImages = categoriesWithImages.map(category => ({
    //   name: category.name,
    //   imageUrl: category.imageUrl || categoryImages[category.name] || 'https://via.placeholder.com/150?text=No+Image'
    // }));

    res.status(200).json(categoriesWithImages);
  } catch (error) {
    console.error('Error occurred while fetching categories with products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
