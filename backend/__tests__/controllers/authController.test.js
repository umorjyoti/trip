const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Auth Controller', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('_id');
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user.isAdmin).toBe(false);

      // Check if user was saved to database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).not.toBeNull();
    });

    test('should not register a user with existing email', async () => {
      // Create a user first
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login a user with valid credentials', async () => {
      // Create a user first
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    test('should not login with invalid credentials', async () => {
      // Create a user first
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/logout', () => {
    test('should logout a user', async () => {
      const res = await request(app).get('/api/auth/logout');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');
      expect(res.headers['set-cookie'][0]).toMatch(/jwt=;/);
    });
  });

  describe('GET /api/auth/me', () => {
    test('should get current user profile', async () => {
      // Create a user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      // Generate token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h'
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`jwt=${token}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', user._id.toString());
      expect(res.body).toHaveProperty('name', 'Test User');
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).not.toHaveProperty('password');
    });

    test('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Not authorized to access this route');
    });
  });
}); 