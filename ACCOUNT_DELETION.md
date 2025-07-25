# Account Deletion Functionality

## Overview

The account deletion feature allows users to permanently delete their account and all associated data. This is a destructive operation that cannot be undone.

## How It Works

### 1. User Interface
- Located in `/settings` page under "Danger Zone"
- Two-step confirmation process:
  1. **Initial Warning**: Shows what will be deleted and asks for confirmation
  2. **Final Confirmation**: Requires password (for email/password users) and email confirmation

### 2. Security Measures
- **Password Verification**: For email/password users, password must be verified
- **Email Confirmation**: User must type their email address to confirm
- **OAuth Handling**: Google OAuth users can skip password verification
- **Session Validation**: Only authenticated users can access the feature

### 3. Data Cleanup Process

When an account is deleted, the following happens in order:

1. **Stop Active Processes**: Any pending queued chains are stopped
2. **Cancel Stripe Subscription**: 
   - Cancels subscription immediately (not at period end)
   - Deletes the subscription from Stripe
   - Attempts to delete the Stripe customer
3. **Delete User Data**: Removes the user record, which cascades to delete:
   - All chains and chain steps
   - All queued chains and variables
   - All queued chain steps
   - All subscriptions
   - All sessions
   - All OAuth accounts

### 4. Database Cascade Deletes

The database schema is designed with proper foreign key constraints that automatically delete related data:

```sql
-- These tables have ON DELETE CASCADE
accounts -> users
sessions -> users  
subscriptions -> users
chains -> users
queues -> users
queued_chains -> users
queued_chain_variables -> users
queued_chain_steps -> users
```

## API Endpoint

**POST** `/api/delete-account`

### Request Body
```json
{
  "password": "user_password",     // Optional for OAuth users
  "confirmEmail": "user@email.com" // Required
}
```

### Response
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### Error Responses
- `400`: Missing email confirmation or invalid password
- `401`: Unauthorized (not authenticated)
- `404`: User not found
- `500`: Server error during deletion

## User Experience

### For Email/Password Users
1. Click "Delete Account" button
2. See warning about data deletion
3. Click "Yes, Delete My Account"
4. Enter password and confirm email
5. Click "Delete Account"
6. Redirected to home page

### For OAuth (Google) Users
1. Click "Delete Account" button
2. See warning about data deletion
3. Click "Yes, Delete My Account"
4. Confirm email (password field is hidden)
5. Click "Delete Account"
6. Redirected to home page

## Safety Features

- **Clear Warnings**: Users are explicitly told what will be deleted
- **Two-Step Process**: Prevents accidental deletions
- **Email Confirmation**: Ensures user is typing the correct email
- **Password Verification**: Additional security for email/password accounts
- **Graceful Error Handling**: Continues deletion even if Stripe operations fail
- **Audit Logging**: Account deletions are logged for security purposes

## Testing

To test the functionality:

1. Create a test account
2. Add some chains and data
3. Go to settings page
4. Click "Delete Account"
5. Follow the confirmation process
6. Verify account and all data is deleted
7. Verify Stripe subscription is canceled (if applicable)

## Future Enhancements

Potential improvements to consider:

- **Data Export**: Allow users to export their data before deletion
- **Soft Delete**: Option to temporarily deactivate instead of permanent deletion
- **Recovery Period**: Allow account recovery within a certain time window
- **Admin Override**: Allow admins to restore deleted accounts if needed 