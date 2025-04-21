
const express = require('express');
const User = require('../../models/User');
const sendEmail = require('../../utils/sendEmail');
const sendSMS = require('../../utils/sendSMS');
const { generateToken } = require('../../utils/generateToken');
const { protect } = require('../../middlewares/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    console.log('Registration request received:', { name, email, phone });
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // If user exists but is not verified, update their details and resend OTP
      if (!user.isVerified) {
        console.log('Found existing unverified user, updating details and resending OTP');
        
        // Update user details
        user.name = name;
        user.phone = phone;
        
        // Only update password if it's provided
        if (password) {
          user.password = password;
        }
        
        // Generate new OTP for verification
        const otp = user.generateOTP();
        
        // Save updated user to database
        await user.save();
        
        // Send OTP via email
        await sendEmail({
          email: user.email,
          subject: 'SmartPark Account Verification',
          html: `
            <h1>Account Verification</h1>
            <p>Hello ${user.name},</p>
            <p>We noticed you tried to sign up again. Please use the following OTP to verify your account:</p>
            <h2 style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 24px;">${otp}</h2>
            <p>This OTP will expire in 10 minutes.</p>
            <p>Regards,<br>SmartPark Team</p>
          `
        });
        
        // Send OTP via SMS
        await sendSMS({
          phone: user.phone,
          message: `SmartPark: Your new OTP for account verification is ${otp}. This OTP will expire in 10 minutes.`
        });
        
        return res.status(200).json({
          success: true,
          message: 'We found your previous signup attempt. A new verification code has been sent to your email and phone.'
        });
      }
      
      // If user exists and is verified, return error
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    user = await User.findOne({ phone });
    
    if (user) {
      // If user exists but is not verified, handle similarly to email case
      if (!user.isVerified) {
        console.log('Found existing unverified user with this phone, updating details and resending OTP');
        
        // Update user details
        user.name = name;
        user.email = email;
        
        // Only update password if it's provided
        if (password) {
          user.password = password;
        }
        
        // Generate new OTP for verification
        const otp = user.generateOTP();
        
        // Save updated user to database
        await user.save();
        
        // Send OTP via email
        await sendEmail({
          email: user.email,
          subject: 'SmartPark Account Verification',
          html: `
            <h1>Account Verification</h1>
            <p>Hello ${user.name},</p>
            <p>We noticed you tried to sign up again. Please use the following OTP to verify your account:</p>
            <h2 style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 24px;">${otp}</h2>
            <p>This OTP will expire in 10 minutes.</p>
            <p>Regards,<br>SmartPark Team</p>
          `
        });
        
        // Send OTP via SMS
        await sendSMS({
          phone: user.phone,
          message: `SmartPark: Your new OTP for account verification is ${otp}. This OTP will expire in 10 minutes.`
        });
        
        return res.status(200).json({
          success: true,
          message: 'We found your previous signup attempt. A new verification code has been sent to your email and phone.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      phone,
      password
    });
    
    // Generate OTP for verification
    const otp = user.generateOTP();
    
    // Save user to database
    await user.save();
    
    // Send OTP via email
    await sendEmail({
      email: user.email,
      subject: 'SmartPark Account Verification',
      html: `
        <h1>Account Verification</h1>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering with SmartPark. Please use the following OTP to verify your account:</p>
        <h2 style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 24px;">${otp}</h2>
        <p>This OTP will expire in 10 minutes.</p>
        <p>Regards,<br>SmartPark Team</p>
      `
    });
    
    // Send OTP via SMS
    await sendSMS({
      phone: user.phone,
      message: `SmartPark: Your OTP for account verification is ${otp}. This OTP will expire in 10 minutes.`
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your account with the OTP sent to your email and phone.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred during registration'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify user account with OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if OTP is valid
    if (!user.isValidOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Update user verification status
    user.isVerified = true;
    user.otp = undefined;
    await user.save();
    
    // Send welcome email
    await sendEmail({
      email: user.email,
      subject: 'Welcome to SmartPark',
      html: `
        <h1>Welcome to SmartPark!</h1>
        <p>Hello ${user.name},</p>
        <p>Your account has been successfully verified. You can now log in and book parking spots.</p>
        <p>Regards,<br>SmartPark Team</p>
      `
    });
    
    res.status(200).json({
      success: true,
      message: 'Account verified successfully'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred during verification'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is verified
    if (!user.isVerified) {
      // Generate new OTP
      const otp = user.generateOTP();
      await user.save();
      
      // Send new OTP
      await sendEmail({
        email: user.email,
        subject: 'SmartPark Account Verification',
        html: `
          <h1>Account Verification</h1>
          <p>Hello ${user.name},</p>
          <p>Please use the following OTP to verify your account:</p>
          <h2 style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 24px;">${otp}</h2>
          <p>This OTP will expire in 10 minutes.</p>
          <p>Regards,<br>SmartPark Team</p>
        `
      });
      
      await sendSMS({
        phone: user.phone,
        message: `SmartPark: Your OTP for account verification is ${otp}. This OTP will expire in 10 minutes.`
      });
      
      return res.status(403).json({
        success: false,
        message: 'Account not verified. A new OTP has been sent to your email and phone.'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Return user data without password
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      wallet: user.wallet,
      role: user.role,
      isSpecialPass: user.isSpecialPass
    };
    
    res.status(200).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    // Get user from database (without password)
    const user = await User.findById(req.user._id).select('-password');
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving profile'
    });
  }
});

module.exports = router;
