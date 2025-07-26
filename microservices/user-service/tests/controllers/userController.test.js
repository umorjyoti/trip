const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { User, UserGroup } = require('../../models');
const userRoutes = require('../../routes/users');
const { errorHandler, verifyToken, requireAdmin } = require('../../../shared');

// Mock the shared middleware
jest.mock('../../../shared', () => ({
  ...jest.requireActual('../../../shared'),
  verifyToken: jest.fn((req, res, next) => {
    req.user = { id: 'user123', isAdmin: true };
    next();
  }),
  requireAdmin: jest.fn((req, res, next) => next())
}));

const app = express();
app.use(express.json());
app.use('/users', userRoutes);
app.use(errorHandler('test-service'));

describe('User Controller', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test_user_controller', {
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
  });

  describe('GET /users', () => {
    beforeEach(async () => {
      await User.create([
        {
          name: 'John Doe',
          email: 'john@example.com',
          username: 'johndoe',
          password: 'password123'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          username: 'janesmith',
          password: 'password123',
          role: 'admin'
        }
      ]);
    });

    it('should get all users with pagination', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter users by search term', async () => {
      const response = await request(app)
        .get('/users?search=john')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].name).toBe('John Doe');
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/users?role=admin')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].role).toBe('admin');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/users?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /users/:id', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      });
    });

    it('should get user by valid ID', async () => {
      const response = await request(app)
        .get(`/users/${user._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('John Doe');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/users/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/users/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /users/:id', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      });
    });

    it('should update user profile with valid data', async () => {
      const updateData = {
        name: 'John Updated',
        phone: '+1234567890',
        city: 'New York'
      };

      const response = await request(app)
        .put(`/users/${user._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('John Updated');
      expect(response.body.data.user.phone).toBe('+1234567890');
      expect(response.body.data.user.city).toBe('New York');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/users/${fakeId}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('PATCH /users/:id/role', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      });
    });

    it('should update user role to admin', async () => {
      const response = await request(app)
        .patch(`/users/${user._id}/role`)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.data.user.isAdmin).toBe(true);
    });

    it('should update user role to user', async () => {
      // First make user admin
      user.role = 'admin';
      await user.save();

      const response = await request(app)
        .patch(`/users/${user._id}/role`)
        .send({ role: 'user' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('user');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .patch(`/users/${user._id}/role`)
        .send({ role: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ROLE');
    });

    it('should return 400 for missing role', async () => {
      const response = await request(app)
        .patch(`/users/${user._id}/role`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /users/:id/deactivate', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      });
    });

    it('should deactivate user', async () => {
      const response = await request(app)
        .patch(`/users/${user._id}/deactivate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isActive).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/users/${fakeId}/deactivate`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('GET /users/stats', () => {
    beforeEach(async () => {
      await User.create([
        {
          name: 'John Doe',
          email: 'john@example.com',
          username: 'johndoe',
          password: 'password123',
          isVerified: true
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          username: 'janesmith',
          password: 'password123',
          role: 'admin',
          isActive: false
        }
      ]);
    });

    it('should return user statistics', async () => {
      const response = await request(app)
        .get('/users/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.active).toBe(1);
      expect(response.body.data.admins).toBe(1);
      expect(response.body.data.verified).toBe(1);
      expect(typeof response.body.data.newThisMonth).toBe('number');
    });
  });
});