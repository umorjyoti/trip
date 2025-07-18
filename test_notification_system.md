# Notification System Test Guide

## Overview
This guide helps you test the in-app notification system for the admin side. The system creates notifications for the following events:

1. **Booking Confirmed with Payment** - When a booking payment is confirmed
2. **Lead Created** - When a new lead is submitted
3. **Support Ticket Created** - When a user creates a support ticket
4. **Cancellation Request** - When a user requests booking cancellation
5. **Reschedule Request** - When a user requests booking reschedule

## Backend Setup Verification

### 1. Check Database Connection
- Ensure MongoDB is running
- Verify the Notification model is properly indexed

### 2. Test API Endpoints
Use the following curl commands or Postman to test the notification APIs:

#### Get Notifications
```bash
curl -X GET "http://localhost:5000/api/notifications" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Unread Count
```bash
curl -X GET "http://localhost:5000/api/notifications/unread-count" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### Mark as Read
```bash
curl -X PUT "http://localhost:5000/api/notifications/NOTIFICATION_ID/read" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### Mark All as Read
```bash
curl -X PUT "http://localhost:5000/api/notifications/mark-all-read" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## Frontend Testing

### 1. Admin Login
- Login as an admin user
- Navigate to any admin page
- Verify the notification bell appears in the top-right corner

### 2. Test Notification Bell
- Click the notification bell
- Verify the dropdown opens
- Check that unread count is displayed correctly
- Test "Mark all read" functionality
- Test "Clear read" functionality

### 3. Test Individual Notifications
- Click the checkmark to mark individual notifications as read
- Click the trash icon to delete individual notifications
- Verify the unread count updates correctly

## Event Testing

### 1. Booking Confirmation Notification
**Steps:**
1. Create a new booking as a regular user
2. Complete the payment process
3. Verify the booking status changes to "payment_completed"
4. Check admin notifications - should see "💰 New Booking Confirmed"

**Expected Result:**
- Notification appears in admin panel
- Priority: High
- Contains booking details, trek name, user name, and amount

### 2. Lead Creation Notification
**Steps:**
1. Go to any trek detail page
2. Fill out the lead capture form
3. Submit the form
4. Check admin notifications - should see "📞 New Lead Created"

**Expected Result:**
- Notification appears in admin panel
- Priority: Medium (High if callback requested)
- Contains lead details (name, email, phone, source)

### 3. Support Ticket Notification
**Steps:**
1. Login as a regular user
2. Go to a booking detail page
3. Click "Create Support Ticket"
4. Fill out the ticket form and submit
5. Check admin notifications - should see "🎫 New Support Ticket"

**Expected Result:**
- Notification appears in admin panel
- Priority: Medium (High if ticket priority is high)
- Contains ticket details, user name, and subject

### 4. Cancellation Request Notification
**Steps:**
1. Login as a regular user
2. Go to a booking detail page
3. Click "Create Support Ticket"
4. Select "Cancellation Request" type
5. Fill out the form and submit
6. Check admin notifications - should see "❌ Cancellation Request"

**Expected Result:**
- Notification appears in admin panel
- Priority: High
- Contains booking details, user name, trek name, and reason

### 5. Reschedule Request Notification
**Steps:**
1. Login as a regular user
2. Go to a booking detail page
3. Click "Create Support Ticket"
4. Select "Reschedule Request" type
5. Fill out the form and submit
6. Check admin notifications - should see "🔄 Reschedule Request"

**Expected Result:**
- Notification appears in admin panel
- Priority: Medium
- Contains booking details, user name, trek name, reason, and preferred batch

## Real-time Updates Testing

### 1. Polling Verification
- Open admin panel in one browser tab
- Create notifications in another tab
- Verify notifications appear automatically within 30 seconds

### 2. Unread Count Updates
- Create multiple notifications
- Verify unread count increases
- Mark notifications as read
- Verify unread count decreases

## Error Handling Testing

### 1. Network Errors
- Disconnect internet
- Try to mark notifications as read
- Verify error handling and user feedback

### 2. Invalid Operations
- Try to delete non-existent notifications
- Verify proper error messages

## Performance Testing

### 1. Large Number of Notifications
- Create 50+ notifications
- Verify pagination works correctly
- Check performance with large datasets

### 2. Memory Usage
- Monitor memory usage with many notifications
- Verify no memory leaks

## Browser Compatibility

### 1. Cross-browser Testing
- Test in Chrome, Firefox, Safari, Edge
- Verify notification bell works in all browsers

### 2. Mobile Responsiveness
- Test on mobile devices
- Verify notification dropdown is usable on small screens

## Security Testing

### 1. Authorization
- Try to access notification APIs without admin token
- Verify proper 401 responses

### 2. Data Validation
- Try to create notifications with invalid data
- Verify proper validation and error handling

## Integration Testing

### 1. Complete User Journey
1. User creates booking
2. User completes payment
3. Admin receives notification
4. Admin clicks notification
5. Admin navigates to booking details
6. Admin processes the booking

### 2. Multiple Events
- Create multiple different types of notifications
- Verify all appear correctly
- Test filtering and sorting

## Troubleshooting

### Common Issues:

1. **Notifications not appearing**
   - Check browser console for errors
   - Verify backend server is running
   - Check database connection
   - Verify admin user permissions

2. **Unread count not updating**
   - Check network requests in browser dev tools
   - Verify API responses
   - Check notification context state

3. **Real-time updates not working**
   - Verify polling interval (30 seconds)
   - Check for JavaScript errors
   - Verify user is logged in as admin

4. **Styling issues**
   - Check CSS classes
   - Verify Tailwind CSS is loaded
   - Test in different browsers

## Success Criteria

The notification system is working correctly if:

✅ All 5 event types create notifications
✅ Notifications appear in real-time (within 30 seconds)
✅ Unread count updates correctly
✅ Mark as read functionality works
✅ Delete functionality works
✅ Notification bell shows correct unread count
✅ Dropdown displays notifications properly
✅ All admin users can see notifications
✅ No errors in browser console
✅ No errors in server logs
✅ Performance is acceptable with large datasets 