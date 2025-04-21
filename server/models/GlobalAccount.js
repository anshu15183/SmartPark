
const mongoose = require('mongoose');

const globalAccountSchema = new mongoose.Schema({
  balance: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GlobalAccount', globalAccountSchema);
