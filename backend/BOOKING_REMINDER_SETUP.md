# Booking Reminder System Setup

This system automatically sends reminder emails to users 2 days before their trek starts.

## Features

- ✅ Sends reminder emails 2 days before trek start date
- ✅ Only sends to confirmed bookings
- ✅ Includes comprehensive packing list and important reminders
- ✅ Beautiful HTML email template with responsive design
- ✅ Detailed logging for monitoring
- ✅ **Gets batch ID from booking details** and matches with trek batches

## How Batch ID Retrieval Works

The system correctly retrieves batch IDs from booking details:

1. **Booking Model Structure**: Each booking has a `batch` field that stores the batch ID
2. **Batch ID Retrieval**: `const batchId = booking.batch;`
3. **Batch Matching**: Finds the specific batch in `trek.batches` array using the batch ID
4. **Date Validation**: Checks if the batch starts in exactly 2 days
5. **Email Sending**: Sends reminder only if all conditions are met

### Database Flow:
```
Booking.batch (ID) → Trek.batches.find(batchId) → Batch.startDate → 2-day check → Send Email
```

## Email Content

The reminder email includes:
- Trip details (trek name, dates, booking ID)
- Pickup and drop locations
- Essential packing list
- Important reminders
- Contact information

## Setup Instructions

### 1. Environment Variables

Ensure your `.env` file has the required email configuration:

```env
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
MONGODB_URI=your-mongodb-connection-string
```

### 2. Testing

To test the reminder system:

```bash
# Test batch ID retrieval from booking details
npm run test-batch-id

# Test with a single booking
npm run test-reminder

# Run the full reminder system (sends to all eligible bookings)
npm run reminder
```

### 3. Automated Scheduling

To set up automated reminders, you can use:

#### Option A: Cron Job (Linux/Mac)

Add to your crontab to run daily at 9 AM:

```bash
# Edit crontab
crontab -e

# Add this line
0 9 * * * cd /path/to/your/backend && npm run reminder
```

#### Option B: Windows Task Scheduler

1. Open Task Scheduler
2. Create a new Basic Task
3. Set trigger to Daily at 9:00 AM
4. Set action to start a program
5. Program: `npm`
6. Arguments: `run reminder`
7. Start in: `C:\path\to\your\backend`

#### Option C: Node.js Cron Package

Install node-cron and add to your server.js:

```bash
npm install node-cron
```

Then add to your server.js:

```javascript
const cron = require('node-cron');
const { exec } = require('child_process');

// Run reminder script daily at 9 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running booking reminder script...');
  exec('npm run reminder', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error running reminder script:', error);
      return;
    }
    console.log('Reminder script output:', stdout);
  });
});
```

## How It Works

1. **Script Execution**: The `bookingReminder.js` script runs daily
2. **Booking Retrieval**: Finds all confirmed bookings
3. **Batch ID Extraction**: Gets batch ID from `booking.batch` field
4. **Batch Matching**: Finds the specific batch in `trek.batches` array
5. **Date Calculation**: Checks if batch starts in exactly 2 days
6. **Email Sending**: Sends personalized reminder emails to each user
7. **Logging**: Provides detailed logs for monitoring

## File Structure

```
backend/
├── scripts/
│   ├── bookingReminder.js      # Main reminder script
│   ├── testReminder.js         # Test script for manual testing
│   └── testBatchId.js          # Test batch ID retrieval
├── utils/
│   └── email.js                # Email utility with reminder function
├── controllers/
│   └── bookingController.js    # Booking controller (removed old function)
└── package.json                # Added reminder scripts
```

## Monitoring

The script provides detailed logging:

- ✅ Connection status
- ✅ Batch ID retrieval from booking details
- ✅ Batch matching with trek batches
- ✅ Date validation results
- ✅ Number of bookings processed
- ✅ Email sending status for each user
- ✅ Total reminders sent
- ❌ Any errors encountered

## Troubleshooting

### Common Issues

1. **No emails sent**: Check email configuration in `.env`
2. **No bookings found**: Ensure you have confirmed bookings with future dates
3. **Batch ID not found**: Run `npm run test-batch-id` to debug batch ID retrieval
4. **Database connection error**: Verify MongoDB connection string
5. **Permission errors**: Ensure script has proper file permissions

### Testing

1. Create a test booking with a date 2 days from now
2. Set booking status to 'confirmed'
3. Run `npm run test-batch-id` to verify batch ID retrieval
4. Run `npm run test-reminder` to test manually
5. Check email delivery and content

## Email Template

The reminder email uses a responsive HTML template with:
- Orange theme for urgency
- Packing checklist
- Important reminders
- Contact information
- Mobile-friendly design

## Status Tracking

The system only sends reminders to bookings with status:
- `confirmed` - Fully confirmed bookings

It does NOT send reminders for:
- `pending` - Pending bookings
- `pending_payment` - Awaiting payment
- `cancelled` - Cancelled bookings
- `trek_completed` - Completed treks

## Batch ID Validation

The system validates that:
1. Booking has a valid batch ID
2. Batch ID exists in the trek's batches array
3. Batch start date is exactly 2 days from current date
4. Booking status is 'confirmed'

This ensures accurate and timely reminder delivery. 