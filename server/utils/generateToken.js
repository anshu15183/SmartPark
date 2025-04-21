
const jwt = require('jsonwebtoken');

// Generate JWT token for user authentication
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'  // Token expires in 30 days
  });
};

// Generate reset password token that expires in 10 minutes
const generateResetToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '10m'  // Token expires in 10 minutes
  });
};

module.exports = { generateToken, generateResetToken };
