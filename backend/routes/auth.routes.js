const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const passport = require('../config/passport');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Google OAuth routes
router.get('/google', 
  (req, res, next) => {
    console.log('Google auth route hit:', req.path);
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(501).json({ message: 'Google authentication is not configured' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }
);

router.get('/google/callback',
  (req, res, next) => {
    console.log('Google callback route hit:', req.path);
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(501).json({ message: 'Google authentication is not configured' });
    }
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err) {
        console.error('Google auth error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  authController.googleCallback
);

// Protected routes
router.get('/me', protect, authController.getCurrentUser);
router.put('/updatedetails', protect, authController.updateUserProfile);
router.put('/updatepassword', protect, authController.updateUserProfile);

// Admin routes
router.get('/users', protect, admin, authController.getUsers);
router.patch('/users/:id/role', protect, admin, authController.updateUserRole);

module.exports = router; 