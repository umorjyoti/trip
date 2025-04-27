const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Booking = require('../../models/Booking');
const Trek = require('../../models/Trek');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Booking Controller', () => {
  let userToken;
  let adminToken;
  let user;
  let admin;
  let trek;
  let batch;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create test user
    user = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123'
    });

    // Create admin user
    admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true,
      role: 'admin'
    });

    // Generate tokens
    userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    // Create a test trek with a batch
    trek = await Trek.create({
      name: 'Test Trek',
      description: 'Test Description',
      region: 'Test Region',
      difficulty: 'Moderate',
      duration: 4,
      distance: 30,
      maxAltitude: 3500,
      images: ['test-image.jpg'],
      isEnabled: true,
      batches: [{
        startDate: new Date('2023-10-15'),
        endDate: new Date('2023-10-20'),
        price: 1500,
        maxParticipants: 10,
        currentParticipants: 0
      }]
    });

    batch = trek.batches[0];
  });

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear bookings collection before each test
    await Booking.deleteMany({});
  });

  describe('POST /api/bookings', () => {
    test('should create a new booking', async () => {
      const bookingData = {
        trekId: trek._id,
        batchId: batch._id,
        participants: 2,
        contactInfo: {
          name: 'Test User',
          email: 'user@example.com',
          phone: '1234567890'
        },
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Parent',
          phone: '9876543210'
        },
        participantDetails: [
          {
            name: 'Participant 1',
            age: 30,
            gender: 'Male'
          },
          {
            name: 'Participant 2',
            age: 28,
            gender: 'Female'
          }
        ]
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`jwt=${userToken}`])
        .send(bookingData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('user', user._id.toString());
      expect(res.body).toHaveProperty('trek', trek._id.toString());
      expect(res.body).toHaveProperty('batch', batch._id.toString());
      expect(res.body).toHaveProperty('participants', 2);
      expect(res.body).toHaveProperty('totalPrice', 3000); // 2 participants * 1500

      // Check if booking was saved to database
      const booking = await Booking.findById(res.body._id);
      expect(booking).not.toBeNull();

      // Check if trek batch was updated with new participants
      const updatedTrek = await Trek.findById(trek._id);
      const updatedBatch = updatedTrek.batches.id(batch._id);
      expect(updatedBatch.currentParticipants).toBe(2);
    });

    test('should return 400 if batch is full', async () => {
      // Update batch to be full
      await Trek.findOneAndUpdate(
        { _id: trek._id, 'batches._id': batch._id },
        { $set: { 'batches.$.currentParticipants': 10 } }
      );

      const bookingData = {
        trekId: trek._id,
        batchId: batch._id,
        participants: 2,
        contactInfo: {
          name: 'Test User',
          email: 'user@example.com',
          phone: '1234567890'
        }
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Cookie', [`jwt=${userToken}`])
        .send(bookingData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'This batch is full');
    });
  });

  describe('GET /api/bookings/my-bookings', () => {
    test('should get user bookings', async () => {
      // Create a booking for the user
      await Booking.create({
        user: user._id,
        trek: trek._id,
        batch: batch._id,
        participants: 2,
        totalPrice: 3000,
        status: 'confirmed'
      });

      const res = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Cookie', [`jwt=${userToken}`]);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('user', user._id.toString());
      expect(res.body[0]).toHaveProperty('trek');
      expect(res.body[0]).toHaveProperty('participants', 2);
    });
  });

  describe('GET /api/bookings/:id', () => {
    test('should get a booking by ID', async () => {
      // Create a booking
      const booking = await Booking.create({
        user: user._id,
        trek: trek._id,
        batch: batch._id,
        participants: 2,
        totalPrice: 3000,
        status: 'confirmed'
      });

      const res = await request(app)
        .get(`/api/bookings/${booking._id}`)
        .set('Cookie', [`jwt=${userToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', booking._id.toString());
      expect(res.body).toHaveProperty('user', user._id.toString());
      expect(res.body).toHaveProperty('trek');
      expect(res.body).toHaveProperty('participants', 2);
    });

    test('should return 404 if booking not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/bookings/${nonExistentId}`)
        .set('Cookie', [`jwt=${userToken}`]);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Booking not found');
    });
  });

  describe('PUT /api/bookings/:id/cancel', () => {
    test('should cancel a booking', async () => {
      // Create a booking
      const booking = await Booking.create({
        user: user._id,
        trek: trek._id,
        batch: batch._id,
        participants: 2,
        totalPrice: 3000,
        status: 'confirmed'
      });

      // Update trek batch with participants
      await Trek.findOneAndUpdate(
        { _id: trek._id, 'batches._id': batch._id },
        { $set: { 'batches.$.currentParticipants': 2 } }
      );

      const res = await request(app)
        .put(`/api/bookings/${booking._id}/cancel`)
        .set('Cookie', [`jwt=${userToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'cancelled');
      expect(res.body).toHaveProperty('cancelledAt');

      // Check if booking was updated in database
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe('cancelled');

      // Check if trek batch was updated with reduced participants
      const updatedTrek = await Trek.findById(trek._id);
      const updatedBatch = updatedTrek.batches.id(batch._id);
      expect(updatedBatch.currentParticipants).toBe(0);
    });
  });

  describe('GET /api/bookings/admin', () => {
    test('should get all bookings if admin', async () => {
      // Create bookings
      await Booking.create([
        {
          user: user._id,
          trek: trek._id,
          batch: batch._id,
          participants: 2,
          totalPrice: 3000,
          status: 'confirmed'
        },
        {
          user: admin._id,
          trek: trek._id,
          batch: batch._id,
          participants: 1,
          totalPrice: 1500,
          status: 'confirmed'
        }
      ]);

      const res = await request(app)
        .get('/api/bookings/admin')
        .set('Cookie', [`jwt=${adminToken}`]);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    test('should return 403 if not admin', async () => {
      const res = await request(app)
        .get('/api/bookings/admin')
        .set('Cookie', [`jwt=${userToken}`]);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Not authorized as an admin');
    });
  });
}); 