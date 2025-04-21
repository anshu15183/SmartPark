
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !['global_transfer', 'system'].includes(this.type);
    }
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: [
      'deposit', 
      'payment', 
      'refund', 
      'fine', 
      'due_clearance',
      'wallet_credit',
      'wallet_debit',
      'global_transfer',
      'system'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  description: {
    type: String,
    default: ''
  },
  metadata: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
