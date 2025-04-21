const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const User = require('../models/User');
const Floor = require('../models/Floor');
const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const { pricing } = require('../utils/pricing');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// @route   POST /api/booking/create
// @desc    Create a new booking
// @access  Private
router.post('/create', protect, async (req, res) => {
  try {
    const { floorId, spotType = 'normal' } = req.body;
    
    // Check if user already has an active booking
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'active'] }
    });
    
    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active booking'
      });
    }
    
    // Check if user has unpaid dues
    if (req.user.dueAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have unpaid dues. Please clear them before making a new booking.'
      });
    }
    
    // Find the floor
    const floor = await Floor.findById(floorId);
    
    if (!floor) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }
    
    // Check spot availability (only check normal spots now)
    if (!floor.isFreeLimit) {
      const bookedSpots = await Booking.countDocuments({
        floor: floorId,
        status: { $in: ['pending', 'active'] }
      });
      
      const availableSpots = floor.normalSpots;
      
      if (bookedSpots >= availableSpots) {
        return res.status(400).json({
          success: false,
          message: 'No spots available on this floor'
        });
      }
    }
    
    // Generate a unique booking ID
    const bookingId = `SP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
    
    // Set all spot numbers to "Any Available Spot" since specific spots aren't allocated
    const spotNumber = 'Any Available Spot';
    
    // Set expiry (15 minutes from now for entry)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // Create booking QR data with the business logic ID (bookingId)
    // This ensures consistent identification across the system
    const qrData = JSON.stringify({
      type: 'booking',
      bookingId: bookingId
    });
    
    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(qrData);
    
    // Create new booking
    const booking = new Booking({
      user: req.user._id,
      floor: floorId,
      spotType: 'normal', // Force normal for all bookings
      spotNumber,
      bookingId,
      qrCode,
      status: 'pending',
      expiresAt
    });
    
    // Save booking
    await booking.save();
    
    // Send booking confirmation email
    try {
      await sendEmail({
        to: req.user.email,
        subject: 'SmartPark Booking Confirmation',
        html: `
          <h1>Booking Confirmation</h1>
          <p>Hello ${req.user.name},</p>
          <p>Your parking spot has been booked successfully.</p>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Floor:</strong> ${floor.name}</p>
          <p>You can park in any available spot on this floor.</p>
          <p><strong>Valid Until:</strong> ${expiresAt.toLocaleString()}</p>
          <p>Please scan the QR code at the entry kiosk within 15 minutes to activate your booking.</p>
          <p>Regards,<br>SmartPark Team</p>
        `
      });
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
    }
    
    // Send booking confirmation SMS
    try {
      await sendSMS({
        phone: req.user.phone,
        message: `SmartPark: Your parking spot has been booked. Booking ID: ${bookingId}. Floor: ${floor.name}. Please scan the QR code at entry within 15 minutes.`
      });
    } catch (error) {
      console.error('Failed to send booking confirmation SMS:', error);
    }
    
    res.status(201).json({
      success: true,
      booking: {
        ...booking.toObject(),
        floor: {
          _id: floor._id,
          name: floor.name
        }
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while creating booking'
    });
  }
});

// @route   GET /api/booking
// @desc    Get user's active booking (primary endpoint for clients)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Find active booking for the current user
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

// @route   GET /api/booking/active
// @desc    Get active booking
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const activeBookings = await Booking.find({
      user: req.user._id,
      status: { $in: ['pending', 'active'] }
    }).populate('floor');
    
    if (!activeBookings || activeBookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active booking found'
      });
    }
    
    res.status(200).json({
      success: true,
      bookings: activeBookings
    });
  } catch (error) {
    console.error('Get active booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving active booking'
    });
  }
});

// @route   GET /api/booking/history
// @desc    Get booking history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      status: { $in: ['completed', 'cancelled', 'expired'] }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('floor');
    
    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving booking history'
    });
  }
});

// @route   GET /api/booking/user/active
// @desc    Get user active booking (alias for backward compatibility)
// @access  Private
router.get('/user/active', protect, async (req, res) => {
  try {
    // Find active booking for the current user
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

// @route   GET /api/booking/active-booking
// @desc    Get user's active booking (new endpoint for client compatibility)
// @access  Private
router.get('/active-booking', protect, async (req, res) => {
  try {
    // Find active booking for the current user
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

// @route   GET /api/booking/all
// @desc    Get all bookings (for admin)
// @access  Private (Admin)
router.get('/all', protect, async (req, res) => {
  try {
    // Only admins and staff can access all bookings
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view all bookings'
      });
    }
    
    const { status, limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email phone')
      .populate('floor', 'name level');
    
    // Get total count for pagination
    const total = await Booking.countDocuments(query);
    
    res.status(200).json({
      success: true,
      bookings,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving bookings'
    });
  }
});

// @route   GET /api/booking/:id
// @desc    Get booking details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    // Check if the ID is one of our special endpoints
    if (req.params.id === 'active' || req.params.id === 'history') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }
    
    const booking = await Booking.findById(req.params.id).populate('floor');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns the booking or is admin/staff
    if (booking.user.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin' && 
        req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }
    
    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving booking'
    });
  }
});

// @route   GET /api/booking/:id/qr
// @desc    Get booking QR code
// @access  Private
router.get('/:id/qr', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns the booking or is admin/staff
    if (booking.user.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin' && 
        req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }
    
    // If QR code hasn't been generated or booking has been updated, generate a new one
    if (!booking.qrCode) {
      const qrData = JSON.stringify({
        type: 'booking',
        bookingId: booking.bookingId
      });
      
      booking.qrCode = await QRCode.toDataURL(qrData);
      await booking.save();
    }
    
    res.status(200).json({
      success: true,
      qrCode: booking.qrCode
    });
  } catch (error) {
    console.error('Get booking QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving QR code'
    });
  }
});

// @route   POST /api/booking/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns the booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }
    
    // Check if booking can be cancelled
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be cancelled'
      });
    }
    
    // Update booking status
    booking.status = 'cancelled';
    await booking.save();
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while cancelling booking'
    });
  }
});

// @route   POST /api/booking/:id/extend
// @desc    Extend booking time
// @access  Private
router.post('/:id/extend', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns the booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to extend this booking'
      });
    }
    
    // Check if booking can be extended
    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active bookings can be extended'
      });
    }
    
    // Extend expected exit time by 1 hour
    booking.expectedExitTime = new Date(new Date(booking.expectedExitTime).getTime() + 60 * 60 * 1000);
    await booking.save();
    
    // Send extension confirmation
    await sendEmail({
      email: req.user.email,
      subject: 'SmartPark Booking Extension',
      html: `
        <h1>Booking Extension</h1>
        <p>Hello ${req.user.name},</p>
        <p>Your parking time has been extended.</p>
        <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        <p><strong>New Expected Exit Time:</strong> ${booking.expectedExitTime.toLocaleString()}</p>
        <p>Regards,<br>SmartPark Team</p>
      `
    });
    
    await sendSMS({
      phone: req.user.phone,
      message: `SmartPark: Your parking time for booking ${booking.bookingId} has been extended until ${booking.expectedExitTime.toLocaleString()}.`
    });
    
    res.status(200).json({
      success: true,
      message: 'Booking extended successfully',
      booking
    });
  } catch (error) {
    console.error('Extend booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while extending booking'
    });
  }
});

module.exports = router;
