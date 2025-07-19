const cron = require('node-cron');
const { cleanupExpiredPendingBookings } = require('./cleanupPendingBookings');

/**
 * Setup Cron Jobs for Automated Tasks
 * This script sets up scheduled tasks for the application
 */

function setupCronJobs() {
  console.log('🕐 Setting up cron jobs...');

  // Cleanup expired pending bookings every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('🧹 Running scheduled cleanup of expired pending bookings...');
    try {
      await cleanupExpiredPendingBookings();
      console.log('✅ Scheduled cleanup completed successfully');
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('✅ Cron jobs setup completed');
  console.log('   - Expired pending bookings cleanup: Every 15 minutes');
}

module.exports = { setupCronJobs }; 