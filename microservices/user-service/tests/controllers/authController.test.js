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

describe('Auth Controller', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test_auth_controller', {
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
    // Reset axios mock
    axios.post.mockClear();
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'password123',
      termsAccepted: true
    };

    it('should register a new user successfully', async () => {
      // Mock notification service call
      axios.post.mockResolvedValue({ data: { success: true } });

      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.data.email).toBe(validUserData.email);
      expect(response.body.data.otpSent).toBe(true);

      // Check user was created in database
      const user = await User.findOne({ email: validUserData.email });
      expect(user).toBeDefined();
      expect(user.name).toBe(validUserData.name);
      expect(user.isVerified).toBe(false);
      expect(user.otp.code).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ name: 'John Doe' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          password: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if terms not accepted', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          termsAccepted: false
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TERMS_NOT_ACCEPTED');
    });

    it('should return 409 for duplicate email', async () => {
      await User.create(validUserData);

      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          username: 'different'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should return 409 for duplicate username', async () => {
      await User.create(validUserData);

      const response = await request(app)
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'different@example.com'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USERNAME_EXISTS');
    });
  });

  describe('POST /auth/verify-register-otp', () => {
    let user;
    let otp;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        termsAccepted: true
      });
      otp = user.generateOTP();
      await user.save();
    });

    it('should verify OTP and login user successfully', async () => {
      const response = await request(app)
        .post('/auth/verify-register-otp')
        .send({
          email: user.email,
          otp: otp
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.isVerified).toBe(true);

      // Check user was updated in database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.otp.code).toBeUndefined();
    });

    it('should return 400 for invalid OTP', async () => {
      const response = await request(app)
        .post('/auth/verify-register-otp')
        .send({
          email: user.email,
          otp: '123456'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_OTP');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/verify-register-otp')
        .send({
          email: 'nonexistent@example.com',
          otp: otp
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('POST /auth/login', () => {
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
      // Mock notification service call
      axios.post.mockResolvedValue({ data: { success: true } });
    });

    it('should send OTP for valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('OTP sent');
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.data.otpSent).toBe(true);

      // Check OTP was generated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.otp.code).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for deactivated user', async () => {
      user.isActive = false;
      await user.save();

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_DEACTIVATED');
    });
  });

  describe('POST /auth/verify-login-otp', () => {
    let user;
    let otp;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        isVerified: true,
        termsAccepted: true
      });
      otp = user.generateOTP();
      await user.save();
    });

    it('should verify OTP and login user successfully', async () => {
      const response = await request(app)
        .post('/auth/verify-login-otp')
        .send({
          email: user.email,
          otp: otp
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.lastLogin).toBeDefined();

      // Check user login info was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastLogin).toBeDefined();
      expect(updatedUser.loginCount).toBe(1);
      expect(updatedUser.otp.code).toBeUndefined();
    });

    it('should return 400 for invalid OTP', async () => {
      const response = await request(app)
        .post('/auth/verify-login-otp')
        .send({
          email: user.email,
          otp: '123456'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_OTP');
    });

    it('should return 401 for deactivated user', async () => {
      user.isActive = false;
      await user.save();

      const response = await request(app)
        .post('/auth/verify-login-otp')
        .send({
          email: user.email,
          otp: otp
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_DEACTIVATED');
    });
  });

  describe('POST /auth/forgot-password', () => {
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
      // Mock notification service call
      axios.post.mockResolvedValue({ data: { success: true } });
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: user.email
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset email sent');

      // Check reset token was generated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.resetPasswordToken).toBeDefined();
      expect(updatedUser.resetPasswordExpire).toBeDefined();
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If the email exists');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /auth/reset-password', () => {
    let user;
    let resetToken;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        isVerified: true,
        termsAccepted: true
      });
      resetToken = user.getResetPasswordToken();
      await user.save();
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'newpassword123';

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset successful');
      expect(response.body.data.token).toBeDefined();

      // Check password was updated and reset fields cleared
      const updatedUser = await User.findById(user._id).select('+password');
      const isNewPasswordValid = await updatedUser.matchPassword(newPassword);
      expect(isNewPasswordValid).toBe(true);
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.resetPasswordExpire).toBeUndefined();
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_RESET_TOKEN');
    });

    it('should return 400 for expired token', async () => {
      // Manually expire the token
      user.resetPasswordExpire = new Date(Date.now() - 1000);
      await user.save();

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_RESET_TOKEN');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});