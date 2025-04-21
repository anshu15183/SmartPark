
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  wallet: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'staff', 'admin'],
    default: 'user'
  },
  isSpecialPass: {
    type: Boolean,
    default: false
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  otp: {
    code: String,
    expiry: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set OTP expiry (10 minutes from now)
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY) || 10;
  
  this.otp = {
    code: otp,
    expiry: new Date(Date.now() + expiryMinutes * 60000)
  };
  
  return otp;
};

// Check if OTP is valid
userSchema.methods.isValidOTP = function(enteredOTP) {
  return this.otp.code === enteredOTP && this.otp.expiry > Date.now();
};

module.exports = mongoose.model('User', userSchema);
