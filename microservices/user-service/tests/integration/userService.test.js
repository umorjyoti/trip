const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { User, UserGroup } = require('../../models');
const authRoutes = require('../../routes/auth');
const userRoutes = require('../../routes/users');
const groupRoutes = require('../../routes/groups');
const profileRoutes = require('../../routes/profile');
const { errorHandler } = require('../../../shared');

// Mock axios for notification service calls
jest.mock('axios');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/profile', profileRoutes);
app.use(errorHandler('test-service'));

describe('User Service Integration Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;
  let userGroup;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test_user_service_integration', {
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
    await UserGroup.deleteMany({});
    
    // Mock notification service
    axios.post.mockResolvedValue({ data: { success: true } });

    // Create user group
    userGroup = await UserGroup.create({
      name: 'Test Group',
      description: 'Test group for integration tests',
      permissions: [
        { category: 'stats', name: 'bookings', description: 'View booking stats' }
      ]
    });

    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      username: 'admin',
      password: 'password123',
      role: 'admin',
      isVerified: true,
      termsAccepted: true
    });

    // Create regular user
    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      username: 'user',
      password: 'password123',
      role: 'user',
      isVerified: true,
      termsAccepted: true,
      group: userGroup._id
    });

    // Get tokens for both users
    adminToken = await getAuthToken(adminUser);
    userToken = await getAuthToken(regularUser);
  });

  // Helper function to get auth token
  async function getAuthToken(user) {
    // Login
    await request(app)
      .post('/auth/login')
      .send({
        email: user.email,
        password: 'password123'
      });

    // Get OTP and verify
    const updatedUser = await User.findById(user._id);
    const otp = updatedUser.otp.code;

    const response = await request(app)
      .post('/auth/verify-login-otp')
      .send({
        email: user.email,
        otp: otp
      });

    return response.body.data.token;
  }

  describe('Complete User Management Flow', () => {
    it('should handle complete user lifecycle', async () => {
      // 1. Register new user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'password123',
          termsAccepted: true
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const newUserId = registerResponse.body.data.userId;

      // 2. Verify registration
      const newUser = await User.findById(newUserId);
      const otp = newUser.otp.code;

      const verifyResponse = await request(app)
        .post('/auth/verify-register-otp')
        .send({
          email: 'newuser@example.com',
          otp: otp
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      const newUserToken = verifyResponse.body.data.token;

      // 3. Update profile
      const profileResponse = await request(app)
        .put('/profile/contact')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          phone: '+1234567890',
          city: 'Test City'
        })
        .expect(200);

      expect(profileResponse.body.success).toBe(true);

      // 4. Admin assigns user to group
      const assignGroupResponse = await request(app)
        .patch(`/users/${newUserId}/group`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          groupId: userGroup._id.toString()
        })
        .expect(200);

      expect(assignGroupResponse.body.success).toBe(true);

      // 5. Admin promotes user to admin
      const promoteResponse = await request(app)
        .patch(`/users/${newUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'admin'
        })
        .expect(200);

      expect(promoteResponse.body.success).toBe(true);
      expect(promoteResponse.body.data.user.role).toBe('admin');

      // 6. User exports their data
      const exportResponse = await request(app)
        .get('/profile/export')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(exportResponse.body.success).toBe(true);
      expect(exportResponse.body.data.personalInfo.name).toBe('New User');
    });
  });

  describe('Admin User Management', () => {
    it('should allow admin to manage users', async () => {
      // Get all users
      const usersResponse = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(usersResponse.body.success).toBe(true);
      expect(usersResponse.body.data.users.length).toBeGreaterThan(0);

      // Get user stats
      const statsResponse = await request(app)
        .get('/users/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.total).toBeGreaterThan(0);
      expect(statsResponse.body.data.admins).toBeGreaterThan(0);

      // Deactivate user
      const deactivateResponse = await request(app)
        .patch(`/users/${regularUser._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deactivateResponse.body.success).toBe(true);
      expect(deactivateResponse.body.data.user.isActive).toBe(false);

      // Reactivate user
      const activateResponse = await request(app)
        .patch(`/users/${regularUser._id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(activateResponse.body.success).toBe(true);
      expect(activateResponse.body.data.user.isActive).toBe(true);
    });

    it('should prevent regular users from accessing admin functions', async () => {
      // Try to get all users as regular user
      const usersResponse = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(usersResponse.body.success).toBe(false);
      expect(usersResponse.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');

      // Try to update user role as regular user
      const roleResponse = await request(app)
        .patch(`/users/${adminUser._id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'user' })
        .expect(403);

      expect(roleResponse.body.success).toBe(false);
    });
  });

  describe('User Group Management', () => {
    it('should allow admin to manage user groups', async () => {
      // Create new group
      const createGroupResponse = await request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Test Group',
          description: 'A new test group',
          permissions: [
            { category: 'actions', name: 'manageBookings', description: 'Manage bookings' }
          ]
        })
        .expect(201);

      expect(createGroupResponse.body.success).toBe(true);
      const newGroupId = createGroupResponse.body.data.group._id;

      // Get all groups
      const groupsResponse = await request(app)
        .get('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(groupsResponse.body.success).toBe(true);
      expect(groupsResponse.body.data.groups.length).toBe(2);

      // Update group
      const updateGroupResponse = await request(app)
        .put(`/groups/${newGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description'
        })
        .expect(200);

      expect(updateGroupResponse.body.success).toBe(true);
      expect(updateGroupResponse.body.data.group.description).toBe('Updated description');

      // Add permission to group
      const addPermissionResponse = await request(app)
        .post(`/groups/${newGroupId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'stats',
          name: 'users',
          description: 'View user stats'
        })
        .expect(200);

      expect(addPermissionResponse.body.success).toBe(true);

      // Remove permission from group
      const removePermissionResponse = await request(app)
        .delete(`/groups/${newGroupId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'stats',
          name: 'users'
        })
        .expect(200);

      expect(removePermissionResponse.body.success).toBe(true);

      // Delete group
      const deleteGroupResponse = await request(app)
        .delete(`/groups/${newGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteGroupResponse.body.success).toBe(true);
    });

    it('should get default permissions for group types', async () => {
      const response = await request(app)
        .get('/groups/permissions/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permissions).toBeDefined();
      expect(response.body.data.type).toBe('admin');
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
    });
  });

  describe('Profile Management', () => {
    it('should allow users to manage their profiles', async () => {
      // Get detailed profile
      const profileResponse = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.name).toBe('Regular User');
      expect(profileResponse.body.data.user.profileCompletion).toBeDefined();

      // Update contact info
      const contactResponse = await request(app)
        .put('/profile/contact')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          phone: '+9876543210',
          city: 'Updated City'
        })
        .expect(200);

      expect(contactResponse.body.success).toBe(true);
      expect(contactResponse.body.data.user.phone).toBe('+9876543210');

      // Update preferences
      const preferencesResponse = await request(app)
        .put('/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          emailNotifications: false,
          smsNotifications: true
        })
        .expect(200);

      expect(preferencesResponse.body.success).toBe(true);
      expect(preferencesResponse.body.data.preferences.emailNotifications).toBe(false);

      // Get activity
      const activityResponse = await request(app)
        .get('/profile/activity')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(activityResponse.body.success).toBe(true);
      expect(activityResponse.body.data.activity.loginCount).toBeGreaterThan(0);
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle complete password reset flow', async () => {
      // Request password reset
      const forgotResponse = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: regularUser.email
        })
        .expect(200);

      expect(forgotResponse.body.success).toBe(true);

      // Get reset token from database
      const userWithToken = await User.findById(regularUser._id);
      const resetToken = userWithToken.getResetPasswordToken();
      await userWithToken.save();

      // Reset password
      const resetResponse = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123'
        })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);
      expect(resetResponse.body.data.token).toBeDefined();

      // Verify new password works
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: regularUser.email,
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors properly', async () => {
      // Access protected route without token
      const response = await request(app)
        .get('/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should handle validation errors properly', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle not found errors properly', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});