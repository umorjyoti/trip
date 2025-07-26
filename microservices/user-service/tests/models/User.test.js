const mongoose = require('mongoose');
const { User } = require('../../models');

describe('User Model', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/test_user_service', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      };

      const user = await User.create(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.isVerified).toBe(false);
    });

    it('should require name, email, username, and password', async () => {
      const user = new User({});

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.username).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should enforce unique email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      };

      await User.create(userData);

      const duplicateUser = new User({
        ...userData,
        username: 'johndoe2'
      });

      let error;
      try {
        await duplicateUser.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });

    it('should enforce unique username', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      };

      await User.create(userData);

      const duplicateUser = new User({
        ...userData,
        email: 'john2@example.com'
      });

      let error;
      try {
        await duplicateUser.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });

    it('should validate email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        username: 'johndoe',
        password: 'password123'
      };

      const user = new User(userData);

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should enforce minimum password length', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: '123'
      };

      const user = new User(userData);

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });
  });

  describe('Password Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      });
    });

    it('should hash password on save', async () => {
      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(20);
    });

    it('should match correct password', async () => {
      const isMatch = await user.matchPassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should not match incorrect password', async () => {
      const isMatch = await user.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('should generate reset password token', () => {
      const token = user.getResetPasswordToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpire).toBeDefined();
      expect(user.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('OTP Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      });
    });

    it('should generate OTP', () => {
      const otp = user.generateOTP();
      
      expect(otp).toBeDefined();
      expect(typeof otp).toBe('string');
      expect(otp.length).toBe(6);
      expect(user.otp.code).toBe(otp);
      expect(user.otp.expiresAt).toBeDefined();
    });

    it('should verify correct OTP', () => {
      const otp = user.generateOTP();
      const isValid = user.verifyOTP(otp);
      
      expect(isValid).toBe(true);
    });

    it('should not verify incorrect OTP', () => {
      user.generateOTP();
      const isValid = user.verifyOTP('123456');
      
      expect(isValid).toBe(false);
    });

    it('should not verify expired OTP', () => {
      const otp = user.generateOTP();
      // Manually set expiry to past
      user.otp.expiresAt = new Date(Date.now() - 1000);
      
      const isValid = user.verifyOTP(otp);
      expect(isValid).toBe(false);
    });

    it('should clear OTP', () => {
      user.generateOTP();
      user.clearOTP();
      
      expect(user.otp.code).toBeUndefined();
      expect(user.otp.expiresAt).toBeUndefined();
    });
  });

  describe('Static Methods', () => {
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
          isActive: false
        }
      ]);
    });

    it('should find user by email', async () => {
      const user = await User.findByEmailOrUsername('john@example.com');
      expect(user).toBeDefined();
      expect(user.email).toBe('john@example.com');
    });

    it('should find user by username', async () => {
      const user = await User.findByEmailOrUsername('johndoe');
      expect(user).toBeDefined();
      expect(user.username).toBe('johndoe');
    });

    it('should find active users only', async () => {
      const activeUsers = await User.findActiveUsers();
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].isActive).toBe(true);
    });
  });

  describe('Virtuals', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        role: 'admin'
      });
    });

    it('should have displayName virtual', () => {
      expect(user.displayName).toBe('John Doe');
    });

    it('should have isAdminUser virtual', () => {
      expect(user.isAdminUser).toBe(true);
    });

    it('should exclude sensitive fields in JSON', () => {
      const userJSON = user.toJSON();
      expect(userJSON.password).toBeUndefined();
      expect(userJSON.resetPasswordToken).toBeUndefined();
      expect(userJSON.otp).toBeUndefined();
    });
  });
});