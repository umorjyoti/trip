# Active Context

## Current Focus
**Region Slug-Based URL Implementation** - Successfully implemented region detail pages using region names as URLs instead of IDs, with proper slugification and uniqueness validation.

## Recent Changes (Latest Session)
- **Backend Implementation**:
  - Added `slug` field to Region model with unique constraint and proper validation
  - Added pre-save middleware to automatically generate slugs from region names
  - Created `getRegionBySlug` function in regionController.js to fetch regions by slug
  - Added new route `/regions/slug/:slug` to handle slug-based requests
  - Enhanced `createRegion` function with duplicate name validation
  - Created migration script to add slugs to existing regions
- **Frontend Implementation**:
  - Updated `createRegionSlug` function to match backend slug generation logic
  - Enhanced RegionForm error handling to show specific field errors for duplicate names
  - Updated all region navigation components to use slug-based URLs
  - Improved user experience with proper error messages and field focus
- **Database Migration**:
  - Successfully migrated 5 existing regions with generated slugs
  - All existing regions now have proper URL-friendly slugs
- **User Experience Features**:
  - Region URLs now use readable names instead of IDs (e.g., `/regions/meghalaya`)
  - Admin cannot create regions with duplicate names - shows proper error message
  - Automatic slug generation from region names (spaces become hyphens)
  - Proper validation and error handling for duplicate names
  - Updated all region links throughout the application to use slug-based URLs

## Recent Changes (Latest Session)
- **Trek Slug-Based URL Implementation** - Successfully implemented trek detail pages using trek names as URLs instead of IDs, with proper slugification and uniqueness validation.
- **Backend Implementation**:
  - Added `slug` field to Trek model with unique constraint and proper validation
  - Added pre-save middleware to automatically generate slugs from trek names
  - Created `getTrekBySlug` function in trekController.js to fetch treks by slug
  - Added new route `/treks/slug/:slug` to handle slug-based requests
  - Enhanced `createTrek` function with duplicate name validation
  - Created migration script to add slugs to existing treks
- **Frontend Implementation**:
  - Updated `createTrekSlug` function to match backend slug generation logic
  - Enhanced TrekForm error handling to show specific field errors for duplicate names
  - Improved user experience with proper error messages and field focus
- **Database Migration**:
  - Successfully migrated 5 existing treks with generated slugs
  - All existing treks now have proper URL-friendly slugs
- **User Experience Features**:
  - Trek URLs now use readable names instead of IDs (e.g., `/treks/everest-base-camp-trek`)
  - Admin cannot create treks with duplicate names - shows proper error message
  - Automatic slug generation from trek names (spaces become hyphens)
  - Proper validation and error handling for duplicate names

## Recent Changes (Latest Session)
- **Related Blogs Feature Implementation** - Successfully implemented related blogs functionality that shows blogs from the same region on blog detail pages.
- **Backend Implementation**:
  - Added `getRelatedBlogs` function to blogController.js to fetch related blogs by region
  - Added new route `/blogs/related/:blogId/:regionId` to get related blogs
  - Implemented caching for related blogs with 5-minute TTL
  - Excludes current blog from related blogs results
  - Limits results to 3 related blogs by default
- **Frontend Implementation**:
  - Created `RelatedBlogs` component with modern card design and hover effects
  - Added `getRelatedBlogs` API function to services/api.js
  - Updated BlogDetail.js to fetch and display related blogs
  - Added related blogs section at the bottom of blog detail pages
  - Implemented proper loading states and error handling
- **User Experience Features**:
  - Related blogs display in a beautiful grid layout with 3 columns
  - Each related blog card shows image, title, excerpt, author, and date
  - Hover effects with scale and shadow animations
  - "Explore All Stories from [Region]" button to view all blogs from that region
  - Responsive design that works on all screen sizes
  - Only shows related blogs section if the blog has a region assigned

## Recent Changes (Latest Session)
- **URL State Management**: Added URL query parameter support to maintain batch selection after page refresh
- **Cancelled Participant Display**: Added strikethrough styling and "(Cancelled)" label for cancelled participants in batch performance view
- **Visual Feedback**: Cancelled participants are shown with grayed-out text and clear cancellation indicators
- **Participant Count Updates**: Ensured participant counts only include active (non-cancelled) participants
- **Data Refresh**: Added automatic refresh of both batch details and overall performance data after cancellations
- **Batch Card Navigation**: Made batch cards clickable to navigate to performance page with pre-selected batch

## Previous Changes (Latest Session)
- **User Management Search**: Added search bar to AdminUsers.js page with real-time filtering by name or email
- **Team Management Search**: Added search bar to AdminTeam.js page with real-time filtering by name or email
- **Enhanced User Experience**: Both dashboards now show filtered results count and proper empty states
- **Consistent UI Design**: Search bars use consistent styling with search icons and proper focus states
- **Real-time Filtering**: Search works instantly as users type, filtering both name and email fields
- **Improved Navigation**: Better user experience when managing large numbers of users

## Previous Changes (Latest Session)
- **New Admin Team Management**: Added a new quick action "Manage Team" in the admin dashboard
- **Permission System**: Added `manageTeam` permission to UserGroup model for controlling access
- **Backend API**: Created `/users/admins` endpoint to fetch only admin users
- **Frontend Page**: Created AdminTeam.js page similar to AdminUsers but filtered for admins only
- **Navigation**: Added "Team" navigation item in AdminLayout sidebar
- **Route Protection**: Added protected route `/admin/team` with `manageTeam` permission requirement
- **UI Consistency**: AdminTeam page uses same UI design as AdminUsers for consistency

## Recent Changes (Latest Session)
- **FRONTEND_URL Environment Variable Issue**: Fixed the problem where `process.env.FRONTEND_URL` was undefined, causing reset links to be malformed
- **Created Config Utility**: Added `backend/utils/config.js` with `getFrontendUrl()` helper function for consistent URL handling
- **Updated Auth Controller**: Replaced all hardcoded FRONTEND_URL fallbacks with the centralized helper function
- **Updated Auth Routes**: Applied the same fix to Google authentication redirects
- **Environment-Aware Fallbacks**: Implemented proper fallbacks based on NODE_ENV:
  - Production: `https://bengalurutrekkers.com`
  - Development: `http://localhost:3000`
- **Consistent URL Generation**: All password reset and authentication redirects now use the same logic

## Key Implementation Details
- **URL State Management**:
  - Added URL query parameter support using `useSearchParams` hook
  - URL updates automatically when batch is selected: `/performance?batchId=123`
  - URL maintains batch selection after page refresh or cancellation
  - Clear URL when batch details are closed
- **Cancellation Display Enhancement**:
  - Added conditional styling for cancelled participants with strikethrough and grayed-out text
  - Clear visual indicators showing "(Cancelled)" label for cancelled participants
  - Maintained readability while clearly distinguishing cancelled from active participants
  - Proper color coding (red for cancelled status, gray for cancelled details)
- **Data Management**:
  - Backend already correctly calculates participant counts excluding cancelled participants
  - Added automatic refresh of both batch details and overall performance data after cancellations
  - Ensured real-time updates of participant counts and revenue calculations
- **Navigation Enhancement**:
  - Made batch cards clickable in admin trek management page
  - Added navigation to performance page with batch pre-selection via query parameters
  - Prevented navigation when editing batches to avoid conflicts
- **Previous Implementation Details**:
  - **Search Functionality**:
    - Added real-time search filtering to both AdminUsers and AdminTeam pages
    - Search works on both name and email fields with case-insensitive matching
    - Filtered results count display shows current filtered vs total users
    - Proper empty states for when no results match search criteria
  - **UI/UX Enhancements**:
    - Consistent search bar design with search icon and proper styling
    - Real-time filtering as users type (no need to press enter)
    - Responsive design that works on all screen sizes
    - Clear visual feedback with result counts and empty states
  - **Technical Implementation**:
    - Added `filteredUsers` and `filteredAdmins` state variables for filtered results
    - Used `useEffect` hooks to handle real-time filtering based on search term
    - Maintained all existing functionality while adding search capability
    - Search is performed client-side for instant results
- **Previous Implementation Details**:
  - **Permission System**: Added `manageTeam` permission to UserGroup model for granular access control
  - **Backend Implementation**:
    - Updated UserGroup model to include `manageTeam` permission
    - Enhanced userController.js with `getAdmins()` function to fetch only admin users
    - Added `/users/admins` route with `manageTeam` permission check
  - **Frontend Implementation**:
    - Created AdminTeam.js page with same UI as AdminUsers but filtered for admins
    - Added "Manage Team" quick action to AdminDashboard with `manageTeam` permission
    - Added navigation item in AdminLayout sidebar
    - Added protected route `/admin/team` in App.js
    - Updated API service to use correct `/users/admins` endpoint
- **Files Modified**:
  - `frontend/src/pages/AdminUsers.js` - Added search functionality
  - `frontend/src/pages/AdminTeam.js` - Added search functionality
  - **Previous Files Modified**:
    - `backend/models/UserGroup.js` - Added manageTeam permission
    - `backend/controllers/userController.js` - Enhanced getAdmins function
    - `backend/routes/userRoutes.js` - Updated route permission
    - `frontend/src/services/api.js` - Fixed getAdmins endpoint
    - `frontend/src/pages/AdminTeam.js` - New page (created)
    - `frontend/src/pages/AdminDashboard.js` - Added quick action
    - `frontend/src/App.js` - Added route and import
    - `frontend/src/layouts/AdminLayout.js` - Added navigation item

## Current Status
✅ **COMPLETED**: Batch performance URL state management and cancellation display have been enhanced
- URL now maintains batch selection with query parameters (e.g., `/performance?batchId=123`)
- Cancelled participants display with strikethrough styling and clear visual indicators
- Participant counts correctly show only active (non-cancelled) participants
- Automatic data refresh after cancellations ensures real-time updates
- Batch cards are now clickable for easy navigation to performance page
- URL state persists after page refresh and cancellation operations
- All existing functionality preserved while improving user experience

✅ **PREVIOUSLY COMPLETED**: Search functionality has been successfully added to both user management dashboards
- Real-time search bars added to AdminUsers and AdminTeam pages
- Search filters by both name and email with case-insensitive matching
- Filtered results count display shows current filtered vs total users
- Proper empty states for when no results match search criteria
- Consistent UI design with search icons and proper styling
- All existing functionality preserved while adding search capability

✅ **PREVIOUSLY COMPLETED**: Admin Team Management feature is fully implemented
- New "Manage Team" quick action added to admin dashboard
- `manageTeam` permission added to UserGroup model
- Backend API endpoint `/users/admins` created and working
- AdminTeam page created with same UI as AdminUsers
- Navigation and routing properly configured
- Permission-based access control implemented
- All admin users can be viewed and managed in dedicated interface

## User Experience Flow
1. **Admin Access**: Admin navigates to user management or team management dashboard
2. **Search Functionality**: Admin can use the search bar to filter users by name or email
3. **Real-time Results**: Search results update instantly as admin types
4. **Filtered Count**: Admin sees how many users match the current search criteria
5. **User Management**: Admin can view, edit roles, and assign user groups to filtered users
6. **Clear Search**: Admin can clear search to see all users again
7. **Navigation**: Admin can navigate between user management and team management pages

## Previous User Experience Flow
1. **Admin Access**: Admin navigates to admin dashboard
2. **Quick Action**: Admin sees "Manage Team" quick action (if they have `manageTeam` permission)
3. **Team Management**: Admin clicks "Manage Team" to view admin users only
4. **User Management**: Admin can view, edit roles, and assign user groups to admin users
5. **Navigation**: Admin can also access team management via sidebar navigation
6. **Permission Control**: Only users with `manageTeam` permission can access this feature

## Technical Notes
- **Search Implementation**: Client-side filtering for instant results without API calls
- **Performance**: Search is efficient and works with large user lists
- **Accessibility**: Search inputs have proper labels and ARIA attributes
- **Responsive Design**: Search bars work well on all screen sizes
- **State Management**: Separate state for original and filtered user lists
- **Error Handling**: Proper handling of null/undefined user data in search
- **Previous Technical Notes**:
  - The `manageTeam` permission provides granular access control for team management
  - Backend API filters users by `role: 'admin'` to show only admin users
  - Frontend uses same UI components as AdminUsers for consistency
  - Permission system ensures only authorized users can access team management
  - Navigation integrates seamlessly with existing admin layout
  - API endpoint `/users/admins` is protected by `manageTeam` permission
  - All existing user management functionality preserved in AdminTeam page

## Next Steps
- Test the search functionality with various search terms and edge cases
- Verify that search works correctly with large user lists
- Test search functionality on different devices and screen sizes
- Consider adding additional search filters (by role, user group, etc.)
- Monitor for any performance issues with large datasets
- Test the complete user management flow with search functionality

## Previous Next Steps
- Test the complete team management flow end-to-end
- Verify that only users with `manageTeam` permission can access the feature
- Test role changes and user group assignments in AdminTeam page
- Consider adding additional team management features (bulk operations, etc.)
- Monitor for any permission-related issues
- Test navigation between AdminUsers and AdminTeam pages

## Previous Focus
**Fixed Admin Weekend Getaway UI** - Successfully improved the admin weekend getaway management interface with modern design, better UX, and enhanced functionality.

## Recent Changes (Latest Session)
- **WeekendGetawayManager Component**: Completely redesigned the admin weekend getaway management interface:
  - **Modern Card Layout**: Replaced dense table layout with beautiful card-based design
  - **Grid/Table View Toggle**: Added ability to switch between grid and table views
  - **Advanced Search & Filtering**: Implemented search by name/region/difficulty, region filtering, and sorting
  - **Improved Visual Hierarchy**: Better spacing, typography, and color scheme
  - **Enhanced Mobile Responsiveness**: Grid layout works perfectly on mobile devices
  - **Better Loading States**: Added proper loading spinner and empty states
  - **Improved Modals**: Cleaner form design with better user experience
  - **Visual Feedback**: Added badges, icons, and hover effects for better UX
  - **Confirmation Dialogs**: Added confirmation for destructive actions
  - **Accessibility Improvements**: Better keyboard navigation and ARIA labels
  - **Fixed Image Loading**: Resolved issue where trek images weren't loading by using correct `trek.images[0]` field instead of non-existent `trek.imageUrl`
  - **Added Error Handling**: Added fallback images and error handlers for failed image loads
  - **Enhanced Confirmation Modal**: Replaced basic browser alert with a professional confirmation modal for removing treks from weekend getaways
  - **Fixed View Links**: Corrected view links to point to appropriate detail pages:
    - Weekend getaways: `/weekend-getaways/:id` (WeekendGetawayDetail page)
    - Available treks: `/treks/:name` (TrekDetail page using trek name slug with proper state navigation)
    - **Removed target="_blank"**: Fixed location state loss by removing new tab opening, ensuring proper state navigation
  - **Updated Weekend Getaway User Experience**: 
    - Replaced hardcoded data with real API data from `getWeekendGetaways()`
    - Updated WeekendGetawayCard to use same design as TrekCard.js
    - Changed navigation to redirect to TrekDetail.js instead of WeekendGetawayDetail
    - Added proper loading states and error handling
    - Dynamic category filtering based on actual trek data

## Recent Changes (Latest Session)
- **Backend Implementation**:
  - **User Model**: Added `resetPasswordToken` and `resetPasswordExpire` fields to User model
  - **Reset Token Method**: Added `getResetPasswordToken()` method to generate secure reset tokens
  - **Auth Controller**: Added `forgotPassword` and `resetPassword` functions with proper error handling
  - **Email Functionality**: Created `sendPasswordResetEmail()` function with beautiful HTML email template
  - **Routes**: Added `/auth/forgot-password` and `/auth/reset-password` routes with Swagger documentation
- **Frontend Implementation**:
  - **ForgotPassword Page**: Created new page for requesting password reset with email input
  - **ResetPassword Page**: Created new page for setting new password with token validation
  - **API Service**: Added `forgotPassword()` and `resetPassword()` API functions
  - **Login Page**: Updated "Forgot your password?" link to navigate to forgot password page
  - **App Routes**: Added routes for `/forgot-password` and `/reset-password/:token`

## Key Implementation Details
- **Modern UI Design**:
  - Card-based layout with hover effects and smooth transitions
  - Consistent color scheme using emerald as primary color
  - Proper spacing and typography hierarchy
  - Responsive grid system (1-3 columns based on screen size)
- **Enhanced Functionality**:
  - Real-time search across trek names, regions, and difficulty levels
  - Region-based filtering with dropdown selection
  - Multi-column sorting (name, region, duration, difficulty)
  - Toggle between ascending/descending sort order
  - Grid and table view modes for different preferences
- **Improved User Experience**:
  - Loading spinner with descriptive text
  - Empty states with helpful messages and call-to-action buttons
  - Confirmation dialogs for destructive actions
  - Visual badges for weekend getaway status and suitability
  - Hover effects and smooth transitions throughout
- **Better Form Design**:
  - Cleaner modal forms with proper spacing
  - Enhanced weekend highlights management with add/remove functionality
  - Better input styling with focus states
  - Improved button hierarchy and styling
- **Professional Confirmation Dialogs**:
  - Replaced basic browser alerts with custom confirmation modals
  - Detailed information about what the action will do
  - Visual confirmation with trek image and details
  - Clear warning about irreversible actions

## Current Status
✅ **COMPLETED**: Admin weekend getaway UI has been completely redesigned and improved
- Modern card-based layout with responsive design
- Advanced search, filtering, and sorting functionality
- Grid and table view toggle for user preference
- Enhanced modal forms with better UX
- Proper loading states and empty state handling
- Mobile-responsive design that works on all screen sizes
- Visual feedback and professional confirmation dialogs for better UX
- Fixed image loading issues with proper fallbacks

## User Experience Flow
1. **Admin Access**: Admin navigates to /admin/weekend-getaways
2. **Overview**: Admin sees current weekend getaways and available treks
3. **Search & Filter**: Admin can search treks and filter by region
4. **View Toggle**: Admin can switch between grid and table views
5. **Add Trek**: Admin clicks "Add to Weekend Getaways" on any trek
6. **Configure Details**: Admin fills in transportation, timing, and highlights
7. **Save**: Trek is added to weekend getaways with all details
8. **Manage**: Admin can edit or remove weekend getaways as needed
9. **Remove Trek**: Admin clicks "Remove" and sees professional confirmation modal with trek details and consequences

## Technical Notes
- Uses existing API endpoints (`toggleWeekendGetaway`, `getTreks`)
- Integrates seamlessly with current admin layout and styling
- Maintains all existing functionality while improving UX
- Follows existing code patterns and component structure
- Includes comprehensive error handling and loading states
- Responsive design using Tailwind CSS grid and flexbox
- Fixed image loading by using correct data structure (`trek.images[0]` instead of `trek.imageUrl`)
- Added fallback images and error handlers for robust image display
- Implemented professional confirmation modals to replace basic browser alerts
- All syntax checks passed successfully

## Next Steps
- Test the complete weekend getaway management flow end-to-end
- Verify search, filtering, and sorting functionality
- Test mobile responsiveness on different devices
- Monitor for any performance issues with large trek lists
- Consider adding bulk operations for managing multiple treks
- Test edge cases (empty states, error handling, etc.)

## Previous Focus
**Fixed Trek Detail Access Issue** - Resolved authentication requirement that was preventing users from viewing trek details without being logged in.

## Recent Changes (Latest Session)
- **Fixed Trek Detail Route**: Removed `protect` middleware from `GET /api/treks/:id` route in `backend/routes/trek.routes.js`
- **Public Access**: Trek details are now accessible without authentication, allowing users to browse treks before deciding to register
- **Consistent with Project Goals**: Aligns with project brief requirement that users should be able to browse and view trek details without logging in

## Key Implementation Details
- **Route Fix**: Changed `router.get('/:id', protect, ...)` to `router.get('/:id', ...)` in trek routes
- **Maintains Security**: Other trek routes (create, update, delete) still require authentication
- **Public Browsing**: Users can now view trek details, pricing, itineraries, and available batches without logging in
- **Booking Still Protected**: Users still need to log in to make bookings, which is the correct behavior

## Current Status
✅ **COMPLETED**: Trek detail access issue is fully resolved
- Users can view trek details without authentication
- Trek listing endpoint remains public
- Region browsing remains public
- All admin and booking functionality still requires proper authentication
- Tested with curl requests to confirm functionality

## User Experience Flow
1. **Landing on Trek Pages**: Users can browse treks without logging in
2. **Viewing Details**: Full trek information accessible to all users
3. **Booking Decision**: Users can see pricing and availability before deciding to register
4. **Registration**: Only required when users want to make a booking
5. **Admin Functions**: Still properly protected with authentication

## Technical Notes
- Only the trek detail route was affected - other routes were correctly configured
- The fix maintains security while improving user experience
- No changes needed to frontend code - API calls work as expected
- Tested with multiple trek IDs to confirm consistency

## Next Steps
- Test the complete user flow from browsing to booking
- Verify that booking process still requires authentication
- Consider adding analytics to track browsing vs booking conversion
- Monitor for any other public routes that might need similar fixes

## Previous Focus
**Region-Based Blog Browsing** - Successfully implemented a new user experience for browsing blogs by region with region cards and region-specific blog listings.

## Recent Changes (Latest Session)
- **BlogList.js**: Completely redesigned to show region cards as the main view
- **View Mode Toggle**: Added switch between "Browse by Region" and "View All Blogs"
- **Region Cards**: Beautiful card layout showing region images, names, descriptions, and blog counts
- **Blog Region Visibility**: Fixed blog region dropdown in blog editor to show available regions
- **Enhanced UX**: Improved navigation and visual feedback throughout

## Key Implementation Details
- **Dual View Modes**: 
  - "Browse by Region" (default): Shows region cards with blog counts
  - "View All Blogs": Traditional blog list with search and filters
- **Region Cards**: 
  - Display region image, name, description, and blog count
  - Hover effects with scale and shadow animations
  - Click to navigate to region-specific blog page
- **Blog Counts**: Fetches and displays number of blogs per region
- **Navigation**: Seamless switching between view modes
- **Responsive Design**: Works on all screen sizes

## Current Status
✅ **COMPLETED**: Region-based blog browsing experience is fully implemented
- Users see region cards when first visiting /blogs
- Clicking on region cards takes users to region-specific blog pages
- Toggle between region view and all blogs view
- Blog editor now properly shows available regions
- All existing functionality preserved

## User Experience Flow
1. **Landing on /blogs**: Users see beautiful region cards with blog counts
2. **Region Selection**: Click any region card to see all blogs from that region
3. **Region Page**: Dedicated page showing region info and filtered blogs
4. **View All**: Option to see all blogs across all regions
5. **Blog Creation**: Admins can assign blogs to regions during creation

## Technical Notes
- Uses existing BlogRegionPage for region-specific views
- Fetches blog counts for each region to show on cards
- Maintains all existing SEO and structured data
- Responsive grid layout for region cards
- Smooth transitions and hover effects
- Proper error handling for missing regions

## Next Steps
- Test the complete user flow
- Verify region-specific blog pages work correctly
- Ensure blog counts are accurate
- Consider adding region-based search functionality
- Monitor user engagement with new interface

## Current Focus
**Blog Region Management Integration** - Successfully integrated blog region management directly into the Blog Management page as requested by the user.

## Recent Changes (Latest Session)
- **BlogManagement.js**: Added tab-based interface with "Blogs" and "Blog Regions" tabs
- **AdminLayout.js**: Removed separate "Blog Regions" menu item from navigation
- **Integration Complete**: Blog region management is now accessible directly within blog management

## Key Implementation Details
- **Tab System**: Added tab navigation to switch between blogs and blog regions
- **Unified Interface**: Both blog and blog region management in one place
- **Consistent UX**: Maintains same styling and interaction patterns
- **Navigation**: "New Blog" button for blogs tab, "New Region" button for regions tab
- **Functionality**: Full CRUD operations for blog regions within the integrated interface

## Current Status
✅ **COMPLETED**: Blog region management is now integrated into the Blog Management page
- Users can switch between managing blogs and blog regions using tabs
- All blog region functionality (create, edit, delete, view) is available
- Separate menu item removed from admin navigation
- Routes still exist for direct access when needed

## Next Steps
- Test the integrated interface
- Verify all blog region operations work correctly
- Ensure proper permissions are maintained
- Consider any additional UX improvements

## Technical Notes
- Blog region routes in App.js are still maintained for direct navigation
- API calls and backend functionality remain unchanged
- Modal components and icons added for better UX
- Delete confirmation modal implemented for safety

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

**NEW: Implemented Blog Region Categorization Feature**: Added comprehensive blog categorization by region system:
- **Backend Implementation**:
  - Created `BlogRegion` model with name, description, image, and slug fields
  - Updated `Blog` model to include region reference (required field)
  - Created `blogRegionController` with full CRUD operations
  - Added `blogRegionRoutes` with proper authentication and admin middleware
  - Updated `blogController` to support region filtering and population
  - Added region-based blog querying functionality
  - Integrated with existing server.js routing
- **Frontend Implementation**:
  - Created `BlogRegionForm` component for creating/editing blog regions
  - Created `BlogRegionManager` component for admin region management
  - Created `BlogRegionListPage` and `BlogRegionFormPage` admin pages
  - Updated `BlogEditor` to include region dropdown selection
  - Updated `BlogList` to show region information and filtering
  - Created `BlogRegionPage` for region-specific blog listings
  - Added region display and links in `BlogDetail` page
  - Updated admin navigation to include blog region management
  - Added all necessary API service functions
- **User Experience Features**:
  - Region filtering in main blog list
  - Region-specific blog pages (`/blogs/region/:slug`)
  - Region badges and links in blog cards and detail pages
  - Breadcrumb navigation with region context
  - SEO-optimized region pages with proper meta tags
  - Admin interface for managing blog regions separately from trek regions
- **Key Features**:
  - Separate blog regions from trek regions (different models and management)
  - Region images for visual identification
  - Region slugs for SEO-friendly URLs
  - Region filtering and search functionality
  - Admin CRUD operations for blog regions
  - Region-based blog organization and navigation

**Next Steps:**
1. Test the complete blog region categorization flow
2. Create sample blog regions and assign blogs to them
3. Verify region filtering and navigation works correctly
4. Test admin blog region management interface
5. Ensure SEO optimization is working properly for region pages
6. Consider adding region-based analytics and reporting