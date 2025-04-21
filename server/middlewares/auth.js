
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes that require authentication
exports.protect = async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired (24 hours)
    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.'
      });
    }
    
    // Find user by id
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in again.'
    });
  }
};

// Admin middleware
exports.admin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Middleware to check if user has specific role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Middleware specifically for admin routes
exports.adminOnly = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'This route is restricted to admin users only'
    });
  }
  next();
};

// Super admin checks (in a real implementation, you might have a separate role)
exports.superAdminOnly = async (req, res, next) => {
  // Check if user is marked as superadmin in the database
  // For simplicity, we'll assume the first admin user is the superadmin
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    const isFirstAdmin = req.user.role === 'admin' && adminCount === 1;
    
    if (!isFirstAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This route is restricted to super admin only'
      });
    }
    
    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while checking admin permissions'
    });
  }
};
