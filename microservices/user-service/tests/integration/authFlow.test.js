const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../../models');
const authRoutes = require('../../routes/auth');
const { errorHandler } = require('../../../shared');

// Mock axios for notification service calls
jest.mock('axios');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler('test-service'));

describe('Authentication Flow Integration Tests', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test_auth_flow', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    // Mock notification service to always succeed
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  describe('Complete Registration Flow', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'password123',
      termsAccepted: true
    };

    it('should complete full registration and login flow', async () => {
      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const userId = registerResponse.body.data.userId;

      // Step 2: Get OTP from database (simulating email)
      const user = await User.findById(userId);
      const otp = user.otp.code;

      // Step 3: Verify registration OTP
      const verifyResponse = await request(app)
        .post('/auth/verify-register-otp')
        .send({
          email: userData.email,
          otp: otp
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.token).toBeDefined();
      expect(verifyResponse.body.data.user.isVerified).toBe(true);

      // Step 4: Use token to access protected route
      const token = verifyResponse.body.data.token;
      const profileResponse = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.email).toBe(userData.email);
    });

    it('should handle resend OTP during registration', async () => {
      // Step 1: Register user
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Step 2: Resend OTP
      const resendResponse = await request(app)
        .post('/auth/resend-register-otp')
        .send({
          email: userData.email
        })
        .expect(200);

      expect(resendResponse.body.success).toBe(true);
      expect(resendResponse.body.data.otpSent).toBe(true);

      // Step 3: Verify with new OTP
      const user = await User.findOne({ email: userData.email });
      const newOtp = user.otp.code;

      const verifyResponse = await request(app)
        .post('/auth/verify-register-otp')
        .send({
          email: userData.email,
          otp: newOtp
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
    });
  });

  describe('Complete Login Flow', () => {
    let user;

    beforeEach(async () => {
      // Create verified user
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        isVerified: true,
        termsAccepted: true
      });
    });

    it('should complete full login flow', async () => {
      // Step 1: Login with credentials
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.otpSent).toBe(true);

      // Step 2: Get OTP from database
      const updatedUser = await User.findById(user._id);
      const otp = updatedUser.otp.code;

      // Step 3: Verify login OTP
      const verifyResponse = await request(app)
        .post('/auth/verify-login-otp')
        .send({
          email: user.email,
          otp: otp
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.token).toBeDefined();
      expect(verifyResponse.body.data.user.lastLogin).toBeDefined();

      // Step 4: Use token to access protected route
      const token = verifyResponse.body.data.token;
      const profileResponse = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.email).toBe(user.email);
    });

    it('should handle resend OTP during login', async () => {
      // Step 1: Login with credentials
      await request(app)
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        })
        .expect(200);

      // Step 2: Resend login OTP
      const resendResponse = await request(app)
        .post('/auth/resend-login-otp')
        .send({
          email: user.email
        })
        .expect(200);

      expect(resendResponse.body.success).toBe(true);
      expect(resendResponse.body.data.otpSent).toBe(true);

      // Step 3: Verify with new OTP
      const updatedUser = await User.findById(user._id);
      const newOtp = updatedUser.otp.code;

      const verifyResponse = await request(app)
        .post('/auth/verify-login-otp')
        .send({
          email: user.email,
          otp: newOtp
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
    });
  });

  describe('Password Reset Flow', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        isVerified: true,
        termsAccepted: true
      });
    });

    it('should complete full password reset flow', async () => {
      // Step 1: Request password reset
      const forgotResponse = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: user.email
        })
        .expect(200);

      expect(forgotResponse.body.success).toBe(true);

      // Step 2: Get reset token from database
      const updatedUser = await User.findById(user._id);
      const resetToken = updatedUser.resetPasswordToken;

      // We need to get the original token, not the hashed version
      // For testing, we'll generate a new token
      const originalToken = updatedUser.getResetPasswordToken();
      await updatedUser.save();

      // Step 3: Reset password with token
      const newPassword = 'newpassword123';
      const resetResponse = await request(app)
        .post('/auth/reset-password')
        .send({
          token: originalToken,
          password: newPassword
        })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);
      expect(resetResponse.body.data.token).toBeDefined();

      // Step 4: Verify new password works
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: user.email,
          password: newPassword
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.otpSent).toBe(true);
    });
  });

  describe('Profile Management Flow', () => {
    let user;
    let token;

    beforeEach(async () => {
      // Create and login user
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        isVerified: true,
        termsAccepted: true
      });

      // Login to get token
      await request(app)
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      const updatedUser = await User.findById(user._id);
      const otp = updatedUser.otp.code;

      const verifyResponse = await request(app)
        .post('/auth/verify-login-otp')
        .send({
          email: user.email,
          otp: otp
        });

      token = verifyResponse.body.data.token;
    });

    it('should update profile information', async () => {
      const updateData = {
        name: 'John Updated',
        phone: '+1234567890',
        city: 'New York'
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('John Updated');
      expect(response.body.data.user.phone).toBe('+1234567890');
      expect(response.body.data.user.city).toBe('New York');
    });

    it('should update password', async () => {
      const updateData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject password update with wrong current password', async () => {
      const updateData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
    });
  });

  describe('Token Validation', () => {
    let user;
    let token;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        isVerified: true,
        termsAccepted: true
      });

      // Get valid token
      await request(app)
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      const updatedUser = await User.findById(user._id);
      const otp = updatedUser.otp.code;

      const verifyResponse = await request(app)
        .post('/auth/verify-login-otp')
        .send({
          email: user.email,
          otp: otp
        });

      token = verifyResponse.body.data.token;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});