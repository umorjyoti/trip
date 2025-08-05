# Database Migrations

This directory contains database migration scripts for the Bengaluru Trekkers application.

## Available Migrations

### 1. Add Admin Created Field Migration
**File:** `addAdminCreatedField.js`
**Purpose:** Adds the `adminCreated` field to all existing users in the database.

**What it does:**
- Finds all users that don't have the `adminCreated` field
- Sets `adminCreated: false` for all existing users (since they were not created by admins)
- Provides detailed logging of the migration process

**When to run:**
- After deploying the new User model with the `adminCreated` field
- Before using the Manual Booking System feature

## How to Run Migrations

### Option 1: Using npm script (Recommended)
```bash
cd backend
npm run migrate:admin-created
```

### Option 2: Direct execution
```bash
cd backend
node migrations/addAdminCreatedField.js
```

## Migration Output

The migration will provide detailed output including:
- Number of users found without the `adminCreated` field
- Number of users successfully updated
- Success/error messages
- Database connection status

## Safety Features

- **Safe to run multiple times:** The migration only updates users that don't already have the `adminCreated` field
- **Detailed logging:** Provides clear feedback about what was updated
- **Error handling:** Graceful error handling with proper database connection cleanup
- **No data loss:** This is an additive migration that only adds a new field

## Prerequisites

- Ensure your `.env` file has the correct `MONGODB_URI` configuration
- Make sure the database is accessible
- Backup your database before running migrations (recommended for production)

## Troubleshooting

If the migration fails:
1. Check your MongoDB connection string in `.env`
2. Ensure you have proper database permissions
3. Check the console output for specific error messages
4. Verify that the User model has been updated with the `adminCreated` field 