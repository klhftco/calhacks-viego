# Cal Hacks Demo Setup Guide

## What You Need to Demo

Your demo needs to show a **student-centric wallet** that helps students manage campus spending. Here's what you need to set up in the Visa sandbox:

## Demo Scenario: Two Student Personas

### Persona 1: "Budget-Conscious Bailey"
- **Profile**: Freshman, tight budget, trying to save money
- **Goals**:
  - Cap food delivery spending
  - Block gambling/alcohol
  - Get alerts on large purchases
  - Track recurring subscriptions

### Persona 2: "Overspending Oliver"
- **Profile**: Junior, struggles with impulse purchases
- **Goals**:
  - Strict limits on entertainment
  - Monitor dining expenses
  - Get notified before hitting monthly limits
  - Track all recurring charges

## Complete Sandbox Setup

### Phase 1: Create Profiles & Enroll Cards (5 minutes)

```typescript
// User 1: Bailey
const bailey = {
  userIdentifier: "bailey-student-001",
  firstName: "Bailey",
  lastName: "Chen",
  email: "bailey@university.edu",
  card: "4514170000000001" // Test PAN
};

// User 2: Oliver
const oliver = {
  userIdentifier: "oliver-student-002",
  firstName: "Oliver",
  lastName: "Martinez",
  email: "oliver@university.edu",
  card: "4111111111111111" // Different test PAN
};

// For each user:
// 1. Create customer profile
// 2. Enroll card → get documentID
// 3. Check available controls for their card
```

### Phase 2: Configure Different Rules (10 minutes)

**Bailey's Controls (Budget-conscious):**

```typescript
// 1. Block vices entirely
{
  merchantControls: [
    {
      controlType: "MCT_GAMBLING",
      isControlEnabled: true,
      shouldDeclineAll: true, // Complete block
      userIdentifier: "bailey-student-001"
    },
    {
      controlType: "MCT_ALCOHOL",
      isControlEnabled: true,
      shouldDeclineAll: true, // Complete block
      userIdentifier: "bailey-student-001"
    }
  ]
}

// 2. Cap dining/food delivery
{
  merchantControls: [
    {
      controlType: "MCT_DINING",
      isControlEnabled: true,
      alertThreshold: 150,    // Alert at $150
      declineThreshold: 200,  // Block at $200/month
      userIdentifier: "bailey-student-001"
    }
  ]
}

// 3. Monitor all recurring payments
{
  transactionControls: [
    {
      controlType: "TCT_AUTO_PAY",
      isControlEnabled: true,
      alertThreshold: 0, // Alert on every recurring charge
      userIdentifier: "bailey-student-001"
    }
  ]
}
```

**Oliver's Controls (Needs guardrails):**

```typescript
// 1. Strict entertainment limits
{
  merchantControls: [
    {
      controlType: "MCT_ENTERTAINMENT", // Movies, concerts, etc.
      isControlEnabled: true,
      alertThreshold: 50,
      declineThreshold: 100, // Max $100/month entertainment
      userIdentifier: "oliver-student-002"
    }
  ]
}

// 2. Dining budget with early warning
{
  merchantControls: [
    {
      controlType: "MCT_DINING",
      isControlEnabled: true,
      alertThreshold: 100,   // Warn at $100
      declineThreshold: 150, // Block at $150/month
      userIdentifier: "oliver-student-002"
    }
  ]
}

// 3. Global monthly spending cap
{
  globalControls: {
    isControlEnabled: true,
    alertThreshold: 800,  // Alert approaching limit
    declineThreshold: 1000, // Hard stop at $1k/month
    userIdentifier: "oliver-student-002"
  }
}
```

### Phase 3: Simulate Transactions (Create History) (15 minutes)

This is the KEY part: **Decisions create your transaction history for the demo.**

**What Are Decisions?**
- In sandbox: You manually simulate transactions to test rules
- In production: Real card swipes automatically trigger decisions
- Each decision creates an alert entry that you display in the UI

**What Are Alerts?**
- **NOT just spending limit warnings**
- Alerts are the **complete transaction history + notifications**
- Every monitored transaction creates an alert
- Alerts include:
  - ✅ Approved transactions
  - ❌ Declined transactions
  - ⚠️ Threshold warnings
  - 🔄 Recurring payment notifications
  - 🚫 Blocked attempts

**Think of it this way:**
```
Decision = "Simulate a transaction"
Alert = "Record of what happened + any notifications generated"

Decisions → Create → Alerts
Alerts → Display in → Your App UI
```

#### Bailey's Transaction History (Simulate These):

```typescript
// ========================================
// Week 1: Good behavior
// ========================================

// 1. Groceries - APPROVED
await requestDecision({
  primaryAccountNumber: "4514170000000001",
  amount: 45.00,
  merchantName: "Target",
  merchantCategoryCode: "MCT_GROCERY"
});
// → Creates alert: "Target: $45.00 - Approved"

// 2. Coffee shop - APPROVED
await requestDecision({
  primaryAccountNumber: "4514170000000001",
  amount: 6.50,
  merchantName: "Starbucks",
  merchantCategoryCode: "MCT_DINING"
});
// → Creates alert: "Starbucks: $6.50 - Approved"
// → Running dining total: $6.50 / $200

// 3. Textbook - APPROVED
await requestDecision({
  primaryAccountNumber: "4514170000000001",
  amount: 89.99,
  merchantName: "Campus Bookstore",
  merchantCategoryCode: "MCT_BOOKS"
});
// → Creates alert: "Campus Bookstore: $89.99 - Approved"

// ========================================
// Week 2: Testing limits
// ========================================

// 4. DoorDash delivery - APPROVED
await requestDecision({
  primaryAccountNumber: "4514170000000001",
  amount: 28.00,
  merchantName: "DoorDash",
  merchantCategoryCode: "MCT_DINING"
});
// → Creates alert: "DoorDash: $28.00 - Approved"
// → Running dining total: $34.50 / $200

// 5. Restaurant - APPROVED
await requestDecision({
  primaryAccountNumber: "4514170000000001",
  amount: 42.00,
  merchantName: "Chipotle",
  merchantCategoryCode: "MCT_DINING"
});
// → Creates alert: "Chipotle: $42.00 - Approved"
// → Running dining total: $76.50 / $200

// ========================================
// Week 3: Blocked transaction (shows rules work!)
// ========================================

// 6. Tries to buy alcohol - DECLINED
await requestDecision({
  primaryAccountNumber: "4514170000000001",
  amount: 25.00,
  merchantName: "Liquor Store",
  merchantCategoryCode: "MCT_ALCOHOL"
});
// → Creates alert: "Liquor Store: $25.00 - DECLINED (Alcohol blocked)"
// → Shows in UI as blocked transaction

// ========================================
// Week 4: Approaching limit
// ========================================

// 7. Another food delivery - APPROVED + ALERT
await requestDecision({
  primaryAccountNumber: "4514170000000001",
  amount: 80.00,
  merchantName: "Uber Eats",
  merchantCategoryCode: "MCT_DINING"
});
// → Creates alert: "Uber Eats: $80.00 - Approved"
// → Running dining total: $156.50 / $200
// → ALERT: "⚠️ You've spent $156.50 on dining (78% of budget)"

// 8. Recurring payment detected
await requestDecision({
  primaryAccountNumber: "4514170000000001",
  amount: 9.99,
  merchantName: "Spotify",
  merchantCategoryCode: "TCT_AUTO_PAY"
});
// → Creates alert: "Spotify: $9.99 - Recurring payment"
// → Shows in "Subscriptions" section
```

#### Oliver's Transaction History (Simulate These):

```typescript
// ========================================
// Week 1: Overspending starts
// ========================================

// 1. Movie tickets - APPROVED
await requestDecision({
  primaryAccountNumber: "4111111111111111",
  amount: 35.00,
  merchantName: "AMC Theatres",
  merchantCategoryCode: "MCT_ENTERTAINMENT"
});
// → Alert: "AMC Theatres: $35.00 - Approved"
// → Entertainment: $35 / $100

// 2. Concert tickets - APPROVED
await requestDecision({
  primaryAccountNumber: "4111111111111111",
  amount: 45.00,
  merchantName: "Ticketmaster",
  merchantCategoryCode: "MCT_ENTERTAINMENT"
});
// → Alert: "Ticketmaster: $45.00 - Approved"
// → Entertainment: $80 / $100
// → ⚠️ "Alert: Approaching entertainment limit ($80/$100)"

// 3. Restaurant splurge - APPROVED
await requestDecision({
  primaryAccountNumber: "4111111111111111",
  amount: 85.00,
  merchantName: "Fancy Restaurant",
  merchantCategoryCode: "MCT_DINING"
});
// → Alert: "Fancy Restaurant: $85.00 - Approved"
// → Dining: $85 / $150
// → ⚠️ "Alert: High dining purchase"

// ========================================
// Week 2: Hitting limits
// ========================================

// 4. Video game - APPROVED + WARNING
await requestDecision({
  primaryAccountNumber: "4111111111111111",
  amount: 30.00,
  merchantName: "GameStop",
  merchantCategoryCode: "MCT_ENTERTAINMENT"
});
// → Alert: "GameStop: $30.00 - DECLINED"
// → Entertainment: Would be $110 / $100
// → 🚫 "Blocked: Entertainment budget exceeded"

// 5. Food delivery binge
await requestDecision({
  primaryAccountNumber: "4111111111111111",
  amount: 75.00,
  merchantName: "DoorDash",
  merchantCategoryCode: "MCT_DINING"
});
// → Alert: "DoorDash: $75.00 - DECLINED"
// → Dining: Would be $160 / $150
// → 🚫 "Blocked: Dining budget exceeded"

// ========================================
// Week 3: Global limit protection
// ========================================

// 6. Large purchase attempt
await requestDecision({
  primaryAccountNumber: "4111111111111111",
  amount: 200.00,
  merchantName: "Electronics Store",
  merchantCategoryCode: "MCT_ELECTRONICS"
});
// → Alert: "Electronics Store: $200.00 - DECLINED"
// → Would exceed global $1000/month limit
// → 🚫 "Blocked: Monthly spending limit reached"
```

### Phase 4: Fetch Alerts (Transaction History)

Now when you call `getAlertsByUser()`, you get all those simulated transactions:

```typescript
// For Bailey
const baileyAlerts = await getAlertsByUser("bailey-student-001");

// Returns something like:
[
  {
    timestamp: "2025-10-25T14:30:00Z",
    merchantName: "Uber Eats",
    amount: 80.00,
    controlType: "MCT_DINING",
    decision: "APPROVED",
    message: "⚠️ Approaching dining budget limit"
  },
  {
    timestamp: "2025-10-24T19:15:00Z",
    merchantName: "Liquor Store",
    amount: 25.00,
    controlType: "MCT_ALCOHOL",
    decision: "DECLINED",
    message: "🚫 Alcohol purchases are blocked"
  },
  {
    timestamp: "2025-10-23T12:45:00Z",
    merchantName: "Chipotle",
    amount: 42.00,
    controlType: "MCT_DINING",
    decision: "APPROVED",
    message: null
  },
  // ... more transactions
]
```

## Demo UI Flow

### Screen 1: User Selection
```
┌─────────────────────────────────────┐
│   Choose Your Student Persona       │
├─────────────────────────────────────┤
│  👤 Bailey Chen                     │
│     Budget-conscious freshman       │
│     [View Dashboard]                │
│                                     │
│  👤 Oliver Martinez                 │
│     Junior managing overspending    │
│     [View Dashboard]                │
└─────────────────────────────────────┘
```

### Screen 2: Dashboard (Bailey's View)
```
┌─────────────────────────────────────┐
│   Bailey's Campus Wallet            │
├─────────────────────────────────────┤
│  💰 Budget Status                   │
│  ████████░░ Dining: $156 / $200     │
│  ⚠️ Approaching limit (78%)          │
│                                     │
│  🔒 Active Controls                 │
│  • Alcohol: BLOCKED                 │
│  • Gambling: BLOCKED                │
│  • Dining: $200/mo limit            │
│                                     │
│  📊 Recent Transactions             │
│  Oct 25  Uber Eats      $80.00 ✓   │
│  Oct 24  Liquor Store   $25.00 ✗   │
│  Oct 23  Chipotle       $42.00 ✓   │
│  Oct 22  DoorDash       $28.00 ✓   │
│                                     │
│  🔄 Recurring Payments              │
│  • Spotify: $9.99/mo                │
│  • Netflix: $15.99/mo               │
└─────────────────────────────────────┘
```

### Screen 3: Dashboard (Oliver's View)
```
┌─────────────────────────────────────┐
│   Oliver's Campus Wallet            │
├─────────────────────────────────────┤
│  💰 Budget Status                   │
│  ██████████ Entertainment: $100/$100│
│  🚫 LIMIT REACHED                    │
│  ██████████ Dining: $150/$150       │
│  🚫 LIMIT REACHED                    │
│                                     │
│  ⚠️ Blocked Transactions (3)         │
│  Oct 25  GameStop       $30.00 ✗   │
│  Oct 24  DoorDash       $75.00 ✗   │
│  Oct 23  Electronics    $200.00 ✗  │
│                                     │
│  💡 Spending Insights               │
│  "You've blocked 3 impulse          │
│   purchases this week, saving $305" │
└─────────────────────────────────────┘
```

## What Each Component Does

### Decisions
- **Purpose**: Simulate transactions to test your rules
- **Creates**: Alert entries (transaction history)
- **In Demo**: You manually call this to build transaction history
- **In Production**: Happens automatically when student swipes card

### Alerts
- **Purpose**: Complete transaction + notification history
- **Contains**: EVERY monitored transaction (approved, declined, warnings)
- **In Demo**: You fetch these to populate the UI
- **Types of alerts**:
  - ✅ Approved transaction
  - ❌ Declined transaction
  - ⚠️ Threshold warning ("approaching limit")
  - 🔄 Recurring payment detected
  - 🚫 Blocked attempt (alcohol, gambling)

### Rules (Controls)
- **Purpose**: Define what to monitor/block/alert on
- **Types**:
  - Merchant controls (MCT_): By category (dining, alcohol, etc.)
  - Transaction controls (TCT_): By type (auto-pay, e-commerce, etc.)
  - Global controls: Account-wide limits

## Demo Script

**Introduction (30 seconds):**
"This is Viego Wallet - a student-centric payment platform that helps students manage campus spending through automated budgeting and smart alerts."

**Show Bailey's Dashboard (1 minute):**
"Meet Bailey, a budget-conscious freshman. She's set up controls to block alcohol and gambling, and caps her dining spending at $200/month. You can see she's spent $156 on food this month and just got a warning. The wallet also blocked an attempted alcohol purchase yesterday, keeping her on track."

**Show Oliver's Dashboard (1 minute):**
"Oliver struggles with impulse purchases. He's hit his entertainment and dining limits for the month. The wallet has automatically blocked 3 purchases this week, saving him $305. Instead of just declining his card mysteriously, he gets clear notifications explaining why, teaching better financial habits."

**Show Transaction Detail (30 seconds):**
"Every transaction is enriched with merchant data, not just 'POS PURCHASE #1234'. Students see exactly where their money is going with categorized spending insights."

**Demonstrate Setup (1 minute):**
"Students can customize their controls through a simple interface. Just check the available controls for your card, select categories to monitor, and set spending limits. VCTC handles the rest automatically."

## Technical Setup Checklist

- [ ] Create 2 customer profiles (Bailey & Oliver)
- [ ] Enroll 1 card per user
- [ ] Check available controls for each card
- [ ] Configure rules for Bailey (3-4 different controls)
- [ ] Configure rules for Oliver (3-4 different controls)
- [ ] Simulate 8-10 transactions for Bailey
- [ ] Simulate 6-8 transactions for Oliver
- [ ] Fetch alerts for both users
- [ ] Build UI to display:
  - [ ] Budget progress bars
  - [ ] Recent transactions list
  - [ ] Blocked attempts
  - [ ] Recurring payments
  - [ ] Spending insights

## Data You'll Display

### From VCTC APIs:
- Transaction history (alerts)
- Spending by category
- Blocked transactions
- Recurring payments
- Rule configurations

### You Calculate:
- Budget percentages
- "Savings" from blocked purchases
- Spending trends
- Monthly projections
- Category breakdowns

## Quick Setup Script

Use your test endpoint to quickly set everything up:

```bash
# 1. Create Bailey's profile
# 2. Enroll Bailey's card
# 3. Get available controls
# 4. Set Bailey's rules
# 5. Simulate Bailey's transactions
# 6. Repeat for Oliver
# 7. Build UI to fetch and display alerts
```

Time estimate: 30-45 minutes to set up complete demo data

## Key Demo Moments

1. **"Blocked Transaction"** - Show wallet protecting student from bad purchase
2. **"Budget Warning"** - Show proactive alert before limit
3. **"Spending Insights"** - Show how much student saved by sticking to budget
4. **"Recurring Payments"** - Show subscription tracking
5. **"Category Breakdown"** - Show where money actually goes

This creates a compelling story: **Your wallet actively helps students make better financial decisions, not just process payments.**
