
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  floor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Floor',
    required: true
  },
  spotType: {
    type: String,
    enum: ['normal', 'disability'],
    default: 'normal'
  },
  spotNumber: {
    type: String,
    required: true
  },
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  qrCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  entryTime: {
    type: Date
  },
  exitTime: {
    type: Date
  },
  expectedExitTime: {
    type: Date
  },
  actualAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'due'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'razorpay', 'upi', 'free', 'none'],
    default: 'none'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  archived: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
