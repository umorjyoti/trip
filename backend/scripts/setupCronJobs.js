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

  // Send partial payment reminders daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('📧 Running scheduled partial payment reminders...');
    try {
      const { sendPartialPaymentReminders } = require('./partialPaymentReminder');
      await sendPartialPaymentReminders();
      console.log('✅ Partial payment reminders completed successfully');
    } catch (error) {
      console.error('❌ Partial payment reminders failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Auto-cancel overdue partial payments daily at 10 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('❌ Running scheduled auto-cancel of overdue partial payments...');
    try {
      const { autoCancelPartialPayments } = require('./autoCancelPartialPayments');
      await autoCancelPartialPayments();
      console.log('✅ Auto-cancel partial payments completed successfully');
    } catch (error) {
      console.error('❌ Auto-cancel partial payments failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('✅ Cron jobs setup completed');
  console.log('   - Expired pending bookings cleanup: Every 15 minutes');
  console.log('   - Partial payment reminders: Daily at 9 AM');
  console.log('   - Auto-cancel overdue partial payments: Daily at 10 AM');
}

module.exports = { setupCronJobs }; 