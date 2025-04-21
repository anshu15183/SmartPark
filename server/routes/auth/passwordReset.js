
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const sendEmail = require('../../utils/sendEmail');
const { generateResetToken } = require('../../utils/generateToken');

const router = express.Router();

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email with token
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email does not exist'
      });
    }
    
    // Generate reset token
    const resetToken = generateResetToken(user._id);
    
    // Store token hash in database with expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    
    // Create reset URL - updated to match frontend route
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    // Send email
    await sendEmail({
      email: user.email,
      subject: 'SmartPark Password Reset',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="padding: 10px 15px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p>Regards,<br>SmartPark Team</p>
      `
    });
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // If there was an error, clear reset token fields
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error occurred during password reset request'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id from token
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Send password change confirmation email
    await sendEmail({
      email: user.email,
      subject: 'SmartPark Password Changed',
      html: `
        <h1>Password Changed Successfully</h1>
        <p>Hello ${user.name},</p>
        <p>Your password has been changed successfully.</p>
        <p>If you did not make this change, please contact us immediately.</p>
        <p>Regards,<br>SmartPark Team</p>
      `
    });
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.name === 'JsonWebTokenError' ? 'Invalid token' : 'Server error occurred during password reset'
    });
  }
});

module.exports = router;

