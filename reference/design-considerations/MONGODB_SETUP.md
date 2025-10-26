# MongoDB Setup Guide for Viego Wallet

This guide will help you set up MongoDB for the Viego Wallet application.

## Prerequisites

- Node.js installed
- MongoDB Atlas account (free tier available) OR local MongoDB installation

---

## Option 1: MongoDB Atlas (Cloud - Recommended)

### Step 1: Create a MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create a Cluster

1. Click "Build a Database"
2. Select **FREE** tier (M0)
3. Choose your preferred cloud provider and region (closest to you)
4. Click "Create Cluster"
5. Wait for the cluster to be created (2-3 minutes)

### Step 3: Create Database User

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username: `viego-admin` (or your choice)
5. Set password: Generate a secure password and **save it**
6. Set "Database User Privileges" to "Read and write to any database"
7. Click "Add User"

### Step 4: Whitelist Your IP Address

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note:** For production, restrict to specific IPs
4. Click "Confirm"

### Step 5: Get Connection String

1. Go back to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Choose "Node.js" as the driver
5. Copy the connection string (looks like):
   ```
   mongodb+srv://viego-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Add database name before the `?`: `/viego-wallet?`

   Final format:
   ```
   mongodb+srv://viego-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/viego-wallet?retryWrites=true&w=majority
   ```

### Step 6: Configure Environment Variables

1. In your project root, create a `.env.local` file:
   ```bash
   touch .env.local
   ```

2. Add your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb+srv://viego-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/viego-wallet?retryWrites=true&w=majority
   ```

3. **Important:** Add `.env.local` to `.gitignore` (already done)

---

## Option 2: Local MongoDB Installation

### Step 1: Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Windows:**
1. Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Choose "Complete" installation
4. Install as a service

**Linux (Ubuntu/Debian):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### Step 2: Verify Installation

```bash
mongosh
```

If successful, you'll see the MongoDB shell prompt.

### Step 3: Configure Environment Variables

1. Create `.env.local` file:
   ```bash
   touch .env.local
   ```

2. Add local MongoDB connection string:
   ```env
   MONGODB_URI=mongodb://localhost:27017/viego-wallet
   ```

---

## Testing the Connection

### Step 1: Start the Development Server

```bash
npm run dev
```

### Step 2: Test Account Creation

1. Open your browser to [http://localhost:3000/account](http://localhost:3000/account)
2. Click "Create Account"
3. Fill in the form with test data
4. Submit the form
5. Check the console logs for "✅ Connected to MongoDB" and "✅ MongoDB account created"

### Step 3: Verify in MongoDB

**MongoDB Atlas:**
1. Go to your cluster in Atlas
2. Click "Browse Collections"
3. You should see the `viego-wallet` database
4. Expand to see `users`, `monsters`, and `badges` collections

**Local MongoDB:**
```bash
mongosh
use viego-wallet
db.users.find().pretty()
```

---

## API Endpoints Overview

### Account Endpoints (`/api/account`)

- **GET** `/api/account?viegoUID=xxx` - Fetch user profile
- **POST** `/api/account` - Create new user
- **PUT** `/api/account` - Update user profile
- **DELETE** `/api/account?viegoUID=xxx` - Delete user

### Monsters Endpoints (`/api/monsters`)

- **GET** `/api/monsters?viegoUID=xxx` - Fetch user's monsters
- **POST** `/api/monsters` - Add new monster/egg
- **PUT** `/api/monsters` - Update monster (hatch, level up, feed)
- **DELETE** `/api/monsters?viegoUID=xxx&monsterId=xxx` - Remove monster

### Badges Endpoints (`/api/badges`)

- **GET** `/api/badges?viegoUID=xxx` - Fetch user's badges
- **POST** `/api/badges` - Award badge to user (auto-awards XP)
- **DELETE** `/api/badges?viegoUID=xxx&badgeId=xxx` - Remove badge

---

## Database Schema

### User Collection
```typescript
{
  viegoUID: string,          // Unique identifier
  visaUserIdentifier?: string, // Visa API identifier
  email: string,             // Unique email
  firstName: string,
  lastName: string,
  phoneNumber?: string,
  xp: number,                // User experience points
  schoolName?: string,       // General location
  accountStatus: 'active' | 'inactive' | 'suspended',
  preferences: {
    notifications: boolean,
    budgetAlerts: boolean
  },
  friends: [ObjectId],       // References to User documents
  badges: [ObjectId],        // References to Badge documents
  monsters: [ObjectId],      // References to Monster documents
  createdAt: Date,
  updatedAt: Date
}
```

### Monster Collection
```typescript
{
  name: string,
  type: 'egg' | 'monster',
  species: string,
  level: number,
  xp: number,
  hatchProgress?: number,    // 0-100 for eggs
  imageUrl?: string,
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
  acquiredAt: Date,
  lastFedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Badge Collection
```typescript
{
  name: string,
  description: string,
  category: 'spending' | 'savings' | 'social' | 'monster' | 'achievement',
  iconUrl?: string,
  xpReward: number,
  earnedAt: Date,
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
  createdAt: Date,
  updatedAt: Date
}
```

---

## Troubleshooting

### Error: "MONGODB_URI not found"
- Make sure `.env.local` exists in your project root
- Verify the file has the correct `MONGODB_URI` variable
- Restart your development server after creating `.env.local`

### Error: "MongoServerError: bad auth"
- Double-check your MongoDB username and password
- Make sure you replaced `<password>` in the connection string

### Error: "Could not connect to MongoDB"
- Verify your IP is whitelisted in MongoDB Atlas
- Check if MongoDB service is running (local installation)
- Test connection string with `mongosh`

### Error: "getaddrinfo ENOTFOUND"
- Check your internet connection
- Verify the cluster URL in your connection string
- Try using a different network (some networks block MongoDB Atlas)

---

## Security Best Practices

1. **Never commit `.env.local`** to Git (already in `.gitignore`)
2. **Use strong passwords** for MongoDB users
3. **Restrict IP access** in production
4. **Rotate credentials** regularly
5. **Use environment-specific databases** (dev, staging, production)

---

## Next Steps

1. ✅ MongoDB is now integrated
2. ✅ Account management persists to database
3. ✅ Monsters API ready for island feature
4. ✅ Badges API ready for achievements
5. 🔄 Update UI components to use new MongoDB-backed data
6. 🔄 Implement friends system
7. 🔄 Build out monster hatching/leveling logic
8. 🔄 Create badge award triggers

---

## Support

If you encounter issues:
1. Check the console logs in your terminal
2. Review MongoDB Atlas logs (if using Atlas)
3. Test individual API endpoints with tools like Postman or curl
4. Verify your `.env.local` configuration

For MongoDB Atlas support: [https://www.mongodb.com/cloud/atlas/support](https://www.mongodb.com/cloud/atlas/support)
