const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { protect, admin } = require('../middlewares/auth');
const crypto = require('crypto');

// Create a simple mock payment implementation instead of Razorpay
const mockPayment = {
  createOrder: async (options) => ({
    id: 'order_' + Date.now(),
    amount: options.amount,
    currency: options.currency || 'INR',
    receipt: options.receipt,
    status: 'created'
  }),
  verifyPayment: async (paymentId, orderId) => ({
    success: true,
    status: Math.random() > 0.2 ? 'paid' : 'created' // Simulating paid status (80% chance)
  }),
  checkOrderStatus: async (orderId) => ({
    id: orderId,
    amount: 10000, // Example amount (100 INR in paise)
    currency: 'INR',
    receipt: 'receipt_' + Date.now(),
    status: Math.random() > 0.2 ? 'paid' : 'created' // Simulating paid status (80% chance)
  })
};

// Get transaction statistics (for admin dashboard)
router.get('/transaction-stats', protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
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

// Get recent transactions
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

// Get revenue chart data
router.get('/revenue-chart', protect, admin, async (req, res) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    
    const transactions = await Transaction.find({
      createdAt: { $gte: yearStart, $lte: yearEnd },
      type: { $in: ['payment', 'deposit', 'wallet_debit', 'fine'] }
    });
    
    const data = months.map(month => ({
      name: month,
      revenue: 0
    }));
    
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

// Get weekly bookings chart data
router.get('/weekly-bookings', protect, admin, async (req, res) => {
  try {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const bookings = await Booking.find({
      createdAt: { $gte: startOfWeek, $lte: endOfWeek }
    });
    
    const data = days.map(day => ({
      name: day,
      bookings: 0
    }));
    
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

// Get recent users
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

// Get recent bookings
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

// @desc    Create a payment order with UPI QR code
// @route   POST /api/payment/create-order
// @access  Private
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, paymentType } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    const amountInPaisa = Math.round(amount * 100);
    
    // Use mock payment system instead of Razorpay
    const order = await mockPayment.createOrder({
      amount: amountInPaisa,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        paymentType,
        userId: req.user._id.toString()
      }
    });
    
    const merchantName = encodeURIComponent("SmartPark");
    const transactionNote = encodeURIComponent(`Payment for ${paymentType}`);
    const transactionId = encodeURIComponent(`SP${Date.now()}`);
    const upiId = process.env.UPI_ID || "smartpark@ybl";
    
    const upiUrl = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=${transactionNote}&tr=${transactionId}`;
    
    const transaction = new Transaction({
      user: req.user._id,
      amount: amount,
      type: paymentType === 'due' ? 'due_clearance' : 'payment',
      status: 'pending',
      orderId: order.id,
      description: `UPI payment for ${paymentType}`
    });
    
    await transaction.save();
    
    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: amountInPaisa,
      currency: order.currency,
      upiQrCode: upiUrl,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// @desc    Check payment status
// @route   GET /api/payment/check-status/:orderId
// @access  Private
router.get('/check-status/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const transaction = await Transaction.findOne({ orderId });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (transaction.status === 'completed') {
      return res.status(200).json({
        success: true,
        isPaid: true,
        transaction: {
          _id: transaction._id,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          createdAt: transaction.createdAt
        }
      });
    }
    
    try {
      // Check payment status using mock instead of Razorpay
      const orderStatus = await mockPayment.checkOrderStatus(orderId);
      
      if (orderStatus.status === 'paid') {
        transaction.status = 'completed';
        await transaction.save();
        
        if (transaction.type === 'due_clearance') {
          const user = await User.findById(req.user._id);
          
          if (user) {
            const paidAmount = transaction.amount;
            user.dueAmount = Math.max(0, user.dueAmount - paidAmount);
            await user.save();
          }
        } else if (transaction.type === 'wallet_credit') {
          const user = await User.findById(req.user._id);
          
          if (user) {
            user.wallet += transaction.amount;
            await user.save();
          }
        }
        
        return res.status(200).json({
          success: true,
          isPaid: true,
          transaction: {
            _id: transaction._id,
            amount: transaction.amount,
            type: transaction.type,
            status: transaction.status,
            createdAt: transaction.createdAt
          }
        });
      }
      
      return res.status(200).json({
        success: true,
        isPaid: false
      });
    } catch (error) {
      console.error('Error checking payment status:', error);
      
      return res.status(200).json({
        success: true,
        isPaid: false,
        error: 'Failed to verify with payment gateway'
      });
    }
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
  }
});

// @desc    Check payment status by booking ID
// @route   GET /api/payment/check-status/booking/:bookingId
// @access  Public (for kiosk use)
router.get('/check-status/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findOne({ bookingId });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    if (booking.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        isPaid: true,
        booking: {
          bookingId: booking.bookingId,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          paymentMethod: booking.paymentMethod
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      isPaid: false,
      booking: {
        bookingId: booking.bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      }
    });
  } catch (error) {
    console.error('Booking payment status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check booking payment status'
    });
  }
});

// @desc    Manually update payment status (for testing)
// @route   POST /api/payment/update-status/:orderId
// @access  Private
router.post('/update-status/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status || !['completed', 'failed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const transaction = await Transaction.findOne({ orderId });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    transaction.status = status;
    await transaction.save();
    
    if (status === 'completed') {
      if (transaction.type === 'due_clearance') {
        const user = await User.findById(req.user._id);
        
        if (user) {
          const paidAmount = transaction.amount;
          user.dueAmount = Math.max(0, user.dueAmount - paidAmount);
          await user.save();
        }
      } else if (transaction.type === 'wallet_credit') {
        const user = await User.findById(req.user._id);
        
        if (user) {
          user.wallet += transaction.amount;
          await user.save();
        }
      }
    }
    
    res.status(200).json({
      success: true,
      transaction: {
        _id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Payment status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
});

// @desc    Verify payment (removed Razorpay-specific implementation)
// @route   POST /api/payment/verify
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { paymentId, orderId, paymentType } = req.body;
    
    // Simple mock verification
    const isValid = true;
    
    const transaction = new Transaction({
      user: req.user._id,
      amount: req.body.amount || 100, // default to 100 if not provided
      type: paymentType === 'due' ? 'due_clearance' : 'payment',
      status: 'completed',
      paymentId,
      orderId,
      description: `Payment for ${paymentType}`
    });
    
    await transaction.save();
    
    if (paymentType === 'due') {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const paidAmount = transaction.amount;
      user.dueAmount = Math.max(0, user.dueAmount - paidAmount);
      
      await user.save();
    } else if (paymentType === 'wallet') {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      user.wallet += transaction.amount;
      
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      transaction: {
        _id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// @desc    Get all transactions with pagination & filtering
// @route   GET /api/payment/transactions
// @access  Private/Admin
router.get('/transactions', protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const type = req.query.type;
    
    const query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transaction.countDocuments(query);
    
    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get transaction by ID
// @route   GET /api/payment/transactions/:id
// @access  Private/Admin
router.get('/transactions/:id', protect, admin, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create a new manual transaction
// @route   POST /api/payment/transactions
// @access  Private/Admin
router.post('/transactions', protect, admin, async (req, res) => {
  try {
    const { userId, amount, type, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type is required'
      });
    }
    
    const transactionData = {
      amount,
      type,
      status: 'completed',
      description: description || `Manual ${type} transaction created by admin`
    };
    
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      transactionData.user = userId;
      
      if (type === 'wallet_credit') {
        user.wallet += amount;
        await user.save();
      } else if (type === 'wallet_debit') {
        if (user.wallet < amount) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient wallet balance'
          });
        }
        
        user.wallet -= amount;
        await user.save();
      }
    }
    
    const transaction = new Transaction(transactionData);
    await transaction.save();
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get full description of a transaction
// @route   GET /api/payment/transactions/:id/description
// @access  Private/Admin
router.get('/transactions/:id/description', protect, admin, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .select('description');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.status(200).json({
      success: true,
      description: transaction.description || ''
    });
  } catch (error) {
    console.error('Error fetching transaction description:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Recharge user's wallet via UPI
// @route   POST /api/payment/recharge
// @access  Private
router.post('/recharge', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Use mock payment system
    const order = await mockPayment.createOrder({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        paymentType: 'wallet',
        userId: req.user._id.toString()
      }
    });
    
    const merchantName = encodeURIComponent("SmartPark");
    const transactionNote = encodeURIComponent("Wallet Recharge");
    const transactionId = encodeURIComponent(`SP${Date.now()}`);
    const upiId = process.env.UPI_ID || "smartpark@ybl";
    
    const upiUrl = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=${transactionNote}&tr=${transactionId}`;
    
    const transaction = new Transaction({
      user: req.user._id,
      amount: amount,
      type: 'wallet_credit',
      status: 'pending',
      orderId: order.id,
      description: `UPI payment for wallet recharge`
    });
    
    await transaction.save();
    
    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: Math.round(amount * 100),
      currency: order.currency,
      upiQrCode: upiUrl,
    });
  } catch (error) {
    console.error('Wallet recharge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process wallet recharge request'
    });
  }
});

// @desc    Pay dues using wallet balance
// @route   POST /api/payment/pay-dues-wallet
// @access  Private
router.post('/pay-dues-wallet', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.wallet < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }
    
    // Deduct from wallet
    user.wallet -= amount;
    
    // Reduce due amount
    user.dueAmount = Math.max(0, user.dueAmount - amount);
    
    await user.save();
    
    // Create transaction record
    const transaction = new Transaction({
      user: req.user._id,
      amount: amount,
      type: 'due_clearance',
      status: 'completed',
      description: `Paid dues using wallet balance`
    });
    
    await transaction.save();
    
    res.status(200).json({
      success: true,
      message: 'Dues paid successfully using wallet balance',
      remainingWallet: user.wallet,
      remainingDue: user.dueAmount,
      transaction: {
        _id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Wallet payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process wallet payment'
    });
  }
});

module.exports = router;
