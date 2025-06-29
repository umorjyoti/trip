# Custom Trek Feature Test Guide

## Overview
The custom trek feature allows admins to create private treks for specific customers with simplified booking flows.

## Features Implemented

### 1. Custom Trek Creation
- **Location**: Admin Dashboard → Trek Management
- **Steps**:
  1. Click "Add New Trek"
  2. Fill in trek details
  3. Check "This is a custom trek (private booking only)"
  4. Submit the form
  5. Copy the generated custom access URL

### 2. Custom Trek Management
- **Location**: Admin Dashboard → Trek Management
- **Features**:
  - Toggle between "Regular Treks" and "Custom Treks"
  - Custom treks show "Custom" badge
  - Expiration date displayed for custom treks
  - Custom treks are hidden from public listings

### 3. Custom Trek Access
- **URL Structure**: `/custom-trek/[token]`
- **Features**:
  - Access token validation
  - 2-week expiration check
  - Custom trek detail page
  - Simplified booking form

### 4. Custom Trek Booking
- **Features**:
  - No participant details required
  - Only basic contact info (name, email, phone)
  - Direct confirmation after booking
  - No payment flow (immediate confirmation)

## Test Scenarios

### Scenario 1: Create Custom Trek
1. Login as admin
2. Go to Trek Management
3. Click "Add New Trek"
4. Fill required fields:
   - Name: "Test Custom Trek"
   - Description: "A test custom trek"
   - Region: Select any region
   - Difficulty: Moderate
   - Duration: 3
   - Price: 5000
   - Check "This is a custom trek"
5. Submit form
6. Verify custom access URL is generated
7. Copy the URL

### Scenario 2: Access Custom Trek
1. Open the custom access URL in a new browser/incognito window
2. Verify the custom trek detail page loads
3. Check that the "Custom Trek" banner is displayed
4. Verify expiration date is shown
5. Test booking flow (requires login)

### Scenario 3: Custom Trek Booking
1. Login as a regular user
2. Access the custom trek URL
3. Click "Book This Custom Trek"
4. Fill in contact details:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "1234567890"
5. Select number of participants
6. Submit booking
7. Verify booking is confirmed immediately

### Scenario 4: Admin Management
1. Login as admin
2. Go to Trek Management
3. Toggle to "Custom Treks"
4. Verify only custom treks are shown
5. Check "Custom" badges and expiration dates
6. Toggle back to "Regular Treks"
7. Verify custom treks are hidden

### Scenario 5: Expiration Test
1. Create a custom trek
2. Manually update the expiration date in database to past date
3. Try to access the custom trek URL
4. Verify "Link expired" error is shown

## API Endpoints

### Backend Endpoints
- `GET /api/treks/custom/:token` - Get custom trek by token
- `GET /api/treks/all?showCustom=true` - Get custom treks
- `POST /api/bookings/custom` - Create custom trek booking

### Frontend Routes
- `/custom-trek/:token` - Custom trek detail page

## Database Schema Updates

### Trek Model
```javascript
{
  isCustom: Boolean,
  customLinkExpiry: Date,
  customAccessToken: String
}
```

## Security Features
- Access token validation
- Expiration date checking
- Custom treks hidden from public listings
- Admin-only custom trek creation

## Notes
- Custom treks have a single "custom" batch with large capacity
- No participant details are collected during booking
- Bookings go directly to "confirmed" status
- Custom access URLs expire after 2 weeks
- All existing trek functionality remains unchanged 