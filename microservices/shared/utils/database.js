const mongoose = require('mongoose');

/**
 * Database connection utility for microservices
 */
class DatabaseConnection {
  constructor() {
    this.connection = null;
  }

  /**
   * Connect to MongoDB database
   * @param {string} mongoUri - MongoDB connection string
   * @param {string} serviceName - Name of the service for logging
   */
  async connect(mongoUri, serviceName = 'microservice') {
    try {
      if (!mongoUri) {
        throw new Error('MongoDB URI is required');
      }

      this.connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ ${serviceName} connected to MongoDB`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error(`❌ ${serviceName} MongoDB connection error:`, err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn(`⚠️ ${serviceName} MongoDB disconnected`);
      });

      return this.connection;
    } catch (error) {
      console.error(`❌ ${serviceName} MongoDB connection failed:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('🔌 MongoDB connection closed');
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new DatabaseConnection();