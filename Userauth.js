const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

const auth = require("./authentication");
const User = require("./UserSchema");

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate request body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please enter all the required fields.' });
    }

    // Other validation checks...
    if (name.length > 25) {
      return res.status(400).json({ error: 'Name can only be less than 25 characters.' });
    }

    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const doesUserExist = await User.findOne({ email });
    if (doesUserExist) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new User instance
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      resetPasswordToken: null, // Initial values for reset token and expiration
      resetPasswordExpires: null
    });

    // Save user to database
    const result = await newUser.save();
    result.password = undefined;

    return res.status(201).json(result);
  } catch (err) {
    console.error('Error occurred during registration:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter all the required fields!" });
    }
  
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ error: "Invalid email or password!" });
      }
  
      const doesPasswordMatch = await bcrypt.compare(password, user.password);
  
      if (!doesPasswordMatch) {
        return res.status(400).json({ error: "Invalid email or password!" });
      }
  
      const payload = { _id: user._id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
  
      const userData = { ...user._doc, password: undefined };
      return res.status(200).json({ token, user: userData });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  });

  router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ error: 'Please enter your email address.' });
      }
  
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ error: 'No user found with this email address.' });
      }
  
      const token = crypto.randomBytes(20).toString('hex');
  
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
      await user.save();
  
      // Instead of sending an email, return the token in the response
      res.status(200).json({ resetToken: token, message: 'Password reset token generated.' });
    } catch (err) {
      console.error('Error in forgot-password:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
  
      if (!token || !password) {
        return res.status(400).json({ error: 'Please provide the reset token and new password.' });
      }
  
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }
  
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
  
      if (!user) {
        return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 12);
  
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
  
      await user.save();
  
      res.status(200).json({ message: 'Password has been reset.' });
    } catch (err) {
      console.error('Error in reset-password:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  module.exports = router;