# Hostinger Email Setup Guide

## Step 1: Get Hostinger Email Credentials

1. **Login to Hostinger Control Panel**
   - Go to your Hostinger account dashboard
   - Navigate to "Email" section

2. **Create or Access Email Account**
   - Create a new email account (e.g., `noreply@yourdomain.com`)
   - Or use an existing email account

3. **Get SMTP Settings**
   - **SMTP Host:** `smtp.hostinger.com`
   - **SMTP Port:** `587` (TLS) or `465` (SSL)
   - **Username:** Your full email address (e.g., `noreply@yourdomain.com`)
   - **Password:** Your email account password
   - **Security:** TLS (for port 587) or SSL (for port 465)

## Step 2: Update Environment Variables

Add these variables to your `.env` file in the backend directory:

```env
# Email Configuration for Hostinger
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your_email_password
```

## Step 3: Test Email Configuration

1. **Restart your backend server** after updating the `.env` file
2. **Check server logs** for the message: "Email transporter verified and ready."
3. **Test email sending** by making a test booking or payment

## Step 4: Troubleshooting

### Common Issues:

1. **"Failed to verify email transporter"**
   - Check if email credentials are correct
   - Ensure SMTP is enabled in Hostinger
   - Verify email account is active

2. **"Authentication failed"**
   - Double-check username and password
   - Make sure you're using the full email address as username
   - Try using port 465 with SSL instead of 587 with TLS

3. **"Connection timeout"**
   - Check if your server can reach `smtp.hostinger.com`
   - Verify firewall settings
   - Try different port (465 instead of 587)

### Alternative Configuration (SSL):

If TLS doesn't work, try SSL configuration:

```env
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your_email_password
```

And update the code to use `secure: true`:

```javascript
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: process.env.EMAIL_PORT || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

## Step 5: Verify Email Sending

After setup, test by:
1. Making a test booking
2. Completing payment
3. Checking if confirmation emails are received

## Security Notes:

- Keep your email credentials secure
- Use environment variables (never hardcode credentials)
- Consider using email-specific passwords
- Regularly update email passwords 