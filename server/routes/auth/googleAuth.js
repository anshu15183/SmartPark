
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../../models/User');
const { generateToken } = require('../../utils/generateToken');

const router = express.Router();

// Configure Passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Setup Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (!user) {
          // Create new user if doesn't exist
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`, // Generate a placeholder phone number
            password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10), // Random secure password
            isVerified: true, // Google users are automatically verified
            googleId: profile.id
          });
          
          await user.save();
        } else if (!user.googleId) {
          // If user exists but doesn't have GoogleId set
          user.googleId = profile.id;
          await user.save();
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// @route   POST /api/auth/google
// @desc    Handle Google login from frontend
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { token: googleToken } = req.body;
    
    // TODO: Verify Google token here using Google API
    // For now, just assume it's valid for this refactoring
    
    // Generate JWT token
    const token = generateToken(req.user._id);
    
    // Prepare user data
    const userData = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      wallet: req.user.wallet,
      role: req.user.role,
      isSpecialPass: req.user.isSpecialPass
    };
    
    res.status(200).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google login'
    });
  }
});

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user._id);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }
  }
);

module.exports = router;
