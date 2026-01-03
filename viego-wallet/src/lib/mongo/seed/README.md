# Database Seeding

This directory contains seed data and scripts for initializing the database with demo data.

## Structure

```
seed/
├── README.md                  # This file
├── demo-users.json            # Demo user profiles
├── recurring-payments.json    # Automated campus payments (rent, tuition, etc.)
├── vctc-rules.json            # Transaction control rules per user
├── test-transactions.json     # Test transactions to simulate
├── seedDatabase.ts            # MongoDB seeding functions
└── seedVisa.ts                # Visa API seeding functions
```

## Data Files

### demo-users.json
Contains demo user profiles that will be created in both MongoDB and Visa VCTC API:
- Bailey Chen (bailey-student-001)
- Oliver Martinez (oliver-student-002)

### recurring-payments.json
Contains automated campus payments (rent, tuition, transit) for demo users.
Each payment includes:
- Amount and frequency (monthly, semester, etc.)
- Merchant details
- Reminder days (e.g., [7, 3, 1] = remind 7, 3, and 1 days before due)
- Next due date

**Note:** This data is for future feature development. No VCTC monitoring rules are created yet.

### vctc-rules.json
Defines transaction control rules for each demo user:
- Bailey: Blocks alcohol & gambling, alerts on groceries >$150
- Oliver: Alerts on electronics, apparel, adult entertainment

### test-transactions.json
Test transactions to simulate for each user to generate alert history.

## Usage

### Via CLI Script

```bash
# Seed everything
npm run seed

# Seed MongoDB only
npm run seed:db

# Seed Visa API only
npm run seed:visa

# Seed only if database is empty
npm run seed:if-empty
```

### Programmatically

```typescript
import { seedDatabase, seedIfEmpty } from '@/lib/mongo/seed/seedDatabase';
import { seedVisaAPI } from '@/lib/mongo/seed/seedVisa';

// Seed MongoDB
await seedDatabase();

// Or seed only if empty
await seedIfEmpty();

// Seed Visa API
await seedVisaAPI();
```

## Two Separate Systems

### MongoDB (Your App Data)
- User profiles (viegoUID, email, name, etc.)
- XP, badges, monsters (gamification)
- Recurring payments (rent, tuition, transit reminders)
- App preferences

**Why seed?** For local development and demos with persistent data.

**Recurring Payments Structure:**
- Stored in `RecurringPayment` collection
- Each payment has `reminderDays` array (e.g., [7, 3, 1])
- No separate Reminders collection - reminders are calculated on-the-fly from payment data
- Future feature: when implemented, the app will check `nextDueDate` and send alerts based on `reminderDays`

### Visa VCTC API (External Service)
- Customer profiles in Visa's system
- Transaction control rules
- Authorization decisions
- Alert history

**Why seed?** To set up demo accounts with realistic transaction monitoring scenarios.

## Important Notes

1. **MongoDB seeding** clears existing demo users before re-seeding (emails in demo-users.json)
2. **Visa API seeding** may fail if accounts already exist - delete them from Visa Dashboard first
3. Always run seeds in **sandbox/development** environments only
4. Transaction simulation respects rate limits (500ms delay between calls)
5. Some VCTC control types may not be available for all test cards

## Adding New Demo Data

1. Edit JSON files to add new users/rules/transactions
2. Follow existing data structure
3. Ensure user identifiers are unique
4. Test with `npm run seed` before committing
