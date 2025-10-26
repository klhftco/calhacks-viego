# Automated Payments Feature

## Overview

The Automated Payments feature allows students to track recurring payments (rent, tuition, transit) with automatic monitoring via Visa's VCTC API and smart reminders.

## How It Works

### 1. User Creates a Payment

User visits `/payments/setup` and fills out:
- **Type**: Rent, Tuition, or Transit
- **Merchant Name**: Who they're paying (e.g., "ABC Property Management")
- **Amount**: Payment amount
- **Frequency**: Monthly, Quarterly, Semester, Annual
- **Due Day**: Day of month for monthly payments
- **Reminders**: When to be reminded (7, 5, 3, 1 days before)

### 2. Backend Creates VCTC Monitoring Rule

When the payment is created:
```typescript
// Create VCTC merchant control
const vctcDocumentId = await createPaymentMonitoringRule(
  merchantName: "ABC Property Management",
  amount: 800,
  merchantCategoryCode: "6513", // Real estate
  frequency: "monthly"
);
```

This creates a rule in Visa's system that monitors for transactions:
- **Merchant**: ABC Property Management
- **Amount**: ~$800 (with 10% buffer)
- **Action**: Alert (don't decline, just notify)
- **Period**: Recurring monthly

### 3. Payment Data Stored Locally

Stored in `data/payments.json`:
```json
{
  "id": "pay_123",
  "userId": "demo_user",
  "type": "rent",
  "merchantName": "ABC Property Management",
  "amount": 800,
  "frequency": "monthly",
  "dueDay": 1,
  "nextDueDate": "2025-11-01",
  "status": "pending",
  "vctcDocumentId": "ctc-vd-857a...",
  "reminderDays": [7, 3, 1]
}
```

### 4. Reminders Generated

Reminders are calculated and stored in `data/reminders.json`:
```json
{
  "id": "rem_456",
  "paymentId": "pay_123",
  "scheduledDate": "2025-10-25", // 7 days before
  "daysBeforeDue": 7,
  "sent": false,
  "message": "🏠 Reminder: ABC Property Management payment of $800 due in 7 days"
}
```

### 5. Reminder Checking

Call `/api/cron/check-reminders` periodically:
- Finds all unsent reminders scheduled for today or earlier
- "Sends" them (logs to console for now)
- Marks as sent

### 6. User Makes Payment

User pays their rent manually (via bank app, property portal, etc.)

### 7. VCTC Detects Transaction

Visa's VCTC system:
- Detects transaction to "ABC Property Management" for ~$800
- Sends alert to webhook (not yet implemented)
- We can mark payment as "paid" automatically

### 8. Payment Marked Complete

Either:
- **Automatically**: Via VCTC webhook (future)
- **Manually**: User clicks "Mark as Paid" button

Payment status updates to "paid" and `lastPaidDate` is recorded.

## API Endpoints

### Payments

#### `GET /api/payments?userId=xxx`
Get all payments for a user
```json
{
  "success": true,
  "payments": [...],
  "count": 3
}
```

#### `POST /api/payments`
Create new payment
```json
{
  "userId": "demo_user",
  "type": "rent",
  "merchantName": "ABC Property",
  "amount": 800,
  "frequency": "monthly",
  "dueDay": 1,
  "reminderDays": [7, 3, 1]
}
```

#### `GET /api/payments/[id]`
Get specific payment

#### `PATCH /api/payments/[id]`
Update payment status
```json
{
  "status": "paid"
}
```

#### `DELETE /api/payments?id=xxx`
Delete payment (also deletes VCTC rule)

### Reminders

#### `GET /api/payments/reminders?pending=true`
Get all pending reminders

#### `GET /api/payments/reminders?paymentId=xxx`
Get reminders for specific payment

### Cron

#### `GET /api/cron/check-reminders`
Check and send pending reminders

### Testing

#### `GET /api/test/vctc`
Test VCTC Two-Way SSL connection

## File Structure

```
viego-wallet/
├── app/
│   ├── api/
│   │   ├── payments/
│   │   │   ├── route.ts          # CRUD operations
│   │   │   ├── [id]/route.ts     # Get/update specific payment
│   │   │   └── reminders/route.ts
│   │   ├── cron/
│   │   │   └── check-reminders/route.ts
│   │   └── test/
│   │       └── vctc/route.ts     # Test VCTC connection
│   └── payments/
│       ├── page.tsx               # Dashboard
│       └── setup/page.tsx         # Create payment form
├── lib/
│   ├── storage.ts                 # JSON file storage
│   └── vctc-client.ts            # VCTC API client (Two-Way SSL)
├── data/                          # Created at runtime
│   ├── payments.json
│   └── reminders.json
└── certs/                         # Your Visa certificates
    ├── vdp_client_cert.pem
    ├── vdp_client_key.pem
    └── ...
```

## Environment Variables

Required in `.env.local`:
```bash
# Visa Two-Way SSL Credentials
VISA_USER_ID=your_user_id
VISA_USER_PASSWORD=your_password

# Certificate paths (relative to project root)
VISA_CERT_PATH=../certs/vdp_client_cert.pem
VISA_PRIVATE_KEY_PATH=../certs/vdp_client_key.pem
VISA_ROOT_CA_PATH=../certs/vdp_root_cert.pem
VISA_INTERMEDIATE_CA_PATH=../certs/vdp_intermediate_cert.pem
DIGICERT_ROOT_CA_PATH=../certs/DigiCertGlobalRootCA.pem
```

## Testing the Feature

### 1. Test VCTC Connection
```bash
curl http://localhost:3000/api/test/vctc
```

Expected: `{"success": true, "data": {"message": "helloworld"}}`

### 2. Create a Payment
Visit: `http://localhost:3000/payments/setup`

Fill out form and click "Create Payment"

### 3. View Dashboard
Visit: `http://localhost:3000/payments`

Should see your payment listed under "Upcoming Payments"

### 4. Check Reminders
```bash
curl http://localhost:3000/api/cron/check-reminders
```

### 5. Mark as Paid
Click "Mark as Paid" button on payment

Should move to "Recent History" section

## Merchant Category Codes

Pre-configured MCCs:
- **Rent**: `6513` (Real Estate Agents and Managers - Rentals)
- **Tuition**: `8220` (Colleges, Universities, Professional Schools)
- **Transit**: `4111` (Local/Suburban Commuter Passenger Transportation)

## Future Enhancements

### Phase 2: Real-time Monitoring
- [ ] Implement VCTC webhook receiver
- [ ] Auto-mark payments as paid when VCTC detects transaction
- [ ] Real-time payment confirmation

### Phase 3: Advanced Reminders
- [ ] Push notifications (service worker)
- [ ] Email notifications
- [ ] SMS via Twilio

### Phase 4: Budget Integration
- [ ] Link with budget page
- [ ] Show payment impact on monthly budget
- [ ] Alert if payment would exceed budget

### Phase 5: MongoDB Migration
- [ ] Replace JSON storage with MongoDB
- [ ] Add user authentication
- [ ] Multi-user support

### Phase 6: Gamification
- [ ] Award XP for on-time payments
- [ ] "Payment Streak" badge
- [ ] Monster growth from responsible payments

## Troubleshooting

### VCTC Connection Fails
1. Check certificate paths in `.env.local`
2. Verify certificates exist and are valid
3. Confirm `VISA_USER_ID` and `VISA_USER_PASSWORD` are correct
4. Run `/api/test/vctc` for detailed error

### Payments Not Saving
- Check `data/` directory exists and is writable
- Look for errors in server console

### Reminders Not Sending
- Reminders are only "sent" when `/api/cron/check-reminders` is called
- In production, set up a cron job to call this every hour
- For testing, call manually

## Notes

- This is a **monitoring** system, not a **payment initiator**
- Users still make payments through their normal channels
- VCTC watches for the transaction and confirms it happened
- Works best with recurring merchants (same name, similar amount)
- 10% buffer on amount helps catch small variations
