const express = require('express');
const QRCode = require('qrcode');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const { calculateFee } = require('../utils/pricing');
const mongoose = require('mongoose');

const router = express.Router();

// Simple test endpoint to confirm route is accessible
router.get('/test', (req, res) => {
  res.status(200).json({ success: true, message: 'Kiosk API is working' });
});

// @route   POST /api/kiosk/entry-scan
// @desc    Process entry scan at kiosk
// @access  Public (Kiosk only)
router.post('/entry-scan', async (req, res) => {
  console.log('Received entry-scan request with body:', req.body);
  try {
    const { qrCode } = req.body;
    
    // Parse QR code data
    let qrData;
    try {
      qrData = typeof qrCode === 'string' ? JSON.parse(qrCode) : qrCode;
      console.log('Parsed QR data:', qrData);
    } catch (error) {
      console.error('Error parsing QR code:', error);
      console.log('Raw QR data:', qrCode);
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }
    
    // Handle based on QR code type
    if (qrData.type === 'booking') {
      // Extract the identifier - could be bookingId or id
      const bookingIdentifier = qrData.bookingId || qrData.id;
      
      if (!bookingIdentifier) {
        return res.status(400).json({
          success: false,
          message: 'Missing booking identifier in QR code'
        });
      }
      
      // Try to find the booking using multiple possible identifiers
      let booking;
      
      // First try to find by bookingId (string ID used in business logic)
      booking = await Booking.findOne({ bookingId: bookingIdentifier }).populate('user').populate('floor');
      
      // If not found and the ID looks like a MongoDB ObjectId, try searching by _id
      if (!booking && mongoose.Types.ObjectId.isValid(bookingIdentifier)) {
        booking = await Booking.findOne({ _id: bookingIdentifier }).populate('user').populate('floor');
      }
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      // Check booking status
      if (booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Booking is already ${booking.status}`
        });
      }
      
      // Check if booking is expired
      if (new Date() > new Date(booking.expiresAt)) {
        booking.status = 'expired';
        await booking.save();
        
        return res.status(400).json({
          success: false,
          message: 'Booking has expired'
        });
      }
      
      // Update booking status
      booking.status = 'active';
      booking.entryTime = new Date();
      
      // Set expected exit time (4 hours from entry)
      booking.expectedExitTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
      
      await booking.save();
      console.log('Booking updated successfully:', booking.bookingId);
      
      // Send entry notification
      try {
        await sendEmail({
          email: booking.user.email,
          subject: 'SmartPark Entry Confirmed',
          html: `
            <h1>Parking Entry Confirmed</h1>
            <p>Hello ${booking.user.name},</p>
            <p>Your entry to the parking has been confirmed.</p>
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Entry Time:</strong> ${booking.entryTime.toLocaleString()}</p>
            <p><strong>Expected Exit Time:</strong> ${booking.expectedExitTime.toLocaleString()}</p>
            <p>You will be charged based on the duration of your stay. Base rate is ₹40 for 4 hours.</p>
            <p>Please ensure you have sufficient balance in your wallet before exiting.</p>
            <p>Regards,<br>SmartPark Team</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Continue execution even if email fails
      }
      
      // Schedule notification for 10 minutes before expected exit time
      const notificationTime = new Date(booking.expectedExitTime.getTime() - 10 * 60 * 1000);
      const currentTime = new Date();
      const timeUntilNotification = notificationTime.getTime() - currentTime.getTime();
      
      if (timeUntilNotification > 0) {
        setTimeout(async () => {
          try {
            // Check if booking is still active
            const activeBooking = await Booking.findById(booking._id).populate('user');
            
            if (activeBooking && activeBooking.status === 'active') {
              // Send notification
              await sendEmail({
                email: activeBooking.user.email,
                subject: 'SmartPark Booking Expiring Soon',
                html: `
                  <h1>Booking Expiring Soon</h1>
                  <p>Hello ${activeBooking.user.name},</p>
                  <p>Your parking booking will expire in 10 minutes at ${activeBooking.expectedExitTime.toLocaleString()}.</p>
                  <p>To avoid fines, please exit the parking before the expiry time or extend your booking.</p>
                  <p>Please ensure you have sufficient balance in your wallet before exiting.</p>
                  <p>Regards,<br>SmartPark Team</p>
                `
              });
              
              await sendSMS({
                phone: activeBooking.user.phone,
                message: `SmartPark: Your parking booking will expire in 10 minutes at ${activeBooking.expectedExitTime.toLocaleString()}. Please exit or extend to avoid fines.`
              });
            }
          } catch (error) {
            console.error('Error sending expiry notification:', error);
          }
        }, timeUntilNotification);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Entry successful',
        data: {
          bookingId: booking.bookingId,
          userName: booking.user.name,
          floor: booking.floor.name,
          spotNumber: booking.spotNumber,
          entryTime: booking.entryTime,
          expectedExitTime: booking.expectedExitTime,
          bookingTime: booking.createdAt
        }
      });
    } else if (qrData.type === 'user') {
      // Handle user QR code (for special pass)
      const userId = qrData.userId || qrData.id;
      console.log('Processing special pass for user ID:', userId);
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Missing user ID in QR code'
        });
      }
      
      let user;
      
      // First try as a MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }
      
      // If user not found and the ID could be mixed up in different fields, try other approaches
      if (!user && typeof userId === 'string') {
        // Try searching by string fields
        user = await User.findOne({
          $or: [
            { _id: userId },
            { email: userId }
          ]
        });
      }
      
      if (!user) {
        console.log('User not found:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if user has special pass
      if (!user.isSpecialPass) {
        return res.status(403).json({
          success: false,
          message: 'User does not have a special pass'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Special pass entry successful',
        data: {
          userName: user.name,
          isSpecialPass: true
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code type'
      });
    }
  } catch (error) {
    console.error('Entry scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while processing entry'
    });
  }
});

// @route   POST /api/kiosk/exit-scan
// @desc    Process exit scan at kiosk
// @access  Public (Kiosk only)
router.post('/exit-scan', async (req, res) => {
  try {
    const { qrCode } = req.body;
    
    // Parse QR code data
    let qrData;
    try {
      qrData = typeof qrCode === 'string' ? JSON.parse(qrCode) : qrCode;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }
    
    // Handle based on QR code type
    if (qrData.type === 'booking') {
      // Extract the identifier - could be id, bookingId, or _id
      const bookingIdentifier = qrData.bookingId || qrData.id;
      
      if (!bookingIdentifier) {
        return res.status(400).json({
          success: false,
          message: 'Missing booking identifier in QR code'
        });
      }
      
      // Try to find the booking using multiple possible identifiers
      let booking;
      
      // First try to find by bookingId (string ID used in business logic)
      booking = await Booking.findOne({ bookingId: bookingIdentifier }).populate('user').populate('floor');
      
      // If not found and the ID looks like a MongoDB ObjectId, try searching by _id
      if (!booking && mongoose.Types.ObjectId.isValid(bookingIdentifier)) {
        booking = await Booking.findOne({ _id: bookingIdentifier }).populate('user').populate('floor');
      }
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      // Check booking status
      if (booking.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Booking is ${booking.status}, not active`
        });
      }
      
      // Set exit time
      booking.exitTime = new Date();
      
      // Calculate fee
      const fee = calculateFee(booking.entryTime, booking.exitTime);
      booking.actualAmount = fee.totalAmount;
      
      // Check if user has sufficient wallet balance
      if (booking.user.wallet >= booking.actualAmount) {
        // Deduct from wallet
        booking.user.wallet -= booking.actualAmount;
        booking.paymentStatus = 'paid';
        booking.paymentMethod = 'wallet';
        
        // Create transaction record
        const transaction = new Transaction({
          user: booking.user._id,
          amount: booking.actualAmount,
          type: 'payment',
          status: 'completed',
          booking: booking._id,
          description: `Payment for booking ${booking.bookingId}`
        });
        
        await transaction.save();
        await booking.user.save();
        
        // Update booking status
        booking.status = 'completed';
        await booking.save();
        
        // Send exit notification
        await sendEmail({
          email: booking.user.email,
          subject: 'SmartPark Exit Confirmed',
          html: `
            <h1>Parking Exit Confirmed</h1>
            <p>Hello ${booking.user.name},</p>
            <p>Your exit from the parking has been processed.</p>
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Entry Time:</strong> ${booking.entryTime.toLocaleString()}</p>
            <p><strong>Exit Time:</strong> ${booking.exitTime.toLocaleString()}</p>
            <p><strong>Duration:</strong> ${fee.durationMinutes} minutes</p>
            <p><strong>Amount:</strong> ₹${fee.totalAmount}</p>
            <p><strong>Payment Method:</strong> Wallet</p>
            <p><strong>Remaining Wallet Balance:</strong> ₹${booking.user.wallet}</p>
            <p>Thank you for using SmartPark.</p>
            <p>Regards,<br>SmartPark Team</p>
          `
        });
        
        return res.status(200).json({
          success: true,
          message: 'Exit successful, payment deducted from wallet',
          data: {
            bookingId: booking.bookingId,
            userName: booking.user.name,
            entryTime: booking.entryTime,
            exitTime: booking.exitTime,
            duration: fee.durationMinutes,
            amount: fee.totalAmount,
            paymentMethod: 'wallet',
            walletBalance: booking.user.wallet
          }
        });
      } else {
        // Generate payment QR for the remaining amount
        booking.paymentStatus = 'pending';
        
        // Generate a real UPI payment QR for the user to scan
        const merchant = "SmartPark";
        const upiId = process.env.UPI_ID || "smartpark@ybl";
        const amount = booking.actualAmount;
        const reference = `SP${booking.bookingId}`;
        
        // Generate standard UPI deep link
        const upiPaymentLink = `upi://pay?pa=${upiId}&pn=${merchant}&am=${amount}&cu=INR&tn=${reference}`;
        
        // Generate a QR code from the UPI link
        const paymentQRCode = await QRCode.toDataURL(upiPaymentLink, {
          errorCorrectionLevel: 'L',
          margin: 1,
          width: 200,
        });
        
        await booking.save();
        
        return res.status(200).json({
          success: true,
          message: 'Insufficient wallet balance, payment required',
          requiresPayment: true,
          data: {
            bookingId: booking.bookingId,
            userName: booking.user.name,
            entryTime: booking.entryTime,
            exitTime: booking.exitTime,
            duration: fee.durationMinutes,
            amount: fee.totalAmount,
            walletBalance: booking.user.wallet,
            shortfall: fee.totalAmount - booking.user.wallet,
            paymentQRCode
          }
        });
      }
    } else if (qrData.type === 'user') {
      // Handle user QR code (for special pass)
      const userId = qrData.userId || qrData.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Missing user ID in QR code'
        });
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if user has special pass
      if (!user.isSpecialPass) {
        return res.status(403).json({
          success: false,
          message: 'User does not have a special pass'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Special pass exit successful',
        data: {
          userName: user.name,
          isSpecialPass: true
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code type'
      });
    }
  } catch (error) {
    console.error('Exit scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while processing exit'
    });
  }
});

// @route   POST /api/kiosk/complete-exit
// @desc    Complete exit after payment
// @access  Public (Kiosk only)
router.post('/complete-exit', async (req, res) => {
  try {
    const { bookingId, paymentStatus } = req.body;
    
    // Find booking
    const booking = await Booking.findOne({ bookingId }).populate('user');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    if (paymentStatus === 'paid') {
      // Payment successful
      booking.paymentStatus = 'paid';
      booking.paymentMethod = 'upi'; // This is the line that needed to be changed
      booking.status = 'completed';
      
      // Create transaction record
      const transaction = new Transaction({
        user: booking.user._id,
        amount: booking.actualAmount,
        type: 'payment',
        status: 'completed',
        booking: booking._id,
        description: `UPI Payment for booking ${booking.bookingId}`
      });
      
      await transaction.save();
    } else {
      // Payment failed or skipped, mark as due
      booking.paymentStatus = 'due';
      booking.status = 'completed';
      
      // Add to user's due amount
      booking.user.dueAmount += booking.actualAmount;
      await booking.user.save();
      
      // Create transaction record
      const transaction = new Transaction({
        user: booking.user._id,
        amount: booking.actualAmount,
        type: 'fine',
        status: 'completed',
        booking: booking._id,
        description: `Due amount for booking ${booking.bookingId}`
      });
      
      await transaction.save();
      
      // Send due notification
      await sendEmail({
        email: booking.user.email,
        subject: 'SmartPark Payment Due',
        html: `
          <h1>Payment Due</h1>
          <p>Hello ${booking.user.name},</p>
          <p>You have an outstanding payment for your recent parking.</p>
          <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p><strong>Amount Due:</strong> ₹${booking.actualAmount}</p>
          <p>Please clear your due amount as soon as possible to avoid restrictions on future bookings.</p>
          <p>Regards,<br>SmartPark Team</p>
        `
      });
    }
    
    await booking.save();
    
    // After completing this booking, run cleanup task to mark old bookings for archiving
    try {
      // Mark completed bookings older than 90 days as archived
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      await Booking.updateMany(
        { 
          status: 'completed', 
          exitTime: { $lt: ninetyDaysAgo },
          archived: { $ne: true }
        },
        { $set: { archived: true } }
      );
      
      // Log the archiving process
      console.log(`Archived completed bookings older than 90 days - ${new Date()}`);
    } catch (archiveError) {
      console.error('Error archiving old bookings:', archiveError);
      // Don't stop the main process if archiving fails
    }
    
    res.status(200).json({
      success: true,
      message: paymentStatus === 'paid' ? 'Payment successful, exit completed' : 'Exit completed, amount added to dues',
      data: {
        bookingId: booking.bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      }
    });
  } catch (error) {
    console.error('Complete exit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while completing exit'
    });
  }
});

// Add a new route to manage archived bookings (for admin use)
// @route   GET /api/kiosk/admin/archived-bookings
// @desc    Get all archived bookings
// @access  Admin only
router.get('/admin/archived-bookings', async (req, res) => {
  try {
    const archivedBookings = await Booking.find({ archived: true })
      .populate('user', 'name email phone')
      .populate('floor', 'name level')
      .sort({ exitTime: -1 });
    
    res.status(200).json({
      success: true,
      count: archivedBookings.length,
      data: archivedBookings
    });
  } catch (error) {
    console.error('Archived bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving archived bookings'
    });
  }
});

// @route   POST /api/kiosk/admin/cleanup-archived
// @desc    Permanently delete very old archived bookings (admin only, use with caution)
// @access  Admin only
router.post('/admin/cleanup-archived', async (req, res) => {
  try {
    const { olderThanDays } = req.body;
    
    if (!olderThanDays || olderThanDays < 365) {
      return res.status(400).json({
        success: false,
        message: 'Please specify olderThanDays parameter (minimum 365 days)'
      });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // Find bookings to be deleted
    const bookingsToDelete = await Booking.find({
      archived: true,
      exitTime: { $lt: cutoffDate }
    });
    
    // Keep a record of deleted booking IDs in a backup collection if needed
    // This would require creating a new model for deleted booking records
    
    // Delete the bookings
    const result = await Booking.deleteMany({
      archived: true,
      exitTime: { $lt: cutoffDate }
    });
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} archived bookings older than ${olderThanDays} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup archived error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up archived bookings'
    });
  }
});

module.exports = router;
