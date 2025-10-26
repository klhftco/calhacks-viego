# Viego Wallet - Account Management System

## Overview

The account management system handles customer profile creation, retrieval, and verification using the Visa Customer Profiles API. Each user has two identifiers:

1. **Viego UID**: Our internal unique identifier (e.g., `viego_1729876543210_a1b2c3d4`)
2. **Visa userIdentifier**: Visa's unique identifier for the customer profile

## Architecture

```
┌─────────────────┐
│  React Component │
└────────┬────────┘
         │
         ├──> useAccount Hook
         │
         ├──> /api/account
         │         │
         │         └──> lib/visaClient.ts
         │                    │
         │                    └──> Visa Customer Profiles API
         │
         └──> Display Profile
```

## Files Structure

```
viego-wallet/
├── lib/
│   └── visaClient.ts              # Visa API client with profile functions
├── hooks/
│   └── useAccount.ts              # React hook for account management
├── app/
│   ├── api/
│   │   └── account/
│   │       └── route.ts           # API routes for account operations
│   └── account/
│       └── page.tsx               # Demo UI for account management
```

## Core Functions

### 1. `createCustomerProfile(profileData)`

Creates a new customer profile in Visa's system.

**Parameters:**
```typescript
{
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}
```

**Returns:**
```typescript
{
  viegoUID: string;              // e.g., "viego_1729876543210_a1b2c3d4"
  visaUserIdentifier: string;    // Visa's identifier
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  accountStatus: "active" | "inactive" | "suspended";
  preferences: {
    notifications: boolean;
    budgetAlerts: boolean;
  };
}
```

**Example:**
```typescript
const profile = await createCustomerProfile({
  email: "student@berkeley.edu",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+1234567890"
});

console.log(profile.viegoUID);              // viego_1729876543210_a1b2c3d4
console.log(profile.visaUserIdentifier);    // Visa's identifier
```

### 2. `retrieveCustomerProfile(userIdentifier)`

Retrieves an existing customer profile by Visa userIdentifier.

**Use Cases:**
- Check notifications
- Load user preferences
- Display account information
- Verify account status

**Parameters:**
```typescript
userIdentifier: string  // Visa's userIdentifier
```

**Returns:** Same `CustomerProfile` object as above

**Example:**
```typescript
const profile = await retrieveCustomerProfile("visa_user_12345");

// Check notifications
if (profile.preferences?.notifications) {
  // Show notifications
}

// Check budget alerts
if (profile.preferences?.budgetAlerts) {
  // Send budget alert
}
```

### 3. `checkProfileExists(identifier)`

Checks if a profile exists without throwing an error.

**Returns:** `boolean`

**Example:**
```typescript
const exists = await checkProfileExists("visa_user_12345");
if (!exists) {
  // Create new profile
}
```

## Account Creation Workflow

```typescript
// Step 1: Check if account exists (optional)
const exists = await checkProfileExists(userIdentifier);

if (!exists) {
  // Step 2: Create new account
  const profile = await createCustomerProfile({
    email: "student@berkeley.edu",
    firstName: "John",
    lastName: "Doe",
  });

  // Step 3: Store identifiers for future use
  localStorage.setItem('viegoUID', profile.viegoUID);
  localStorage.setItem('visaUserIdentifier', profile.visaUserIdentifier);

  console.log('Account created!');
  console.log('Viego UID:', profile.viegoUID);
  console.log('Visa Identifier:', profile.visaUserIdentifier);
}
```

## Using the React Hook

### In a Component

```typescript
import { useAccount } from '@/hooks/useAccount';

function MyComponent() {
  const { profile, loading, error, createAccount, getAccount } = useAccount();

  const handleSignup = async () => {
    try {
      const newProfile = await createAccount({
        email: "student@berkeley.edu",
        firstName: "John",
        lastName: "Doe",
      });

      alert(`Welcome! Your Viego UID: ${newProfile.viegoUID}`);
    } catch (err) {
      console.error('Signup failed:', err);
    }
  };

  const handleLogin = async (visaUserIdentifier: string) => {
    try {
      const existingProfile = await getAccount(visaUserIdentifier);

      // Load user data, notifications, etc.
      console.log('User data:', existingProfile);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {profile && (
        <div>
          <h2>Welcome, {profile.firstName}!</h2>
          <p>Viego UID: {profile.viegoUID}</p>
        </div>
      )}
    </div>
  );
}
```

## API Routes

### POST /api/account

Create a new customer profile.

**Request:**
```json
{
  "email": "student@berkeley.edu",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "viegoUID": "viego_1729876543210_a1b2c3d4",
    "visaUserIdentifier": "visa_user_12345",
    "email": "student@berkeley.edu",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-10-25T14:30:00.000Z",
    "accountStatus": "active"
  },
  "isNew": true,
  "message": "Account created successfully"
}
```

### GET /api/account?userIdentifier=xxx

Retrieve an existing customer profile.

**Response:**
```json
{
  "success": true,
  "profile": {
    "viegoUID": "viego_1729876543210_a1b2c3d4",
    "visaUserIdentifier": "visa_user_12345",
    "email": "student@berkeley.edu",
    "firstName": "John",
    "lastName": "Doe",
    "accountStatus": "active"
  },
  "notifications": []
}
```

## Integration Examples

### 1. Signup Flow

```typescript
async function handleSignup(formData) {
  // Create account
  const profile = await createAccount({
    email: formData.email,
    firstName: formData.firstName,
    lastName: formData.lastName,
  });

  // Store in local storage or session
  localStorage.setItem('viegoUID', profile.viegoUID);
  localStorage.setItem('visaUserIdentifier', profile.visaUserIdentifier);

  // Redirect to dashboard
  router.push('/dashboard');
}
```

### 2. Login Flow

```typescript
async function handleLogin(visaUserIdentifier) {
  // Retrieve existing profile
  const profile = await getAccount(visaUserIdentifier);

  // Load user data
  setUser(profile);

  // Check for notifications
  if (profile.preferences?.notifications) {
    loadNotifications();
  }

  // Redirect to dashboard
  router.push('/dashboard');
}
```

### 3. Check Notifications

```typescript
async function checkNotifications() {
  const visaUserIdentifier = localStorage.getItem('visaUserIdentifier');

  if (visaUserIdentifier) {
    const profile = await getAccount(visaUserIdentifier);

    // Profile includes notifications from Visa API
    console.log('User notifications:', profile);
  }
}
```

## Demo Page

Visit `/account` to see a live demo of the account system:

1. **Create Account Tab**: Create new customer profiles
2. **Retrieve Account Tab**: Fetch existing profiles by Visa userIdentifier

## Environment Variables

Make sure these are set in `.env.local`:

```
VISA_USER_ID=your_visa_user_id
VISA_PASSWORD=your_visa_password
VISA_XPAY_TOKEN=your_xpay_token
```

## Key Concepts

### Dual Identifier System

- **Viego UID**: Used internally in our app for user references
- **Visa userIdentifier**: Used for Visa API calls

This separation allows us to:
- Maintain our own user system independent of Visa
- Map our users to Visa profiles seamlessly
- Add additional user metadata not supported by Visa

### Account Verification

Every time you do something with a user:
1. Use `retrieveCustomerProfile(visaUserIdentifier)` to verify account exists
2. Check account status, notifications, preferences
3. Proceed with the operation

```typescript
// Before any user operation
const profile = await retrieveCustomerProfile(visaUserIdentifier);

if (profile.accountStatus === 'active') {
  // Proceed with operation
} else {
  // Handle inactive account
}
```

## Error Handling

```typescript
try {
  const profile = await createAccount(data);
} catch (error) {
  if (error.message.includes('already exists')) {
    // Account exists, try to retrieve instead
    const existing = await getAccount(someIdentifier);
  } else if (error.message.includes('Invalid credentials')) {
    // Visa API credentials issue
  } else {
    // Other error
    console.error('Account error:', error);
  }
}
```

## Next Steps

1. **Add Database Storage**: Store Viego UID mappings in a database
2. **Implement Email Search**: Add ability to find users by email
3. **Add Profile Updates**: Implement PUT endpoint for profile updates
4. **Session Management**: Integrate with NextAuth or similar
5. **Notifications System**: Build UI for displaying Visa notifications
