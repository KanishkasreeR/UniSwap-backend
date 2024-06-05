const express = require('express');
const multer = require('multer');
const webpush = require('web-push');
const cloudinary = require('cloudinary').v2;
const Cart = require('./Cart')
const Wishlist = require('./Wishlist')
const Product = require('./Products');
const Order = require('./OrderSchema.js');
const User = require("./UserSchema");

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
});

const vapidKeys = {
  publicKey: 'BG-gHGGmgLtEgtlDNhe_8mK5wJeGQ6ALM2CVfpXaBIRb-3AdU3H5D4_ZcAeISfXpV2y4K_aj5-JItyNmOA628B0',
  privateKey: 'LiJaDYu9sAcsxwGiIAQP7nliLgKoNSYsGwiVhPNSdbY'
};

webpush.setVapidDetails(
  'mailto:kanishkasree804@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);
  
// Initialize Cloudinary
cloudinary.config({
    cloud_name: 'djxbzcayc',
    api_key: '177435834375344',
    api_secret: 'VC8o4lQSa551ADbsUtPtV3jIaO4'
});
  
// Multer upload middleware
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

// router.post('/uploadProducts', (req, res) => {
//     upload(req, res, async (err) => {
//         if (err) {
//             console.error('Multer error:', err);
//             return res.status(400).json({ error: 'File upload error' });
//         }
  
//         try {
//             const { adTitle, description, price,category,userId } = req.body;
//             const images = req.files.map(file => file.path); // Paths to the uploaded image files
  
//             // Upload images to Cloudinary
//             const uploadResponses = await Promise.all(images.map(image => cloudinary.uploader.upload(image)));
  
//             // Extract URLs from Cloudinary responses
//             const imageUrls = uploadResponses.map(response => response.url);

//             // Check if the count of image URLs exceeds 5
//             if (imageUrls.length > 5) {
//                 return res.status(400).json({ error: 'Maximum 5 images are allowed' });
//             }
  
//             // Save book details to database
//             const product = new Product({
//                 adTitle,
//                 description,
//                 price,
//                 userId,
//                 category, // Use the userId received from frontend
//                 photos: imageUrls // Store the image URLs from Cloudinary in an array
//             });
//             await product.save();
  
//             res.status(200).json({ message: 'Product added successfully' });
//         } catch (error) {
//             console.error('Error occurred while adding book:', error);
//             res.status(500).json({ error: 'Internal server error' });
//         }
//     });
// });

router.post('/uploadProducts', (req, res) => {
  upload(req, res, async (err) => {
      if (err) {
          console.error('Multer error:', err);
          return res.status(400).json({ error: 'File upload error' });
      }

      try {
          const { adTitle, description, price, category, userId } = req.body;
          const images = req.files.map(file => file.path); // Paths to the uploaded image files

          // Check if all required fields are provided
          if (!adTitle || !description || !price || !category || !userId || images.length === 0) {
              return res.status(400).json({ error: 'Please provide all required details' });
          }

          // Upload images to Cloudinary
          const uploadResponses = await Promise.all(images.map(image => cloudinary.uploader.upload(image)));

          // Extract URLs from Cloudinary responses
          const imageUrls = uploadResponses.map(response => response.url);

          // Check if the count of image URLs exceeds 5
          if (imageUrls.length > 5) {
              return res.status(400).json({ error: 'Maximum 5 images are allowed' });
          }

          // Save product details to the database
          const product = new Product({
              adTitle,
              description,
              price,
              userId,
              category, // Use the category received from the frontend
              photos: imageUrls // Store the image URLs from Cloudinary in an array
          });
          await product.save();

          res.status(200).json({ message: 'Product added successfully' });
      } catch (error) {
          console.error('Error occurred while adding product:', error);
          res.status(500).json({ error: 'Internal server error' });
      }
  });
});


router.post('/addToCart', async (req, res) => {
  try {
    const { productId, userId, addedBy } = req.body;

    // Check if any of the required values are missing
    if (!productId || !userId || !addedBy) {
      return res.status(400).json({ error: 'Missing productId, userId, or addedBy' });
    }

    // Check if the cart exists for the customer
    let cart = await Cart.findOne({ userId });

    // If Cart doesn't exist, create a new one
    if (!cart) {
      cart = new Cart({ userId, addedBy, products: [] });
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


router.post('/addToWishlist', async (req, res) => {
  try {
    const { productId, userId, addedBy } = req.body;

    // Check if any of the required values are missing
    if (!productId || !userId || !addedBy) {
      return res.status(400).json({ error: 'Missing productId, userId, or addedby' });
    }

    // Check if the wishlist exists for the customer
    let wishlist = await Wishlist.findOne({ userId });

    // If Wishlist doesn't exist, create a new one
    if (!wishlist) {
      wishlist = new Wishlist({ userId, addedBy, products: [] });
    }

    // Check if the product is already in the Wishlist
    if (wishlist.products.includes(productId)) {
      return res.status(400).json({ error: 'Product already exists in Wishlist' });
    }

    // Add the productId to the Wishlist
    wishlist.products.push(productId);
    
    // Save the updated Wishlist
    await wishlist.save();

    // Respond with success message
    res.status(200).json({ message: 'Product added to Wishlist successfully' });
  } catch (error) {
    console.error('Error adding product to Wishlist:', error);
    res.status(500).json({ error: 'Failed to add product to Wishlist' });
  }
});



router.get('/cart', async (req, res) => {
  try {
    const { userId } = req.query;
    const cart = await Cart.findOne({ userId }).populate('products'); // Assuming the cart schema and model are named "Cart"
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    res.json(cart.products);
  } catch (error) {
    console.error('Error fetching cart products:', error);
    res.status(500).json({ error: 'Failed to fetch cart products' });
  }
});

router.get('/wishlist', async (req, res) => {
  try {
    const { userId } = req.query;
    const cart = await Wishlist.findOne({ userId }).populate('products'); // Assuming the cart schema and model are named "Cart"
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    res.json(cart.products);
  } catch (error) {
    console.error('Error fetching cart products:', error);
    res.status(500).json({ error: 'Failed to fetch cart products' });
  }
});

router.delete('/removewishlist/:userId/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.params.userId;

    // Find the wishlist document for the customer
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: productId } },
      { new: true }
    );

    // Check if the wishlist exists
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    res.json(wishlist);
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove product from wishlist' });
  }
});

router.delete('/removecart/:userId/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.params.userId;

    // Find the wishlist document for the user
    const wishlist = await Cart.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: productId } },
      { new: true }
    );

    // Check if the wishlist exists
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    res.json(wishlist);
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove product from wishlist' });
  }
});

router.get('/products2', async (req, res) => {
  try {
    const productId = req.query.productId;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});


// router.get('/products', async (req, res) => {
//     try {
//       const { category } = req.query;
//       const filter = {};
  
//       // Filter by category if provided
//       if (category) {
//         filter.category = category;
//       }
  
//       const products = await Product.find(filter);
  
//       res.status(200).json(products);
//     } catch (error) {
//       console.error('Error occurred while fetching products:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   });

router.get('/products', async (req, res) => {
  try {
    const { category, userIdToExclude } = req.query;
    const filter = {};

    // Filter by category if provided
    if (category) {
      filter.category = category;
    }

    // Exclude products associated with the specified userId
    if (userIdToExclude) {
      filter.userId = { $ne: userIdToExclude };
    }

    const products = await Product.find(filter);

    res.status(200).json(products);
  } catch (error) {
    console.error('Error occurred while fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


  router.get('/products3/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const products = await Product.find({ userId: userId });
      
      if (!products) {
        return res.status(404).json({ error: 'Products not found for this user' });
      }
  
      res.json(products);
    } catch (error) {
      console.error('Error fetching products by user ID:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

// router.post('/createorders', async (req, res) => {
//   const { userId, sellerId, products } = req.body;

//   try {
//       // Validate the input data if necessary
      
//       // Create a new order
//       const newOrder = new Order({
//           userId,
//           products: products.map(product => ({
//               productId: product.productId,
//               adTitle: product.adTitle,
//               description: product.description,
//               price: product.price,
//               category: product.category,
//               imageUrl: product.imageUrl
//           })),
//           sellerId,
//           orderDate: Date.now()
//       });

//       // Save the new order
//       const savedOrder = await newOrder.save();

//       // Remove products from cart
//       const productIds = products.map(product => product.productId);
//       await Cart.updateOne(
//           { userId },
//           { $pull: { products: { productId: { $in: productIds } } } }
//       );

//       // Remove products from the product schema
//       await Product.deleteMany({ _id: { $in: productIds } });

//       res.status(201).json(savedOrder);
//   } catch (error) {
//       console.error('Error creating order:', error);
//       res.status(500).json({ message: 'Failed to create order', error });
//   }
// });

const nodemailer = require('nodemailer');

router.post('/createorders', async (req, res) => {
  const { userId, sellerId, products } = req.body;

  try {
    // Validate the input data if necessary

    // Create a new order
    const newOrder = new Order({
      userId,
      products: products.map(product => ({
        productId: product.productId,
        adTitle: product.adTitle,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl
      })),
      sellerId,
      orderDate: Date.now()
    });

    // Save the new order
    const savedOrder = await newOrder.save();

    // Remove products from cart
    const productIds = products.map(product => product.productId);
    await Cart.updateOne(
      { userId },
      { $pull: { products: { productId: { $in: productIds } } } }
    );

    // Remove products from the product schema
    await Product.deleteMany({ _id: { $in: productIds } });

    // Send email to the user with the seller's ID
    await sendEmailToUser(userId, sellerId);

    // Send email to the seller
    await sendEmailToSeller(userId, sellerId);

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order', error });
  }
});

require('dotenv').config({ path: "./config.env" });

async function sendEmailToUser(userId, sellerId) {
  try {
    // Fetch user and seller details from the database
    const user = await User.findById(userId);
    const seller = await User.findById(sellerId);

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Order Confirmation',
      text: `Dear ${user.name},\n\nYour order has been successfully placed.\n\nThank you for your purchase!\n\nBest regards,\nThe Team`
    };

    // Send email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function sendEmailToSeller(userId, sellerId) {
  try {
    // Fetch seller details from the database
    const seller = await User.findById(sellerId);

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: seller.email,
      subject: 'New Order Notification',
      text: `Dear ${seller.name},\n\nYou have a new order on your website. Please login to your account to view the details.\n\nBest regards,\nThe Team`
    };

    // Send email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}



router.get('/getbuyerorders', async (req, res) => {
  const { userId } = req.query; // Change variable name from "customerId" to "userId"

  try {
    console.log(`Fetching orders for userId: ${userId}`);
    const orders = await Order.find({ userId }); // Update query parameter from "customerId" to "userId"
    console.log(`Fetched orders: ${JSON.stringify(orders)}`);
    
    if (orders.length === 0) {
      console.log(`No orders found for userId: ${userId}`);
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error });
  }
});

router.get('/getsellerorders', async (req, res) => {
  const { sellerId } = req.query; // Change variable name from "userId" to "sellerId"

  try {
    console.log(`Fetching orders for sellerId: ${sellerId}`);
    const orders = await Order.find({ sellerId }); // Update query parameter from "userId" to "sellerId"
    console.log(`Fetched orders: ${JSON.stringify(orders)}`);
    
    if (orders.length === 0) {
      console.log(`No orders found for sellerId: ${sellerId}`);
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error });
  }
});

router.delete('/deleteproduct/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ status: 'failure', message: 'Product not found' });
    }

    res.status(200).json({ status: 'success', message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error occurred while deleting product:', error);
    res.status(500).json({ status: 'failure', message: 'Could not delete product', error: error });
  }
});

router.put('/editproduct/:id', async (req, res) => {
  const { adTitle, description, price, category, photos } = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { adTitle, description, price, category, photos },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ status: 'failure', message: 'Product not found' });
    }

    res.status(200).json({ status: 'success', message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error occurred while updating product:', error);
    res.status(500).json({ status: 'failure', message: 'Could not update product', error: error });
  }
});


module.exports = router;
