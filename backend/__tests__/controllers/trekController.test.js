const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Trek = require('../../models/Trek');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Trek Controller', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true,
      role: 'admin'
    });

    // Create regular user
    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123'
    });

    // Generate tokens
    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    userToken = jwt.sign({ id: regularUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
  });

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear treks collection before each test
    await Trek.deleteMany({});
  });

  describe('GET /api/treks', () => {
    test('should get all treks', async () => {
      // Create test treks
      await Trek.create([
        {
          name: 'Test Trek 1',
          description: 'Test Description 1',
          region: 'Test Region',
          difficulty: 'Moderate',
          duration: 3,
          distance: 25,
          maxAltitude: 3000,
          images: ['image1.jpg']
        },
        {
          name: 'Test Trek 2',
          description: 'Test Description 2',
          region: 'Test Region 2',
          difficulty: 'Difficult',
          duration: 5,
          distance: 40,
          maxAltitude: 4000,
          images: ['image2.jpg']
        }
      ]);

      const res = await request(app).get('/api/treks');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('description');
      expect(res.body[0]).toHaveProperty('region');
    });

    test('should filter treks by region', async () => {
      // Create test treks
      await Trek.create([
        {
          name: 'Test Trek 1',
          description: 'Test Description 1',
          region: 'Himalayas',
          difficulty: 'Moderate',
          duration: 3,
          distance: 25,
          maxAltitude: 3000,
          images: ['image1.jpg']
        },
        {
          name: 'Test Trek 2',
          description: 'Test Description 2',
          region: 'Western Ghats',
          difficulty: 'Difficult',
          duration: 5,
          distance: 40,
          maxAltitude: 4000,
          images: ['image2.jpg']
        }
      ]);

      const res = await request(app).get('/api/treks?region=Himalayas');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].region).toBe('Himalayas');
    });
  });

  describe('GET /api/treks/:id', () => {
    test('should get a trek by ID', async () => {
      // Create a test trek
      const trek = await Trek.create({
        name: 'Test Trek',
        description: 'Test Description',
        region: 'Test Region',
        difficulty: 'Moderate',
        duration: 4,
        distance: 30,
        maxAltitude: 3500,
        images: ['test-image.jpg']
      });

      const res = await request(app).get(`/api/treks/${trek._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', trek._id.toString());
      expect(res.body).toHaveProperty('name', 'Test Trek');
      expect(res.body).toHaveProperty('description', 'Test Description');
      expect(res.body).toHaveProperty('region', 'Test Region');
    });

    test('should return 404 if trek not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/treks/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Trek not found');
    });
  });

  describe('POST /api/treks', () => {
    test('should create a new trek if admin', async () => {
      const trekData = {
        name: 'New Trek',
        description: 'New Description',
        region: 'New Region',
        difficulty: 'Difficult',
        duration: 6,
        distance: 50,
        maxAltitude: 4500,
        images: ['new-image.jpg']
      };

      const res = await request(app)
        .post('/api/treks')
        .set('Cookie', [`jwt=${adminToken}`])
        .send(trekData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', 'New Trek');
      expect(res.body).toHaveProperty('description', 'New Description');

      // Check if trek was saved to database
      const trek = await Trek.findById(res.body._id);
      expect(trek).not.toBeNull();
    });

    test('should return 403 if not admin', async () => {
      const trekData = {
        name: 'New Trek',
        description: 'New Description',
        region: 'New Region',
        difficulty: 'Difficult',
        duration: 6,
        distance: 50,
        maxAltitude: 4500,
        images: ['new-image.jpg']
      };

      const res = await request(app)
        .post('/api/treks')
        .set('Cookie', [`jwt=${userToken}`])
        .send(trekData);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Not authorized as an admin');
    });
  });

  describe('PUT /api/treks/:id', () => {
    test('should update a trek if admin', async () => {
      // Create a test trek
      const trek = await Trek.create({
        name: 'Test Trek',
        description: 'Test Description',
        region: 'Test Region',
        difficulty: 'Moderate',
        duration: 4,
        distance: 30,
        maxAltitude: 3500,
        images: ['test-image.jpg']
      });

      const updateData = {
        name: 'Updated Trek',
        description: 'Updated Description'
      };

      const res = await request(app)
        .put(`/api/treks/${trek._id}`)
        .set('Cookie', [`jwt=${adminToken}`])
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', trek._id.toString());
      expect(res.body).toHaveProperty('name', 'Updated Trek');
      expect(res.body).toHaveProperty('description', 'Updated Description');

      // Check if trek was updated in database
      const updatedTrek = await Trek.findById(trek._id);
      expect(updatedTrek.name).toBe('Updated Trek');
      expect(updatedTrek.description).toBe('Updated Description');
    });

    test('should return 403 if not admin', async () => {
      // Create a test trek
      const trek = await Trek.create({
        name: 'Test Trek',
        description: 'Test Description',
        region: 'Test Region',
        difficulty: 'Moderate',
        duration: 4,
        distance: 30,
        maxAltitude: 3500,
        images: ['test-image.jpg']
      });

      const updateData = {
        name: 'Updated Trek',
        description: 'Updated Description'
      };

      const res = await request(app)
        .put(`/api/treks/${trek._id}`)
        .set('Cookie', [`jwt=${userToken}`])
        .send(updateData);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Not authorized as an admin');
    });
  });

  describe('DELETE /api/treks/:id', () => {
    test('should delete a trek if admin', async () => {
      // Create a test trek
      const trek = await Trek.create({
        name: 'Test Trek',
        description: 'Test Description',
        region: 'Test Region',
        difficulty: 'Moderate',
        duration: 4,
        distance: 30,
        maxAltitude: 3500,
        images: ['test-image.jpg']
      });

      const res = await request(app)
        .delete(`/api/treks/${trek._id}`)
        .set('Cookie', [`jwt=${adminToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Trek removed');

      // Check if trek was deleted from database
      const deletedTrek = await Trek.findById(trek._id);
      expect(deletedTrek).toBeNull();
    });

    test('should return 403 if not admin', async () => {
      // Create a test trek
      const trek = await Trek.create({
        name: 'Test Trek',
        description: 'Test Description',
        region: 'Test Region',
        difficulty: 'Moderate',
        duration: 4,
        distance: 30,
        maxAltitude: 3500,
        images: ['test-image.jpg']
      });

      const res = await request(app)
        .delete(`/api/treks/${trek._id}`)
        .set('Cookie', [`jwt=${userToken}`]);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Not authorized as an admin');
    });
  });

  describe('POST /api/treks/:id/batches', () => {
    test('should add a batch to a trek if admin', async () => {
      // Create a test trek
      const trek = await Trek.create({
        name: 'Test Trek',
        description: 'Test Description',
        region: 'Test Region',
        difficulty: 'Moderate',
        duration: 4,
        distance: 30,
        maxAltitude: 3500,
        images: ['test-image.jpg'],
        batches: []
      });

      const batchData = {
        startDate: '2023-10-15',
        endDate: '2023-10-20',
        price: 1500,
        maxParticipants: 10
      };

      const res = await request(app)
        .post(`/api/treks/${trek._id}/batches`)
        .set('Cookie', [`jwt=${adminToken}`])
        .send(batchData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('batches');
      expect(res.body.batches.length).toBe(1);
      expect(res.body.batches[0]).toHaveProperty('price', 1500);
      expect(res.body.batches[0]).toHaveProperty('maxParticipants', 10);

      // Check if batch was added to trek in database
      const updatedTrek = await Trek.findById(trek._id);
      expect(updatedTrek.batches.length).toBe(1);
    });
  });

  describe('DELETE /api/treks/:id/batches/:batchId', () => {
    test('should delete a batch from a trek if admin', async () => {
      // Create a test trek with a batch
      const trek = await Trek.create({
        name: 'Test Trek',
        description: 'Test Description',
        region: 'Test Region',
        difficulty: 'Moderate',
        duration: 4,
        distance: 30,
        maxAltitude: 3500,
        images: ['test-image.jpg'],
        batches: [{
          startDate: new Date('2023-10-15'),
          endDate: new Date('2023-10-20'),
          price: 1500,
          maxParticipants: 10
        }]
      });

      const batchId = trek.batches[0]._id;

      const res = await request(app)
        .delete(`/api/treks/${trek._id}/batches/${batchId}`)
        .set('Cookie', [`jwt=${adminToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Batch deleted successfully');

      // Check if batch was removed from trek in database
      const updatedTrek = await Trek.findById(trek._id);
      expect(updatedTrek.batches.length).toBe(0);
    });
  });

  describe('GET /api/treks/weekend-getaways', () => {
    test('should get all weekend getaways', async () => {
      // Create test treks including weekend getaways
      await Trek.create([
        {
          name: 'Regular Trek',
          description: 'Regular Trek Description',
          region: 'Test Region',
          difficulty: 'Moderate',
          duration: 5,
          distance: 40,
          maxAltitude: 3500,
          images: ['image1.jpg'],
          isWeekendGetaway: false
        },
        {
          name: 'Weekend Getaway 1',
          description: 'Weekend Getaway Description',
          region: 'Test Region 2',
          difficulty: 'Easy',
          duration: 2,
          distance: 15,
          maxAltitude: 2000,
          images: ['image2.jpg'],
          isWeekendGetaway: true
        }
      ]);

      const res = await request(app).get('/api/treks/weekend-getaways');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('name', 'Weekend Getaway 1');
      expect(res.body[0]).toHaveProperty('isWeekendGetaway', true);
    });
  });
}); 