
const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: Number,
    default: 1
  },
  normalSpots: {
    type: Number,
    required: true,
    default: 0
  },
  disabilitySpots: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Floor', floorSchema);
