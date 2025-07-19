const Notification = require('../models/Notification');

/**
 * Create a notification for admin users
 * @param {string} type - Type of notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data for the notification
 * @param {string} priority - Priority level (low, medium, high)
 */
const createNotification = async (type, title, message, data = {}, priority = 'medium') => {
  try {
    const notification = new Notification({
      type,
      title,
      message,
      data,
      priority
    });

    await notification.save();
    console.log(`Notification created: ${type} - ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notification for booking confirmation with payment
 */
const createBookingConfirmedNotification = async (booking, trek, user) => {
  const title = '💰 New Booking Confirmed';
  const message = `Payment confirmed for booking #${booking._id} - ${trek?.name || 'Trek'} by ${user?.name || booking.userDetails?.name}`;
  
  const data = {
    bookingId: booking._id,
    trekId: trek?._id,
    trekName: trek?.name,
    userId: user?._id,
    userName: user?.name || booking.userDetails?.name,
    amount: booking.totalPrice,
    participants: booking.numberOfParticipants
  };

  return await createNotification('booking_confirmed', title, message, data, 'high');
};

/**
 * Create notification for new lead creation
 */
const createLeadCreatedNotification = async (lead) => {
  const title = '📞 New Lead Created';
  const message = `New lead from ${lead.name || lead.email} via ${lead.source}`;
  
  const data = {
    leadId: lead._id,
    leadName: lead.name,
    leadEmail: lead.email,
    leadPhone: lead.phone,
    source: lead.source,
    requestCallback: lead.requestCallback
  };

  const priority = lead.requestCallback ? 'high' : 'medium';
  return await createNotification('lead_created', title, message, data, priority);
};

/**
 * Create notification for new support ticket
 */
const createSupportTicketNotification = async (ticket, user, booking, trek) => {
  const title = '🎫 New Support Ticket';
  const message = `New ticket from ${user?.name} - ${ticket.subject}`;
  
  const data = {
    ticketId: ticket._id,
    userId: user?._id,
    userName: user?.name,
    bookingId: booking?._id,
    trekId: trek?._id,
    trekName: trek?.name,
    subject: ticket.subject,
    priority: ticket.priority
  };

  const priority = ticket.priority === 'high' ? 'high' : 'medium';
  return await createNotification('support_ticket_created', title, message, data, priority);
};

/**
 * Create notification for cancellation request
 */
const createCancellationRequestNotification = async (booking, user, trek) => {
  const title = '❌ Cancellation Request';
  const message = `Cancellation request from ${user?.name || booking.userDetails?.name} for ${trek?.name || 'Trek'}`;
  
  const data = {
    bookingId: booking._id,
    userId: user?._id,
    userName: user?.name || booking.userDetails?.name,
    trekId: trek?._id,
    trekName: trek?.name,
    reason: booking.cancellationRequest?.reason,
    amount: booking.totalPrice
  };

  return await createNotification('cancellation_request', title, message, data, 'high');
};

/**
 * Create notification for reschedule request
 */
const createRescheduleRequestNotification = async (booking, user, trek) => {
  const title = '🔄 Reschedule Request';
  const message = `Reschedule request from ${user?.name || booking.userDetails?.name} for ${trek?.name || 'Trek'}`;
  
  const data = {
    bookingId: booking._id,
    userId: user?._id,
    userName: user?.name || booking.userDetails?.name,
    trekId: trek?._id,
    trekName: trek?.name,
    reason: booking.cancellationRequest?.reason,
    preferredBatch: booking.cancellationRequest?.preferredBatch,
    amount: booking.totalPrice
  };

  return await createNotification('reschedule_request', title, message, data, 'medium');
};

module.exports = {
  createNotification,
  createBookingConfirmedNotification,
  createLeadCreatedNotification,
  createSupportTicketNotification,
  createCancellationRequestNotification,
  createRescheduleRequestNotification
};