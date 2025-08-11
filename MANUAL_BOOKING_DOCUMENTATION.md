# Manual Booking System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [User Workflow](#user-workflow)
3. [Technical Implementation](#technical-implementation)
4. [API Endpoints](#api-endpoints)
5. [Data Flow](#data-flow)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance and Updates](#maintenance-and-updates)

---

## System Overview

### What is Manual Booking?
The Manual Booking System is a comprehensive solution that allows administrators to create trek bookings on behalf of users. It handles both existing and new users, manages participant details, and integrates with the payment and trek management systems.

### Key Features
- **Multi-step booking process** (3 steps)
- **User management** (existing user lookup, new user creation)
- **Trek and batch selection**
- **Participant management** (multiple participants per booking)
- **Emergency contact handling**
- **Payment status tracking**
- **Comprehensive validation**

---

## User Workflow

### For Administrators

#### Step 1: User Selection/Creation
1. **Existing User**
   - Enter phone number
   - System validates and retrieves user details
   - User information auto-populates

2. **New User**
   - Fill in required fields: Name, Email, Phone
   - Optional: Address, Date of Birth
   - System creates user account

#### Step 2: Trek and Batch Selection
1. **Select Trek**
   - Choose from available treks
   - View trek details and pricing

2. **Select Batch**
   - Choose available batch dates
   - View batch capacity and availability

3. **Set Number of Participants**
   - Specify total participants
   - System adjusts pricing accordingly

#### Step 3: Booking Details
1. **User Details Confirmation**
   - Verify user information
   - Update if necessary

2. **Participant Information**
   - Add participant details (Name, Age, Gender)
   - Optional: Medical conditions
   - Emergency contact information

3. **Final Review and Creation**
   - Review all information
   - Create booking
   - Receive confirmation

### For End Users
- Receive booking confirmation
- Access booking details through their account
- Make payments if required
- View trek information and updates

---

## Technical Implementation

### Frontend Architecture

#### Component Structure
```
ManualBookingModal/
├── Step 1: User Management
├── Step 2: Trek/Batch Selection
└── Step 3: Booking Details
```

#### Key State Variables
```javascript
const [currentStep, setCurrentStep] = useState(1);
const [selectedUser, setSelectedUser] = useState(null);
const [selectedTrek, setSelectedTrek] = useState('');
const [selectedBatch, setSelectedBatch] = useState('');
const [bookingData, setBookingData] = useState({
  userDetails: {},
  participantDetails: [],
  emergencyContact: {},
  numberOfParticipants: 1,
  totalPrice: 0,
  paymentStatus: 'unpaid'
});
```

#### Validation System
- **Step 1**: User data validation (name, email, phone)
- **Step 2**: Required field validation
- **Step 3**: Comprehensive booking validation

### Backend Architecture

#### Database Models
- **User**: Basic user information
- **Trek**: Trek details and pricing
- **Batch**: Available dates and capacity
- **Booking**: Complete booking information
- **Participant**: Individual participant details

#### API Structure
- RESTful endpoints
- JWT authentication
- Comprehensive error handling
- Data validation middleware

---

## API Endpoints

### User Management
```
POST /api/users/validate-phone
POST /api/users/create-for-manual-booking
```

### Trek Management
```
GET /api/treks
GET /api/treks/:id
```

### Batch Management
```
GET /api/batches
GET /api/batches/:id
```

### Booking Management
```
POST /api/bookings/manual/create-booking
GET /api/bookings/:id
PUT /api/bookings/:id
```

---

## Data Flow

### 1. User Identification Flow
```
Phone Input → API Validation → User Exists? → Set User Data
                                    ↓
                              Create New User → Set User Data
```

### 2. Booking Creation Flow
```
User Data + Trek + Batch → Validation → API Call → Success/Error
```

### 3. State Synchronization
```
selectedUser ↔ bookingData.userDetails
selectedTrek + selectedBatch → bookingData
participantDetails → numberOfParticipants → totalPrice
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "User ID is not being passed in the payload"
**Symptoms**: 400 status code, "User information is missing" error
**Cause**: Race condition between user creation/selection and booking creation
**Solution**: 
- Ensure `selectedUser` has valid ID (`_id` or `id`)
- Check user object structure in console logs
- Verify user creation completed before proceeding

#### 2. Validation Errors for Correct Input
**Symptoms**: Valid data flagged as incorrect
**Cause**: Inverted validation logic
**Solution**: Check validation function return values and conditions

#### 3. Missing User Details
**Symptoms**: User data not populating in Step 3
**Cause**: State synchronization issues
**Solution**: Check `useEffect` hooks for user data sync

#### 4. API 400 Status Code
**Symptoms**: Booking creation fails with validation error
**Cause**: Missing required fields or invalid data
**Solution**: 
- Check console logs for payload structure
- Verify all required fields are present
- Ensure data types are correct

### Debug Information

#### Console Logs
The system provides extensive logging for debugging:
```javascript
console.log('=== PRE-BOOKING VALIDATION ===');
console.log('selectedUser:', selectedUser);
console.log('bookingData:', bookingData);
console.log('Payload keys:', Object.keys(bookingPayload));
```

#### UI Debug Display
In development mode, Step 3 shows:
- User ID status
- User name
- Current step
- Button enabled/disabled status

### Error Handling

#### Frontend Errors
- Toast notifications for user feedback
- Form validation with field-specific errors
- Step-by-step error prevention

#### Backend Errors
- HTTP status codes
- Detailed error messages
- Validation feedback

---

## Maintenance and Updates

### Regular Checks
1. **API Endpoint Health**
   - Monitor response times
   - Check error rates
   - Verify data consistency

2. **Database Performance**
   - Query optimization
   - Index maintenance
   - Data integrity checks

3. **Frontend Performance**
   - Component rendering
   - State management efficiency
   - User experience metrics

### Update Procedures
1. **Code Changes**
   - Test in development environment
   - Validate all user flows
   - Check error handling

2. **API Updates**
   - Maintain backward compatibility
   - Update documentation
   - Test integration points

3. **Database Changes**
   - Use migrations
   - Backup before changes
   - Test with sample data

---

## Best Practices

### Development
- Always test user creation and booking flows
- Maintain comprehensive logging
- Handle edge cases gracefully
- Use consistent error handling patterns

### User Experience
- Provide clear feedback at each step
- Prevent invalid data submission
- Maintain state consistency
- Offer helpful error messages

### Data Management
- Validate data at multiple levels
- Maintain referential integrity
- Handle concurrent operations safely
- Backup critical data regularly

---

## Support and Contact

### Technical Support
- Check console logs for detailed error information
- Review API response data
- Verify database state
- Test with minimal data sets

### User Support
- Guide users through each step
- Verify data entry accuracy
- Check system status
- Provide alternative workflows if needed

---

*This documentation is maintained by the development team and should be updated with any system changes or new features.* 