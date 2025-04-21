
const express = require('express');
const router = express.Router();

// Import route modules
const userAuthRoutes = require('./userAuth');
const passwordResetRoutes = require('./passwordReset');

// Register routes
router.use('/', userAuthRoutes);
router.use('/', passwordResetRoutes);

module.exports = router;
