const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const cookieSession = require('cookie-session');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const bookingRoutes = require('./routes/booking');
const floorRoutes = require('./routes/floor');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const kioskRoutes = require('./routes/kiosk');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production' || !origin) {
      return callback(null, true);
    }
    
    // Allow these origins in production
    const allowedOrigins = [
      process.env.FRONTEND_URL, 
      'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5173'
    ]; 
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration - Only use express-session, not both
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Health check route - must come before api routes to be accessible
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Router debug middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/floor', floorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/kiosk', kioskRoutes);

app.get('/smartpark.apk', (req, res) => {
  const apkPath = path.join(__dirname, '../public/smartpark.apk');
  
  // Set proper headers to ensure correct file extension
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="SmartPark.apk"');
  // Force the browser to download as an APK file
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Length', require('fs').statSync(apkPath).size);
  
  // Stream the file instead of using res.download for better handling
  const fileStream = require('fs').createReadStream(apkPath);
  fileStream.pipe(res);
});


// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

// Function to start the server with port fallback
const startServer = (port) => {
  // Convert port to number to ensure we don't get string concatenation
  const portNumber = parseInt(port, 10);
  
  // Verify port is valid
  if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
    console.error(`Invalid port number: ${port}`);
    process.exit(1);
  }
  
  // List of running Node.js processes that might be using ports
  if (portNumber !== parseInt(PORT, 10)) {
    console.log('Tip: To find processes using ports, try these commands:');
    console.log('- On Windows: netstat -ano | findstr :<PORT>');
    console.log('- On macOS/Linux: lsof -i :<PORT>');
    console.log('Then terminate the processes using those ports if needed.');
  }
  
  // Create server instance without starting it
  const server = app.listen(portNumber, HOST)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${portNumber} is busy, trying port ${portNumber + 1}...`);
        // Try the next port (as a number, not string)
        startServer(portNumber + 1);
      } else {
        console.error('Server error:', err);
      }
    })
    .on('listening', () => {
      const address = server.address();
      const actualPort = address.port;
      const hostName = address.address === '0.0.0.0' ? 'localhost' : address.address;
      
      console.log(`Server running on port ${actualPort}`);
      console.log(`Local API URL: http://localhost:${actualPort}/api`);
      
      // Show network URLs if binding to all interfaces
      if (address.address === '0.0.0.0') {
        try {
          // Get all network interfaces
          const os = require('os');
          const networkInterfaces = os.networkInterfaces();
          
          console.log('\nAvailable on network at:');
          Object.keys(networkInterfaces).forEach(interfaceName => {
            const interfaces = networkInterfaces[interfaceName];
            interfaces.forEach(iface => {
              // Show only IPv4 addresses and skip internal interfaces
              if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`http://${iface.address}:${actualPort}/api`);
              }
            });
          });
        } catch (err) {
          console.log('Could not determine network addresses');
        }
      }
      
      console.log(`\nKiosk endpoints: 
- Entry: http://${hostName}:${actualPort}/api/kiosk/entry-scan
- Exit: http://${hostName}:${actualPort}/api/kiosk/exit-scan`);
      
      // Update the .env file with the new port if it's different from the original
      if (actualPort !== parseInt(PORT, 10) && process.env.NODE_ENV !== 'production') {
        console.log(`Note: Consider updating your .env file with PORT=${actualPort}`);
      }
    });
};

// Start server with port fallback
startServer(PORT);
