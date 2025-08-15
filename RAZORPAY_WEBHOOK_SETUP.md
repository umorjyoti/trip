# Razorpay Webhook Setup Guide

## 🎯 Problem Solved

**Issue**: Users close their browser before payment validation completes, causing:
- Validation API to not run completely
- Database records to not get updated
- Users to see "payment failed" even though payment succeeded

**Solution**: Implement server-side webhook validation that works independently of the user's browser state.

## 🏗️ Architecture Overview

```
User Payment Flow:
1. User initiates payment → Razorpay checkout
2. Payment completed → Razorpay sends webhook to your server
3. Server processes webhook → Updates database → Sends confirmation emails
4. Frontend polls for status → Shows success/failure based on server state

Key Benefits:
✅ No dependency on user's browser staying open
✅ Reliable payment validation and database updates
✅ Automatic email notifications
✅ Handles network issues and browser closures gracefully
```

## 🔧 Backend Implementation

### 1. Webhook Handler (Already Implemented)

The webhook handler in `backend/controllers/paymentController.js` now processes:
- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `refund.processed` - Refund processed

### 2. Environment Variables

Add to your `.env` file:
```bash
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**⚠️ Important**: This secret is different from your Razorpay API keys!

## 🌐 Razorpay Dashboard Configuration

### 1. Access Webhook Settings
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Webhooks**
3. Click **Add New Webhook**

### 2. Configure Webhook
```
Webhook URL: https://yourdomain.com/api/payments/webhook
Active Events:
✅ payment.captured
✅ payment.failed
✅ payment.authorized
✅ refund.processed
```

### 3. Get Webhook Secret
1. After creating webhook, click on it
2. Copy the **Webhook Secret**
3. Add it to your `.env` file as `RAZORPAY_WEBHOOK_SECRET`

## 🚀 Frontend Implementation

### 1. Enhanced Payment Flow

The frontend now implements:
- **Immediate feedback**: Shows "Payment submitted successfully!" right after payment
- **Fallback verification**: Tries to verify payment immediately (for fast responses)
- **Polling fallback**: If immediate verification fails, polls server every 3 seconds
- **Webhook reliance**: Ultimately relies on webhook processing for reliability

### 2. User Experience Improvements

```
Before: User waits → Validation fails if browser closes → Payment appears failed
After:  User gets immediate feedback → Payment processes in background → Success confirmed
```

## 🧪 Testing

### 1. Test Webhook Endpoint
```bash
cd backend
node test-webhook.js
```

### 2. Test with Real Payments
1. Make a test payment
2. Check server logs for webhook processing
3. Verify database updates
4. Check email notifications

### 3. Monitor Webhook Logs
Look for these log messages:
```
[WEBHOOK] Received payment.captured event from Razorpay
[WEBHOOK] Signature verified for payment.captured event
[WEBHOOK] Processing captured payment: pay_xxx, Amount: ₹100
[WEBHOOK] Booking xxx updated successfully with payment pay_xxx
```

## 📊 Monitoring & Debugging

### 1. Webhook Status in Razorpay Dashboard
- Check webhook delivery status
- View failed webhook attempts
- Monitor webhook response times

### 2. Server Logs
Monitor these log patterns:
```
✅ Successful: [WEBHOOK] Booking xxx updated successfully
❌ Failed: [WEBHOOK] Error processing payment captured event
⚠️ Warning: [WEBHOOK] No booking ID found in order notes
```

### 3. Database Verification
Check if payments are being recorded:
```javascript
// In MongoDB shell or admin panel
db.bookings.find({
  "paymentDetails.paymentId": { $exists: true }
}).sort({ "paymentDetails.paidAt": -1 })
```

## 🔒 Security Considerations

### 1. Webhook Signature Verification
- ✅ Implemented HMAC SHA256 verification
- ✅ Uses environment variable for secret
- ✅ Rejects invalid signatures

### 2. Rate Limiting
Consider adding rate limiting to webhook endpoint:
```javascript
// In your webhook route
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.post('/webhook', webhookLimiter, paymentController.handleWebhook);
```

## 🚨 Troubleshooting

### 1. Webhook Not Receiving Events
- ✅ Check webhook URL is accessible
- ✅ Verify webhook is active in Razorpay dashboard
- ✅ Check server logs for incoming requests
- ✅ Ensure webhook endpoint is not behind authentication

### 2. Signature Verification Failing
- ✅ Verify `RAZORPAY_WEBHOOK_SECRET` is correct
- ✅ Check webhook secret in Razorpay dashboard
- ✅ Ensure secret is copied exactly (no extra spaces)

### 3. Database Not Updating
- ✅ Check webhook logs for successful processing
- ✅ Verify booking ID exists in order notes
- ✅ Check database connection and permissions
- ✅ Monitor for any validation errors

### 4. Emails Not Sending
- ✅ Check email service configuration
- ✅ Verify email templates are working
- ✅ Monitor email service logs
- ✅ Check spam/junk folders

## 📈 Performance Optimization

### 1. Webhook Processing
- Webhook processing is asynchronous
- Database updates are optimized
- Email sending doesn't block webhook response

### 2. Frontend Polling
- Polls every 3 seconds (configurable)
- Maximum 2 minutes of polling
- Graceful fallback to manual status check

## 🎉 Benefits After Implementation

1. **Reliable Payments**: No more failed payments due to browser closure
2. **Better UX**: Users get immediate feedback and clear status updates
3. **Reduced Support**: Fewer "payment failed" support tickets
4. **Data Integrity**: All payments are properly recorded in database
5. **Automated Notifications**: Users receive confirmation emails automatically
6. **Audit Trail**: Complete payment history and webhook processing logs

## 🔄 Next Steps

1. **Configure webhook in Razorpay dashboard**
2. **Set `RAZORPAY_WEBHOOK_SECRET` in environment**
3. **Test with real payment**
4. **Monitor webhook processing logs**
5. **Verify database updates and email notifications**
6. **Deploy to production**

## 📞 Support

If you encounter issues:
1. Check server logs for webhook processing
2. Verify webhook configuration in Razorpay dashboard
3. Test webhook endpoint accessibility
4. Monitor database for payment updates
5. Check email service configuration

---

**🎯 Result**: Your payment system will now be bulletproof against browser closures and provide a much better user experience!
