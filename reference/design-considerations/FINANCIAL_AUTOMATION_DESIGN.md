# Financial Automation - Technical Design

## Overview
This document outlines the technical design for implementing financial automation features in Viego Wallet using Visa's VCTC (Visa Consumer Transaction Controls) API.

## Design Goals (From design_doc.md)
- ✅ Automate campus payments (tuition installments, transit)
- ✅ Rent due date / rent reminder
- ✅ Tuition reminders / autopay
- ✅ Nudge healthy financial behaviors (positive messaging)

---

## Architecture

### High-Level Flow
```
User Sets Up Payment → Store in DB → Create VCTC Rules → Monitor Alerts → Notify User
                                            ↓
                                    Schedule Reminders
                                            ↓
                                    Track Payment Status
```

---

## VCTC API Capabilities Analysis

### What VCTC Can Do:
1. **Transaction Controls** - Control where/how card can be used
   - `TCT_AUTO_PAY` - Control for automatic payments
   - Merchant category codes - Target specific vendors

2. **Spending Limits** - Track spending over time periods
   - `LMT_RECURRING` - Recurring budget periods (e.g., monthly tuition)
   - `currentPeriodSpend` - Track actual spending vs limits

3. **Alerts** - Get notified when rules trigger
   - `alertThreshold` - Alert before hitting limit
   - `shouldAlertOnDecline` - Notify when transactions are blocked
   - Alert delivery callbacks for real-time notifications

4. **Merchant Controls** - Whitelist specific merchants
   - Target university, landlord, transit authority by MCC or name
   - Set allowed spending amounts for each

### What VCTC Cannot Do:
- ❌ Actually initiate payments (requires separate payment processor)
- ❌ Access bank account balances
- ❌ Schedule future transactions directly

---

## Technical Approach

### Phase 1: Payment Tracking & Reminders (MVP)
**Use VCTC for:** Monitoring transactions and triggering alerts
**Use App Logic for:** Reminder scheduling, payment tracking

#### Features:
1. **Rent Tracker**
   - User sets rent amount, due date, landlord details
   - Create VCTC merchant control for landlord's MCC
   - Set up reminders: 7 days before, 3 days before, day of
   - Track when rent transaction occurs via VCTC alerts

2. **Tuition Installment Tracker**
   - User sets installment schedule (e.g., 3 payments of $2,500)
   - Create VCTC rules with recurring periods matching schedule
   - Alert when payment window opens
   - Confirm payment via transaction monitoring

3. **Transit Pass Automation**
   - Detect recurring transit charges via MCC
   - Alert if pass about to expire (no recent transit charge)
   - Suggest auto-renewal

### Phase 2: Smart Controls (Enhancement)
**Use VCTC for:** Preventing overspending on automated payments

#### Features:
1. **Budget Protection**
   - Set maximum allowed for each payment type
   - VCTC declines if amount exceeds expected (prevents billing errors)
   - Alert user if merchant tries to overcharge

2. **Payment Approval**
   - Large auto-payments require confirmation
   - User gets push notification to approve
   - Temporarily lift VCTC block after approval

---

## Data Models

### AutomatedPayment (Stored in App DB)
```typescript
{
  id: string;
  userId: string;
  type: 'rent' | 'tuition' | 'transit' | 'other';
  merchantName: string;
  merchantCategoryCode?: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'semester' | 'one-time';
  dueDate: Date;
  reminderDays: number[];  // e.g., [7, 3, 1]
  status: 'pending' | 'paid' | 'overdue';
  lastPaidDate?: Date;
  vctcDocumentId?: string;  // Link to VCTC rule
  createdAt: Date;
}
```

### PaymentReminder (Generated from AutomatedPayment)
```typescript
{
  id: string;
  paymentId: string;
  scheduledDate: Date;
  sent: boolean;
  message: string;
}
```

---

## VCTC Rule Configuration

### For Rent Payments
```json
{
  "merchantControls": [
    {
      "merchantName": "Property Management Co",
      "merchantCategoryCode": "6513",  // Real estate agents/rentals
      "isControlEnabled": true,
      "shouldDeclineAll": false,
      "spendLimit": {
        "type": "LMT_RECURRING",
        "recurringCycleTime": 30,  // Monthly
        "alertThreshold": "800.00",
        "declineThreshold": "850.00"  // 5% buffer over rent
      },
      "shouldAlertOnDecline": true
    }
  ]
}
```

### For Tuition Payments
```json
{
  "merchantControls": [
    {
      "merchantName": "UC Berkeley",
      "merchantCategoryCode": "8220",  // Colleges/Universities
      "isControlEnabled": true,
      "shouldDeclineAll": false,
      "spendLimit": {
        "type": "LMT_RECURRING",
        "recurringCycleTime": 90,  // Quarterly
        "alertThreshold": "2500.00",
        "declineThreshold": "2600.00"
      },
      "shouldAlertOnDecline": true,
      "dateRestrictions": {
        "startDateTime": "2025-11-01 00:00",  // Payment window opens
        "endDateTime": "2025-11-15 23:59"      // Payment window closes
      }
    }
  ]
}
```

### For Transit Passes
```json
{
  "merchantControls": [
    {
      "merchantName": "AC Transit",
      "merchantCategoryCode": "4111",  // Transportation
      "isControlEnabled": true,
      "shouldDeclineAll": false,
      "spendLimit": {
        "type": "LMT_MONTH",
        "alertThreshold": "42.00",
        "declineThreshold": "45.00"
      }
    }
  ]
}
```

---

## API Endpoints Design

### Backend Routes

#### 1. `/api/payments/automated`
- **POST** - Create new automated payment
  - Validates payment details
  - Creates VCTC merchant control
  - Schedules reminders in DB
  - Returns payment ID and VCTC document ID

- **GET** - List all automated payments for user
  - Returns payment history
  - Shows upcoming due dates
  - Displays payment status

- **PUT** - Update automated payment
  - Modifies VCTC rules
  - Reschedules reminders

- **DELETE** - Remove automated payment
  - Deletes VCTC rule
  - Cancels future reminders

#### 2. `/api/payments/reminders`
- **GET** - Get upcoming reminders
- **POST** - Manually trigger reminder

#### 3. `/api/payments/history/{paymentId}`
- **GET** - Get transaction history for specific payment
  - Queries VCTC alert history
  - Shows payment confirmations

#### 4. `/api/payments/verify`
- **POST** - Verify if payment was made
  - Checks recent transactions via VCTC
  - Updates payment status

#### 5. `/api/vctc/alerts/webhook` (Callback from Visa)
- **POST** - Receive real-time alerts from VCTC
  - When transaction occurs
  - When threshold exceeded
  - Updates payment status automatically

---

## Frontend UI Components

### 1. Payment Setup Page (`/app/payments/setup`)
```
┌─────────────────────────────────────┐
│  Add Automated Payment              │
├─────────────────────────────────────┤
│  Type: [Dropdown: Rent/Tuition/etc]│
│  Amount: [$______]                  │
│  Merchant: [__________]             │
│  Due Date: [Calendar]               │
│  Frequency: [Monthly/Quarterly/...] │
│                                     │
│  Reminders:                         │
│  [✓] 7 days before                  │
│  [✓] 3 days before                  │
│  [✓] 1 day before                   │
│                                     │
│  [Create Payment] [Cancel]          │
└─────────────────────────────────────┘
```

### 2. Payment Dashboard (`/app/payments`)
```
┌─────────────────────────────────────┐
│  Upcoming Payments                  │
├─────────────────────────────────────┤
│  🏠 Rent                  Nov 1     │
│     $800 - Property Mgmt            │
│     [Mark as Paid] [View Details]   │
│                                     │
│  🎓 Tuition               Nov 15    │
│     $2,500 - UC Berkeley            │
│     [Mark as Paid] [View Details]   │
│                                     │
│  🚌 Transit Pass          Nov 1     │
│     $42 - AC Transit                │
│     [Auto-renew enabled]            │
└─────────────────────────────────────┘
```

### 3. Payment Detail Page
- Full payment history
- Transaction timeline
- Edit/delete options
- Notification settings

### 4. Positive Nudge Notifications
```
┌─────────────────────────────────────┐
│  💚 Great news!                     │
│                                     │
│  Your rent payment went through     │
│  successfully. You're on track!     │
│                                     │
│  [View Details]                     │
└─────────────────────────────────────┘
```

---

## Implementation Plan

### Step 1: VCTC Client Setup
- Create Two-Way SSL client (reusing working example)
- Implement Customer Rules API methods
- Test rule creation/retrieval

### Step 2: Database Schema
- Create `automated_payments` table
- Create `payment_reminders` table
- Create `payment_transactions` table

### Step 3: Backend APIs
- Build payment CRUD endpoints
- Implement VCTC rule management
- Set up webhook receiver for alerts

### Step 4: Reminder System
- Cron job to check upcoming due dates
- Generate reminders based on schedule
- Send notifications (push/email)

### Step 5: Frontend Pages
- Payment setup form
- Payment dashboard
- Individual payment details

### Step 6: Gamification Integration
- Award XP for on-time payments
- Track payment streak (like savings streak)
- Unlock achievements ("Rent Master", "Tuition Hero")

---

## Positive Messaging Examples

### Reminders (Non-Restrictive)
- ❌ **Bad**: "Your rent is due. Pay now to avoid penalties."
- ✅ **Good**: "Heads up! Rent is due Nov 1. You've got $800 set aside. 🎉"

### Post-Payment
- ✅ "Awesome! Your tuition payment cleared. One step closer to graduation! 🎓"

### Budget Protection
- ❌ **Bad**: "Transaction blocked. Insufficient budget."
- ✅ **Good**: "Hmm, this charge is higher than expected ($850 vs $800). Want to approve it?"

---

## Technical Considerations

### VCTC Limitations
1. **Not a payment initiator** - Can only monitor/control existing transactions
2. **No bank integration** - Can't verify available balance
3. **Callback setup** - Need public endpoint for alerts (webhook)

### Workarounds
- Use VCTC for monitoring, app logic for scheduling
- Integrate with Plaid/similar for balance checking (future)
- For MVP: rely on user confirmation of payments

### Security
- Store payment data encrypted
- VCTC document IDs only, not full card details
- Webhooks must verify Visa signature

---

## Success Metrics
- % of payments tracked
- % of on-time payments
- User engagement with reminders
- Reduction in missed payments
- Positive sentiment in feedback

---

## Questions for User Approval

1. **Scope**: Start with just tracking + reminders (Phase 1)? Or include smart controls (Phase 2)?
2. **Payment Types**: Which to prioritize? Rent, tuition, or transit?
3. **Database**: Use SQLite for MVP, or set up Postgres/Supabase?
4. **Notifications**: Push notifications, email, or in-app only?
5. **Gamification**: Should on-time payments contribute to monster growth?

---

## Next Steps After Approval
1. Set up VCTC client with Two-Way SSL
2. Create database schema
3. Build backend API routes
4. Implement reminder scheduling
5. Build frontend UI
6. Test end-to-end with sandbox
