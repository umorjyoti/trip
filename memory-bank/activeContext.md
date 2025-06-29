# Active Context

**Current Focus:** Implementing custom trek feature for admin-created private treks with special booking flow.

**Recent Changes:**

*   **Branding Update**: Successfully changed all occurrences of "TrekBooker" to "Bengaluru Trekkers" and "trekbooker.com" to "bengalurutrekkers.com" throughout the codebase:
    - Updated memory bank files (projectbrief.md, productContext.md)
    - Updated frontend components (Header, Navbar, Footer, HeroSection, AdminLayout)
    - Updated frontend pages (About, Contact)
    - Updated backend controller (careerController.js)
    - Updated test files (Header.test.js)
    - Updated public files (index.html, manifest.json)
    - All email addresses changed from @trekbooker.com to @bengalurutrekkers.com
    - All display names and titles updated to reflect the new branding with proper spacing ("Bengaluru Trekkers")
*   Created initial versions of all core Memory Bank files based on codebase analysis.
*   **Fixed registration duplicate email error**: Updated `backend/controllers/authController.js` to properly handle duplicate email errors during user registration. The issue was that the duplicate email check was commented out, causing MongoDB to throw E11000 duplicate key errors. Now the system:
    - Checks for existing users by email before attempting to create a new user
    - Checks for existing usernames before creation
    - Provides meaningful error messages to users
    - Has proper error handling for MongoDB duplicate key errors as a fallback
*   **Implemented OTP verification system**: Completely restructured the authentication flow to implement proper OTP verification:
    - **Backend Changes**:
      - Added `isVerified` field to User model to track email verification status
      - Created temporary storage system for pending registrations (in-memory Map, production should use Redis)
      - Modified registration flow: user data is stored temporarily until OTP verification, not saved to database immediately
      - Updated OTP verification to create user in database only after successful verification
      - Added verification checks in login flow to prevent unverified users from logging in
      - Enhanced error handling for duplicate key errors during OTP verification
    - **Frontend Changes**:
      - Created new `OTPVerification` component with resend functionality and countdown timer
      - Updated `Register` component to redirect to OTP verification after registration
      - Updated `Login` component to redirect to OTP verification after login initiation
      - Modified `AuthContext` to handle OTP-based flows and store tokens in both localStorage and sessionStorage
      - Added `/verify-otp` route to App.js
      - Implemented proper token storage in both localStorage and sessionStorage after successful verification
*   **Fixed comprehensive user group permission issues**: Removed unnecessary permission middleware from booking routes and enhanced controller authorization:
    - **Issues Fixed**:
      - `GET /api/bookings/:id` - Users couldn't view their own bookings
      - `PUT /api/bookings/:id` - Users couldn't update their own bookings
      - `PUT /api/bookings/:id/cancel` - Users couldn't cancel their own bookings
      - `PUT /api/bookings/:id/participants/:participantId/cancel` - Users couldn't cancel participants from their bookings
      - `PUT /api/bookings/:id/participants/:participantId/restore` - Users couldn't restore participants in their bookings
      - `PUT /api/bookings/:id/status` - Missing authorization in controller
    - **Root Cause**: The `checkPermissions.js` middleware was denying access to users without a user group, but regular users should be able to manage their own bookings
    - **Solutions Implemented**:
      - Removed `checkMultiplePermissions` and `checkPermission` middleware from user-accessible booking routes
      - Enhanced `updateBookingStatus` controller to add proper admin-only authorization
      - Enhanced `restoreParticipant` controller to add proper authorization (booking owner or admin)
      - Kept `protect` middleware to ensure users are authenticated
      - Relied on controller-level authorization which properly checks if user owns the booking or is admin
    - **Result**: Regular users can now fully manage their own bookings without needing a user group assignment
*   **Fixed API routing issues causing duplicate `/api/api/upload` paths**: Resolved configuration conflicts between frontend proxy and API service:
    - **Issues Fixed**:
      - `POST /api/api/upload` - Duplicate `/api` in upload requests causing 404 errors
      - `DELETE /api/api/upload/:key` - Duplicate `/api` in delete requests
      - Various other API endpoints with duplicate `/api` paths
    - **Root Cause**: 
      - Frontend proxy configured to `http://localhost:5000/api` in `package.json`
      - API service configured with base URL `http://localhost:5001/api`
      - Components making direct axios calls to `/api/upload` instead of using API service
      - Some API service functions using direct axios calls instead of configured api instance
    - **Solutions Implemented**:
      - Fixed API service base URL to match proxy: `http://localhost:5000/api`
      - Updated `ImageUploader` component to use API service instead of direct axios calls
      - Updated `TrekForm` component to use API service for upload operations
      - Fixed all direct axios calls in `api.js` service to use configured api instance
      - Standardized all API calls to use the configured api instance with proper base URL
    - **Result**: All API calls now use consistent routing without duplicate `/api`
*   **NEW: Implementing Custom Trek Feature**: Adding support for admin-created private treks with special booking flow:
    - **Custom Trek Characteristics**:
      - Completely hidden from general users
      - Admin dashboard toggle between regular and custom treks
      - Custom URL structure: `/trek/trek-name`
      - 2-week expiration date for custom links
      - Simplified booking flow (no participant details required)
      - Direct confirmation after payment
      - Single custom batch per trek
    - **Implementation Plan**:
      - Update Trek model with custom trek fields
      - Modify trek controller for custom trek logic
      - Update booking flow for custom treks
      - Enhance admin interface with custom trek toggle
      - Create custom trek booking form
      - Update routing for custom trek access

**Next Steps:**
1. Update Trek model with custom trek fields (isCustom, customLinkExpiry, customAccessToken)
2. Modify trek controller to handle custom trek creation and access
3. Update booking controller for simplified custom trek booking flow
4. Enhance admin dashboard with custom trek toggle
5. Create custom trek booking form component
6. Update frontend routing for custom trek access
7. Test complete flow end-to-end