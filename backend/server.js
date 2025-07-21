require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth.routes');
const trekRoutes = require('./routes/trek.routes');
const regionRoutes = require('./routes/regionRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const path = require('path');
const cookieParser = require('cookie-parser');
const statsRoutes = require('./routes/statsRoutes');
const promoRoutes = require('./routes/promoRoutes');
const offerRoutes = require('./routes/offerRoutes');
const leadRoutes = require('./routes/leadRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const trekSectionRoutes = require('./routes/trekSectionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userGroupRoutes = require('./routes/userGroupRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminBookingRoutes = require('./routes/adminBookingRoutes');
const failedBookingRoutes = require('./routes/failedBookingRoutes');
const blogRoutes = require('./src/routes/blogRoutes');
const careerRoutes = require('./routes/careerRoutes');
const passport = require('./config/passport');
const session = require('express-session');
const googleReviewsRoutes = require('./routes/googleReviewsRoutes');
const blogRegionRoutes = require('./routes/blogRegionRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const batchRoutes = require('./routes/batchRoutes');

// Swagger documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

// When running behind a proxy (e.g. Render, Heroku, Vercel) we need to tell
// Express to trust the first proxy hop so that `req.secure` is accurate. This
// is required for the `secure` cookie flag and other HTTPS related behaviour
// to work correctly.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5001' , 'http://localhost:3000', 'https://trip-ctuq.onrender.com',"89.117.157.153","https://bengalurutrekkers.in","https://www.bengalurutrekkers.in"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin', 
    'Cache-Control',
    'Pragma',
    'If-None-Match',
    'If-Modified-Since'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Session configuration - MUST be before passport.initialize()
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Add cache control middleware
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Body parsing middleware with increased limits and better error handling
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    // Only verify JSON for non-GET requests
    if (req.method !== 'GET') {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({ 
          message: 'Invalid JSON payload',
          error: e.message 
        });
        throw new Error('Invalid JSON');
      }
    }
  }
}));

app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true 
}));

app.use(morgan('dev'));
app.use(cookieParser());

// Add this middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-groups', userGroupRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/treks', trekRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/trek-sections', trekSectionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminBookingRoutes);
app.use('/api/failed-bookings', failedBookingRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/blog-regions', blogRegionRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/google', googleReviewsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/batches', batchRoutes);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Trekking Club API Documentation'
}));

// Add this after registering the wishlist routes
console.log('Registered routes:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
  }
});

// Add this before your regular routes
app.patch('/api/treks/:id/toggle-status', (req, res) => {
  console.log('Direct toggle-status route hit');
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  
  // Forward to the actual controller
  const { protect, admin } = require('./middleware/authMiddleware');
  const trekController = require('./controllers/trekController');
  
  // Apply middleware manually
  protect(req, res, () => {
    admin(req, res, () => {
      trekController.toggleTrekStatus(req, res);
    });
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trekking-club', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected');
  
  // Setup cron jobs for automated tasks (only in production)
  if (process.env.NODE_ENV === 'production') {
    const { setupCronJobs } = require('./scripts/setupCronJobs');
    setupCronJobs();
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Serve blog routes (including sitemap.xml, rss.xml, robots.txt) before static React app
// Note: This is for public blog access, admin routes are handled via /api/blogs
app.use('/blogs', blogRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route
app.get('/', (req, res) => {
  res.send('Trekking Club API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling middleware for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      message: 'Invalid JSON payload',
      error: err.message 
    });
  }
  next(err);
}); 