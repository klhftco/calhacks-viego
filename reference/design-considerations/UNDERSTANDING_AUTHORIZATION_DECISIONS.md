# Understanding Authorization Decisions in VCTC

## What `doDecision` Actually Does

**Your `doDecision` function is NOT checking transaction history.** Instead, it's **simulating a new transaction** in real-time and asking Visa:

> "If someone tried to use this card right now at 'Test E-Commerce Merchant' (MCC 5999) for $25, should I approve or decline it based on the rules I've set?"

## The Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Your App calls doDecision()                                │
│  "Simulate a $25 transaction at MCC 5999"                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Visa VCTC Authorization Decision API                       │
│  - Checks the rules you set (e.g., MCT_ALCOHOL limit $20)   │
│  - Evaluates: Does this transaction match any controls?     │
│  - Returns: APPROVE, DECLINE, or ALERT                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Response: Decision + DecisionID                            │
│  {                                                           │
│    "decision": "APPROVED" or "DECLINED",                    │
│    "decisionID": "abc123",                                  │
│    "matchedRules": [...],                                   │
│    "recommendation": "APPROVE"                              │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## What It's Actually Doing

### Current Implementation:
```javascript
doDecision() {
  // Simulates a brand new transaction:
  primaryAccountNumber: "4514170000000001",
  amount: 25,
  merchantName: "Test E-Commerce Merchant",
  merchantCategoryCode: "5999", // Miscellaneous Retail

  // Builds ISO 8583-like message
  messageType: "0100", // Authorization request
  processingCode: "000000",
  decisionType: "RECOMMENDED",
  dateTimeLocal: "1025143022", // Current timestamp
  pointOfServiceInfo: { ... }
}
```

### What Visa Does:
1. Receives the simulated transaction
2. Looks up the card's control document (from `enrollCard`)
3. Checks all active rules:
   - "Is this merchant category (5999) controlled?"
   - "Is the amount ($25) above any thresholds?"
   - "Are there global spending limits?"
4. Returns a recommendation: **APPROVE**, **DECLINE**, or **ALERT**

### Example Scenario:

**If you set this rule:**
```javascript
{
  controlType: "MCT_ALCOHOL",
  alertThreshold: 20,
  declineThreshold: 30
}
```

**And simulate this transaction:**
- MCC: 5999 (Miscellaneous Retail) ← NOT alcohol
- Amount: $25

**Result:** ✅ **APPROVED** (rule doesn't match, no control triggered)

---

**But if you simulate:**
- MCC: Alcohol store
- Amount: $25

**Result:** ⚠️ **ALERT** (exceeded $20 alert threshold, but below $30 decline)

---

**And if:**
- MCC: Alcohol store
- Amount: $35

**Result:** ❌ **DECLINED** (exceeded $30 decline threshold)

## How This Relates to "Transaction History"

### Decisions Create History Entries

Every time you call `/vctc/validation/v1/decisions`:
- Visa creates a **decision record** with a `decisionID`
- This gets stored in the **alert/notification history**
- You can retrieve it later via `/vctc/customerrules/v1/.../notifications`

So `doDecision` is actually **creating** the transaction history, not reading it.

### The Complete Picture:

```
1. doDecision()
   → Simulates transaction
   → Creates decisionID: "dec_12345"

2. Visa evaluates rules
   → Checks if MCT_ALCOHOL control applies
   → Decision: DECLINED

3. Creates notification/alert
   → Stored in alert history
   → Can be retrieved via doAlerts()

4. doAlerts()
   → Fetches notification history
   → Shows: "Transaction of $35 at alcohol store was declined"
```

## How This Fits Into Your Student Wallet App

### In Sandbox (Testing):
You're **simulating** transactions to test rules:
```javascript
// Test: "Can I decline gambling transactions over $50?"
doDecision({
  merchantCategoryCode: "GAMBLING_MCC",
  amount: 60
})
// Expected: DECLINED
```

### In Production (Real App):

Your app would work differently:

#### 1. **Real-Time Authorization Hook** (Future)
```
Student swipes card at Starbucks
    ↓
Card network routes through Visa
    ↓
Visa VCTC checks your rules automatically
    ↓
Approves/Declines in real-time
    ↓
Your app receives webhook: "Transaction at Starbucks for $6.50 - APPROVED"
    ↓
Student sees notification: "☕ Starbucks: $6.50 (within your $200/month dining budget)"
```

#### 2. **Viewing Transaction History**
```javascript
// Get all recent transactions for student
const history = await getAlertsByUser(studentId);

// Show in UI:
// "Oct 25: Starbucks $6.50 ✓"
// "Oct 24: Uber Eats $15.00 ✓"
// "Oct 23: Bar $45.00 ✗ DECLINED (alcohol limit exceeded)"
```

#### 3. **Budget Tracking**
```javascript
// Student sets: "Alert me if I spend >$100 on food delivery"
await addOrUpdateRules(documentId, {
  merchantControls: [{
    controlType: "MCT_DINING",
    alertThreshold: 100
  }]
});

// Later, when they swipe:
// Transaction #8 at DoorDash for $12
// Running total: $98 → No alert
// Transaction #9 at Uber Eats for $15
// Running total: $113 → 🔔 ALERT: "You've spent $113 on dining this month!"
```

## Key Differences: Sandbox vs Production

| Aspect | Sandbox (Current) | Production (Future) |
|--------|-------------------|---------------------|
| **Transaction Source** | You manually call `doDecision()` to simulate | Real card swipes trigger automatically |
| **Purpose** | Test your rules work correctly | Monitor real student spending |
| **History** | Decisions you manually created | Actual purchases |
| **Workflow** | `doDecision()` → check result → `doAlerts()` | Card swipe → automatic check → push notification |

## Real-World Use Cases for Your App

### 1. **Prevent Overspending**
```javascript
// Student sets semester textbook budget: $500
merchantControls: [{
  controlType: "MCT_BOOKS", // If available for card
  declineThreshold: 500,
  spendLimit: { type: "LMT_SEMESTER" }
}]

// When they try to buy $600 worth of books:
// → DECLINED
// → Notification: "You've reached your $500 textbook limit"
```

### 2. **Block Unwanted Categories**
```javascript
// Parent wants to block gambling/alcohol for student
merchantControls: [
  { controlType: "MCT_GAMBLING", shouldDeclineAll: true },
  { controlType: "MCT_ALCOHOL", shouldDeclineAll: true }
]

// Student tries to use card at casino:
// → DECLINED automatically
// → Parent gets notification: "Card blocked at gambling merchant"
```

### 3. **Smart Alerts**
```javascript
// Alert student when approaching monthly dining budget
merchantControls: [{
  controlType: "MCT_DINING",
  alertThreshold: 180,  // Alert at $180
  declineThreshold: 200 // Hard stop at $200
}]

// At $185 spent:
// → Transaction APPROVED
// → Push notification: "⚠️ You've spent $185 of your $200 dining budget (90%)"
```

### 4. **Subscription Management**
```javascript
// Track recurring payments (Netflix, Spotify, etc.)
transactionControls: [{
  controlType: "TCT_AUTO_PAY",
  alertThreshold: 0 // Alert on EVERY recurring payment
}]

// When subscription renews:
// → Notification: "Spotify charged $9.99 (recurring payment)"
```

## Integration Points for Your App

### Backend (What You're Building Now):
```typescript
// Set up student's controls
POST /api/vctc/rules

// Simulate/test transactions (sandbox only)
POST /api/vctc/decision

// Fetch transaction history
GET /api/vctc/alerts
```

### Frontend (Future Student App):
```typescript
// Student dashboard shows:
- Monthly spending by category
- Budget progress bars
- Recent transactions with merchant enrichment
- Alerts/notifications feed

// Uses the decision/alert data to populate widgets
```

### Webhooks (Production):
```typescript
// Visa sends real-time notifications to your webhook endpoint
POST https://yourapp.com/webhooks/visa
{
  "eventType": "TRANSACTION_AUTHORIZED",
  "decisionID": "dec_789",
  "amount": 25.00,
  "merchantCategory": "DINING",
  "decision": "APPROVED"
}

// Your app:
1. Stores in database
2. Updates student's spending totals
3. Sends push notification to student
4. Updates budget calculations
```

## Summary

**Current `doDecision()`:** Simulates a fake transaction to test if your rules work

**Real Production:** Visa automatically evaluates every real card swipe and creates decisions/alerts that you display to students

**Your App's Job:**
1. Let students set budget rules (controls)
2. Fetch and display their transaction history (alerts)
3. Show budget progress and send notifications when thresholds are hit

The sandbox lets you **test** that your rules work before students start using real cards with real money!
