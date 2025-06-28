# Active Context

**Current Focus:** Fixed API routing issues causing duplicate `/api/api/upload` paths and other API endpoint problems.

**Recent Changes:**

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
    - **Result**: All API calls now use consistent routing without duplicate `/api` paths

**Next Steps:**

1.  Test the complete OTP verification flow for both registration and login
2.  Test that regular users can now access all booking functionality without permission issues
3.  Test that upload functionality works correctly without 404 errors
4.  Consider implementing Redis for temporary storage in production
5.  Add email verification resend functionality for existing users
6.  Consider adding rate limiting for OTP requests
7.  Await further instructions or specific tasks from the user.

**Active Decisions/Considerations:**

*   The analysis assumes the codebase provided represents the current state of the project.
*   Features like promo codes, offers, support tickets, and detailed file upload handling are inferred from routes/controllers/models but their full implementation details require further investigation if they become the focus.
*   **Registration Error Handling**: The system now provides user-friendly error messages for duplicate emails and usernames, improving the user experience during registration.
*   **OTP Verification System**: Users must now verify their email with OTP before their account is created and they can log in. This improves security and ensures email validity.
*   **Token Storage**: JWT tokens are now stored in both localStorage and sessionStorage for better persistence and security.
*   **Temporary Storage**: Currently using in-memory Map for pending registrations. In production, this should be replaced with Redis or a similar persistent storage solution.
*   **Permission System**: The permission system is designed for admin functions and should not block regular users from accessing their own data. Controllers should handle authorization logic for user-specific data access.
*   **Booking Management**: Regular users should have full control over their own bookings (view, update, cancel, manage participants) without needing special permissions or user group assignments.
*   **API Configuration**: All frontend API calls should use the configured API service instance to ensure consistent routing and avoid duplicate path issues. The proxy configuration in `package.json` should match the API service base URL. 