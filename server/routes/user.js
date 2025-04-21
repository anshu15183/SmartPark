
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const { protect } = require('../middlewares/auth');
const sendEmail = require('../utils/sendEmail');
const QRCode = require('qrcode');

// Contact form route
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and message'
      });
    }
    
    console.log('Contact form submission:', { name, email, message });
    
    // Make sure we have an admin email to send to
    const adminEmail = process.env.EMAIL_USER;
    if (!adminEmail) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Admin email not set'
      });
    }
    
    try {
      await sendEmail({
        to: adminEmail, // Admin's email - from .env
        subject: 'New Contact Form Submission',
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
        `
      });
      
      res.status(200).json({
        success: true,
        message: 'Contact form submitted successfully'
      });
    } catch (emailError) {
      console.error('Contact form email error:', emailError);
      res.status(500).json({
        success: false,
        error: 'Email sending failed, but your message was received'
      });
    }
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process contact form'
    });
  }
});

// @route   GET /api/user/profile
// @desc    Get user profile with booking history
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    // Get user profile
    const user = await User.findById(req.user._id).select('-password -otp');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate simplified QR data to avoid size issues
    const userQRData = JSON.stringify({
      id: user._id.toString(),
      type: 'user'
    });
    
    // Generate QR code as data URL
    const userQRCode = await QRCode.toDataURL(userQRData);
    
    // Check for expired pending bookings and update them
    const now = new Date();
    const expiredPending = await Booking.find({
      user: user._id,
      status: 'pending',
      expiresAt: { $lt: now }
    });
    
    // Update expired bookings
    for (const booking of expiredPending) {
      booking.status = 'expired';
      await booking.save();
    }
    
    // Get active booking (if any)
    const activeBooking = await Booking.findOne({
      user: user._id,
      status: { $in: ['pending', 'active'] }
    }).populate('floor');
    
    // Get booking history (last 3 completed bookings)
    const bookingHistory = await Booking.find({
      user: user._id,
      status: { $in: ['completed', 'cancelled', 'expired'] }
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('floor');
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        wallet: user.wallet,
        role: user.role,
        isSpecialPass: user.isSpecialPass,
        dueAmount: user.dueAmount,
        createdAt: user.createdAt
      },
      userQRCode,
      activeBooking,
      bookingHistory
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving profile'
    });
  }
});

// @route   GET /api/user/bookings
// @desc    Get user booking history
// @access  Private
router.get('/bookings', protect, async (req, res) => {
  try {
    // Get page and limit from query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get booking history
    const bookings = await Booking.find({
      user: req.user._id
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('floor');
    
    // Get total count
    const total = await Booking.countDocuments({ user: req.user._id });
    
    res.status(200).json({
      success: true,
      bookings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving bookings'
    });
  }
});

// @route   GET /api/user/active-booking
// @desc    Get user's active booking
// @access  Private
router.get('/active-booking', protect, async (req, res) => {
  try {
    // Find active booking
    const booking = await Booking.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'active'] }
    }).populate('floor');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'No active booking found'
      });
    }
    
    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get active booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving active booking'
    });
  }
});

// @route   GET /api/user/qr-code
// @desc    Generate user QR code
// @access  Private
router.get('/qr-code', protect, async (req, res) => {
  try {
    // Create simplified QR code data with user ID
    const qrData = JSON.stringify({
      id: req.user._id.toString(),
      type: 'user'
    });
    
    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(qrData);
    
    res.status(200).json({
      success: true,
      qrCode
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while generating QR code'
    });
  }
});

module.exports = router;
