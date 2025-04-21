const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const Floor = require('../models/Floor');
const Transaction = require('../models/Transaction');
const { protect, admin } = require('../middlewares/auth');

// Get admin dashboard statistics
router.get('/dashboard-stats', protect, admin, async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get staff count (users with role staff or admin)
    const staffCount = await User.countDocuments({
      role: { $in: ['staff', 'admin'] }
    });
    
    // Get active bookings count
    const activeBookings = await Booking.countDocuments({ status: 'active' });
    
    // Get floors count
    const totalFloors = await Floor.countDocuments();
    
    // Get total completed bookings
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    
    // Get total revenue from all bookings
    const allBookings = await Booking.find({ status: 'completed' });
    const totalRevenue = allBookings.reduce((acc, booking) => acc + (booking.totalAmount || 0), 0);
    
    // Get available spots and spots filled
    const floors = await Floor.find();
    const availableSpots = floors.reduce((acc, floor) => acc + floor.normalSpots + floor.disabilitySpots, 0);
    
    // Check if there are free floors (unlimited capacity)
    const freeFloors = floors.some(floor => floor.isFreeLimit);
    
    // Get defaulters count and amount
    const defaulters = await User.find({ dueAmount: { $gt: 0 } });
    const totalDefaulters = defaulters.length;
    const defaultersAmount = defaulters.reduce((acc, user) => acc + (user.dueAmount || 0), 0);
    
    // Estimate spots filled based on active bookings (simplified)
    const spotsFilled = await Booking.countDocuments({ status: 'active' });
    
    // Response with statistics
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        staffCount,
        activeBookings,
        totalFloors,
        completedBookings,
        totalRevenue,
        availableSpots,
        spotsFilled,
        totalDefaulters,
        defaultersAmount,
        freeFloors
      }
    });
  } catch (error) {
    console.error('Error getting admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// Get recent users for admin dashboard
router.get('/recent-users', protect, admin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const users = await User.find()
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error getting recent users:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get recent bookings for admin dashboard
router.get('/recent-bookings', protect, admin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const bookings = await Booking.find()
      .populate('user', 'name')
      .populate('floor', 'name')
      .select('bookingId spotNumber status createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error getting recent bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get recent transactions for admin dashboard
router.get('/recent-transactions', protect, admin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const transactions = await Transaction.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get transaction statistics for admin dashboard
router.get('/transaction-stats', protect, admin, async (req, res) => {
  try {
    // Get current date
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count transactions
    const todayTransactions = await Transaction.find({
      createdAt: { $gte: startOfToday }
    });
    
    const weekTransactions = await Transaction.find({
      createdAt: { $gte: startOfWeek }
    });
    
    const monthTransactions = await Transaction.find({
      createdAt: { $gte: startOfMonth }
    });
    
    const allTransactions = await Transaction.find();
    
    // Calculate totals
    const todayAmount = todayTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const weekAmount = weekTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const monthAmount = monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalAmount = allTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    res.status(200).json({
      success: true,
      data: {
        today: todayTransactions.length,
        week: weekTransactions.length,
        month: monthTransactions.length,
        total: allTransactions.length,
        todayAmount,
        weekAmount,
        monthAmount,
        totalAmount
      }
    });
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get revenue chart data for admin dashboard
router.get('/revenue-chart', protect, admin, async (req, res) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Get all transactions for the current year
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    
    const transactions = await Transaction.find({
      createdAt: { $gte: yearStart, $lte: yearEnd },
      type: { $in: ['payment', 'deposit', 'wallet_debit', 'fine'] }
    });
    
    // Initialize data array with all months
    const data = months.map(month => ({
      name: month,
      revenue: 0
    }));
    
    // Group transactions by month and calculate total revenue
    transactions.forEach(transaction => {
      const month = transaction.createdAt.getMonth();
      data[month].revenue += transaction.amount;
    });
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting revenue chart data:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get weekly bookings chart data for admin dashboard
router.get('/weekly-bookings', protect, admin, async (req, res) => {
  try {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    
    // Get start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Get all bookings for the current week
    const bookings = await Booking.find({
      createdAt: { $gte: startOfWeek, $lte: endOfWeek }
    });
    
    // Initialize data array with all days
    const data = days.map(day => ({
      name: day,
      bookings: 0
    }));
    
    // Group bookings by day and count
    bookings.forEach(booking => {
      const day = booking.createdAt.getDay();
      data[day].bookings += 1;
    });
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting weekly bookings chart data:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password -otp');
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isAdmin = req.body.isAdmin;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', protect, admin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow changing your own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }
    
    user.role = role;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get all defaulters (users with due amounts)
// @route   GET /api/admin/defaulters
// @access  Private/Admin
router.get('/defaulters', protect, admin, async (req, res) => {
  try {
    const defaulters = await User.find({ dueAmount: { $gt: 0 } })
      .select('-password -otp')
      .sort({ dueAmount: -1 });
    
    res.status(200).json({
      success: true,
      defaulters
    });
  } catch (error) {
    console.error('Error fetching defaulters:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Clear due amount for a user
// @route   POST /api/admin/clear-due/:id
// @access  Private/Admin
router.post('/clear-due/:id', protect, admin, async (req, res) => {
  try {
    const { amount, waiveOff } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (amount > user.dueAmount) {
      return res.status(400).json({
        success: false,
        message: 'Amount cannot be greater than due amount'
      });
    }
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      amount,
      type: waiveOff ? 'due_clearance' : 'payment',
      status: 'completed',
      description: waiveOff ? 
        `Due amount of ₹${amount} waived off by admin` : 
        `Due amount of ₹${amount} cleared by admin`
    });
    
    await transaction.save();
    
    // Update user's due amount
    user.dueAmount -= amount;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: waiveOff ? 
        `Due amount of ₹${amount} waived off successfully` : 
        `Due amount of ₹${amount} cleared successfully`,
      user: {
        _id: user._id,
        name: user.name,
        dueAmount: user.dueAmount
      }
    });
  } catch (error) {
    console.error('Error clearing due amount:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get global account balance
// @route   GET /api/admin/global-account
// @access  Private/Admin
router.get('/global-account', protect, admin, async (req, res) => {
  try {
    // Calculate balance from transactions
    const transactions = await Transaction.find({
      type: { $in: ['payment', 'deposit', 'wallet_debit', 'fine'] }
    });
    
    const balance = transactions.reduce((total, transaction) => {
      return total + (transaction.amount || 0);
    }, 0);
    
    res.status(200).json({
      success: true,
      balance
    });
  } catch (error) {
    console.error('Error getting global account balance:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Add to user wallet
// @route   POST /api/admin/users/:id/wallet
// @access  Private/Admin
router.post('/users/:id/wallet', protect, admin, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      amount,
      type: 'wallet_credit',
      status: 'completed',
      description: `₹${amount} added to wallet by admin`
    });
    
    await transaction.save();
    
    // Update user's wallet
    user.wallet += amount;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `₹${amount} added to wallet successfully`,
      user: {
        _id: user._id,
        name: user.name,
        wallet: user.wallet
      }
    });
  } catch (error) {
    console.error('Error adding to wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Debit from user wallet to global account
// @route   POST /api/admin/users/:id/wallet/debit
// @access  Private/Admin
router.post('/users/:id/wallet/debit', protect, admin, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    if (user.wallet < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }
    
    // Create transaction record for wallet debit
    const walletTransaction = new Transaction({
      user: user._id,
      amount,
      type: 'wallet_debit',
      status: 'completed',
      description: `₹${amount} debited from wallet by admin`
    });
    
    // Create transaction record for global account credit
    const globalTransaction = new Transaction({
      amount,
      type: 'global_transfer',
      status: 'completed',
      description: `₹${amount} transferred to global account from ${user.name}'s wallet`
    });
    
    await Promise.all([
      walletTransaction.save(),
      globalTransaction.save()
    ]);
    
    // Update user's wallet
    user.wallet -= amount;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `₹${amount} debited from wallet successfully`,
      user: {
        _id: user._id,
        name: user.name,
        wallet: user.wallet
      }
    });
  } catch (error) {
    console.error('Error debiting from wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get floors
// @route   GET /api/admin/floors
// @access  Private/Admin
router.get('/floors', protect, admin, async (req, res) => {
  try {
    const floors = await Floor.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      floors
    });
  } catch (error) {
    console.error('Error fetching floors:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create floor
// @route   POST /api/admin/floors
// @access  Private/Admin
router.post('/floors', protect, admin, async (req, res) => {
  try {
    const { name, normalSpots, disabilitySpots, isFreeLimit } = req.body;
    
    // Check if floor with same name exists
    const existingFloor = await Floor.findOne({ name });
    if (existingFloor) {
      return res.status(400).json({
        success: false,
        message: 'Floor with this name already exists'
      });
    }
    
    const floor = new Floor({
      name,
      normalSpots: isFreeLimit ? 0 : normalSpots,
      disabilitySpots: isFreeLimit ? 0 : disabilitySpots,
      isFreeLimit
    });
    
    await floor.save();
    
    res.status(201).json({
      success: true,
      floor
    });
  } catch (error) {
    console.error('Error creating floor:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update floor
// @route   PUT /api/admin/floors/:id
// @access  Private/Admin
router.put('/floors/:id', protect, admin, async (req, res) => {
  try {
    const { name, normalSpots, disabilitySpots, isFreeLimit } = req.body;
    
    let floor = await Floor.findById(req.params.id);
    
    if (!floor) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }
    
    // Check if another floor with same name exists
    if (name !== floor.name) {
      const existingFloor = await Floor.findOne({ name });
      if (existingFloor) {
        return res.status(400).json({
          success: false,
          message: 'Floor with this name already exists'
        });
      }
    }
    
    floor.name = name;
    floor.normalSpots = isFreeLimit ? 0 : normalSpots;
    floor.disabilitySpots = isFreeLimit ? 0 : disabilitySpots;
    floor.isFreeLimit = isFreeLimit;
    
    await floor.save();
    
    res.status(200).json({
      success: true,
      floor
    });
  } catch (error) {
    console.error('Error updating floor:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete floor
// @route   DELETE /api/admin/floors/:id
// @access  Private/Admin
router.delete('/floors/:id', protect, admin, async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);
    
    if (!floor) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }
    
    // Check if there are active bookings for this floor
    const activeBookings = await Booking.countDocuments({
      floor: floor._id,
      status: { $in: ['active', 'pending'] }
    });
    
    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete floor with active bookings'
      });
    }
    
    await floor.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Floor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting floor:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get special pass users
// @route   GET /api/admin/special-pass-users
// @access  Private/Admin
router.get('/special-pass-users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({ isSpecialPass: true })
      .select('-password -otp')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching special pass users:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Grant special pass
// @route   POST /api/admin/special-pass
// @access  Private/Admin
router.post('/special-pass', protect, admin, async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }
    
    if (user.isSpecialPass) {
      return res.status(400).json({
        success: false,
        message: 'User already has a special pass'
      });
    }
    
    user.isSpecialPass = true;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Special pass granted to ${user.name}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isSpecialPass: user.isSpecialPass
      }
    });
  } catch (error) {
    console.error('Error granting special pass:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Revoke special pass
// @route   DELETE /api/admin/special-pass/:id
// @access  Private/Admin
router.delete('/special-pass/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.isSpecialPass) {
      return res.status(400).json({
        success: false,
        message: 'User does not have a special pass'
      });
    }
    
    user.isSpecialPass = false;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Special pass revoked from ${user.name}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isSpecialPass: user.isSpecialPass
      }
    });
  } catch (error) {
    console.error('Error revoking special pass:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create new user (admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
router.post('/users', protect, admin, async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    // Check if user with email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      phone,
      password,
      role: role || 'user',
      isVerified: true // Admin created accounts are auto-verified
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Add a route to handle contact form submissions
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and message'
      });
    }
    
    // Here you would typically save to database and/or send an email
    console.log('Contact form submission:', { name, email, message });
    
    // You could use the sendEmail utility here
    // For example:
    // const sendEmail = require('../utils/sendEmail');
    // await sendEmail({
    //   to: 'admin@example.com',
    //   subject: 'New Contact Form Submission',
    //   text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    // });
    
    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process contact form'
    });
  }
});

module.exports = router;
