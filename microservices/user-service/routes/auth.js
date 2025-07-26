const express = require('express');
const router = express.Router();
const {
  register,
  verifyRegisterOtp,
  resendRegisterOtp,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  verifyOtp,
  resendOtp,
  getCurrentUser,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  logout,
  getUsers,
  updateUserRole
} = require('../controllers/authController');

const { verifyToken, requireAdmin, generateToken, setTokenCookie } = require('../../shared');
const passport = require('../config/passport');

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /auth/verify-register-otp
 * @desc    Verify OTP for registration
 * @access  Public
 */
router.post('/verify-register-otp', verifyRegisterOtp);

/**
 * @route   POST /auth/resend-register-otp
 * @desc    Resend OTP for registration
 * @access  Public
 */
router.post('/resend-register-otp', resendRegisterOtp);

/**
 * @route   POST /auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /auth/verify-login-otp
 * @desc    Verify OTP for login
 * @access  Public
 */
router.post('/verify-login-otp', verifyLoginOtp);

/**
 * @route   POST /auth/resend-login-otp
 * @desc    Resend OTP for login
 * @access  Public
 */
router.post('/resend-login-otp', resendLoginOtp);

/**
 * @route   POST /auth/verify-otp
 * @desc    Verify OTP (generic endpoint for backward compatibility)
 * @access  Public
 */
router.post('/verify-otp', verifyOtp);

/**
 * @route   POST /auth/resend-otp
 * @desc    Resend OTP (generic endpoint for backward compatibility)
 * @access  Public
 */
router.post('/resend-otp', resendOtp);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', verifyToken, getCurrentUser);

/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', verifyToken, updateUserProfile);

/**
 * @route   PUT /auth/updatedetails
 * @desc    Update user profile (alias for backward compatibility)
 * @access  Private
 */
router.put('/updatedetails', verifyToken, updateUserProfile);

/**
 * @route   PUT /auth/updatepassword
 * @desc    Update user password (handled in updateUserProfile)
 * @access  Private
 */
router.put('/updatepassword', verifyToken, updateUserProfile);

/**
 * @route   POST /auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   GET /auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get('/google', 
  (req, res, next) => {
    console.log('Google auth route hit:', req.path);
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(501).json({ 
        success: false,
        error: {
          code: 'GOOGLE_AUTH_NOT_CONFIGURED',
          message: 'Google authentication is not configured'
        }
      });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }
);

/**
 * @route   GET /auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
  (req, res, next) => {
    console.log('Google callback route hit:', req.path);
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(501).json({ 
        success: false,
        error: {
          code: 'GOOGLE_AUTH_NOT_CONFIGURED',
          message: 'Google authentication is not configured'
        }
      });
    }
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err) {
        console.error('Google auth error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
      
      if (!user) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      // Generate JWT token
      const token = generateToken(user);
      
      // Set cookie
      setTokenCookie(res, token);
      
      // Update login info
      user.updateLoginInfo();
      user.save().catch(err => console.error('Failed to update login info:', err));
      
      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/dashboard?auth=success`);
    })(req, res, next);
  }
);

/**
 * @route   GET /auth/users
 * @desc    Get all users (Admin only)
 * @access  Admin
 */
router.get('/users', verifyToken, requireAdmin, getUsers);

/**
 * @route   PATCH /auth/users/:id/role
 * @desc    Update user role (Admin only)
 * @access  Admin
 */
router.patch('/users/:id/role', verifyToken, requireAdmin, updateUserRole);

module.exports = router;