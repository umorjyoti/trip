const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../../models');
const profileRoutes = require('../../routes/profile');
const { errorHandler, generateToken } = require('../../../shared');

// Mock the shared middleware
jest.mock('../../../shared', () => ({
  ...jest.requireActual('../../../shared'),
  verifyToken: jest.fn((req, res, next) => {
    req.user = { id: 'user123', isAdmin: false };
    next();
  })
}));

const app = express();
app.use(express.json());
app.use('/profile', profileRoutes);
app.use(errorHandler('test-service'));

describe('Profile Controller', () => {
  let user;
  let token;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test_profile_controller', {
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
    
    // Create test user
    user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'password123',
      isVerified: true,
      termsAccepted: true,
      phone: '+1234567890',
      city: 'New York'
    });

    // Mock user ID in middleware
    const { verifyToken } = require('../../../shared');
    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: user._id.toString(), isAdmin: false };
      next();
    });
  });

  describe('GET /profile', () => {
    it('should get detailed user profile', async () => {
      const response = await request(app)
        .get('/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('John Doe');
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.data.user.profileCompletion).toBeDefined();
      expect(typeof response.body.data.user.profileCompletion).toBe('number');
    });

    it('should calculate profile completion percentage', async () => {
      const response = await request(app)
        .get('/profile')
        .expect(200);

      const profileCompletion = response.body.data.user.profileCompletion;
      expect(profileCompletion).toBeGreaterThan(0);
      expect(profileCompletion).toBeLessThanOrEqual(100);
    });

    it('should return 404 for non-existent user', async () => {
      const { verifyToken } = require('../../../shared');
      verifyToken.mockImplementation((req, res, next) => {
        req.user = { id: new mongoose.Types.ObjectId().toString(), isAdmin: false };
        next();
      });

      const response = await request(app)
        .get('/profile')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('PUT /profile/image', () => {
    it('should update profile image', async () => {
      const imageUrl = 'https://example.com/profile.jpg';

      const response = await request(app)
        .put('/profile/image')
        .send({ profileImage: imageUrl })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.profileImage).toBe(imageUrl);
      expect(response.body.message).toContain('updated successfully');

      // Verify in database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.profileImage).toBe(imageUrl);
    });

    it('should return 400 for missing profile image', async () => {
      const response = await request(app)
        .put('/profile/image')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /profile/contact', () => {
    it('should update contact information', async () => {
      const contactData = {
        phone: '+9876543210',
        address: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      };

      const response = await request(app)
        .put('/profile/contact')
        .send(contactData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.phone).toBe(contactData.phone);
      expect(response.body.data.user.city).toBe(contactData.city);
      expect(response.body.data.user.state).toBe(contactData.state);

      // Verify in database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.phone).toBe(contactData.phone);
      expect(updatedUser.address).toBe(contactData.address);
    });

    it('should validate phone number format', async () => {
      const response = await request(app)
        .put('/profile/contact')
        .send({ phone: 'invalid-phone' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should update partial contact information', async () => {
      const response = await request(app)
        .put('/profile/contact')
        .send({ city: 'San Francisco' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.city).toBe('San Francisco');

      // Verify other fields remain unchanged
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.phone).toBe('+1234567890'); // Original phone
    });
  });

  describe('GET /profile/activity', () => {
    it('should get user activity information', async () => {
      // Update user login info
      user.updateLoginInfo();
      await user.save();

      const response = await request(app)
        .get('/profile/activity')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activity.lastLogin).toBeDefined();
      expect(response.body.data.activity.loginCount).toBe(1);
      expect(response.body.data.activity.accountCreated).toBeDefined();
      expect(response.body.data.activity.accountAgeDays).toBeDefined();
      expect(typeof response.body.data.activity.accountAgeDays).toBe('number');
    });
  });

  describe('DELETE /profile', () => {
    it('should deactivate user account with correct password', async () => {
      const response = await request(app)
        .delete('/profile')
        .send({
          password: 'password123',
          confirmDelete: 'DELETE'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated successfully');

      // Verify user is deactivated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isActive).toBe(false);
      expect(updatedUser.email).toContain('deleted_');
      expect(updatedUser.username).toContain('deleted_');
    });

    it('should return 400 for incorrect password', async () => {
      const response = await request(app)
        .delete('/profile')
        .send({
          password: 'wrongpassword',
          confirmDelete: 'DELETE'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('should return 400 for incorrect confirmation', async () => {
      const response = await request(app)
        .delete('/profile')
        .send({
          password: 'password123',
          confirmDelete: 'WRONG'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CONFIRMATION');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .delete('/profile')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /profile/export', () => {
    it('should export user data', async () => {
      const response = await request(app)
        .get('/profile/export')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.personalInfo).toBeDefined();
      expect(response.body.data.accountInfo).toBeDefined();
      expect(response.body.data.activityInfo).toBeDefined();
      expect(response.body.data.exportInfo).toBeDefined();

      // Check personal info
      expect(response.body.data.personalInfo.name).toBe('John Doe');
      expect(response.body.data.personalInfo.email).toBe('john@example.com');

      // Check export info
      expect(response.body.data.exportInfo.exportedAt).toBeDefined();
      expect(response.body.data.exportInfo.exportedBy).toBe(user._id.toString());

      // Ensure sensitive data is not included
      expect(response.body.data.personalInfo.password).toBeUndefined();
      expect(response.body.data.accountInfo.resetPasswordToken).toBeUndefined();
    });
  });

  describe('PUT /profile/preferences', () => {
    it('should update notification preferences', async () => {
      const preferences = {
        emailNotifications: false,
        smsNotifications: true,
        pushNotifications: false
      };

      const response = await request(app)
        .put('/profile/preferences')
        .send(preferences)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.emailNotifications).toBe(false);
      expect(response.body.data.preferences.smsNotifications).toBe(true);
      expect(response.body.data.preferences.pushNotifications).toBe(false);

      // Verify in database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.preferences.emailNotifications).toBe(false);
      expect(updatedUser.preferences.smsNotifications).toBe(true);
    });

    it('should update partial preferences', async () => {
      const response = await request(app)
        .put('/profile/preferences')
        .send({ emailNotifications: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.emailNotifications).toBe(false);

      // Verify other preferences remain default
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.preferences.pushNotifications).toBe(true); // Default value
    });

    it('should initialize preferences if not exists', async () => {
      // Remove preferences from user
      await User.findByIdAndUpdate(user._id, { $unset: { preferences: 1 } });

      const response = await request(app)
        .put('/profile/preferences')
        .send({ emailNotifications: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.emailNotifications).toBe(false);
    });
  });
});