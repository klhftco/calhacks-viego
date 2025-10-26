# Quick Test Guide - VCTC Payment Monitoring

## TL;DR - Test in 3 Steps

### Step 1: Create a Payment
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo_user",
    "type": "rent",
    "merchantName": "ABC Property",
    "amount": 800,
    "frequency": "monthly",
    "dueDay": 1,
    "merchantCategoryCode": "6513",
    "reminderDays": [7, 3, 1]
  }'
```
**Save the `payment.id` from the response!**

---

### Step 2: Simulate Transaction
```bash
curl -X POST http://localhost:3000/api/test/simulate-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "YOUR_PAYMENT_ID_HERE"
  }'
```

**Look for:**
- `"shouldDecline": false` = ✅ Transaction approved
- `"shouldDecline": true` = ❌ Transaction declined

---

### Step 3: Check Alert History
```bash
curl http://localhost:3000/api/test/alert-history?card=4514170000000001
```

**Look for:**
- `"totalAlerts": 0` = No alerts triggered yet
- `"totalAlerts": 1+` = 🎉 Monitoring is working!

---

## All Test Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/test/vctc` | GET | Test basic VCTC connection |
| `/api/payments` | POST | Create payment + VCTC rule |
| `/api/test/simulate-transaction` | POST | Simulate transaction |
| `/api/test/alert-history` | GET | View triggered alerts |
| `/api/payments?userId=demo_user` | GET | List all payments |

---

## Quick Troubleshooting

### ❌ "Failed to create VCTC rule"
- Check `.env.local` has VCTC credentials
- Verify certificates are in place
- **Payment still works**, just won't have VCTC monitoring

### ❌ "VCTC rule not found"
- Payment was created without VCTC integration
- Create a new payment after fixing credentials

### ❌ "No alerts found"
- Normal if you just created the rule
- Simulate more transactions
- Check again in a few seconds

---

## Testing Different Scenarios

### Test Normal Payment (Should Approve)
```bash
curl -X POST http://localhost:3000/api/test/simulate-transaction \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "pay_xxx", "amountOverride": 800}'
```

### Test Over Limit (Should Decline)
```bash
curl -X POST http://localhost:3000/api/test/simulate-transaction \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "pay_xxx", "amountOverride": 900}'
```

### Test Edge Case
```bash
curl -X POST http://localhost:3000/api/test/simulate-transaction \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "pay_xxx", "amountOverride": 805}'
```

---

## What Each Response Means

### Transaction Simulation Response
```json
{
  "interpretation": "✅ Transaction would be APPROVED"
}
```
= Your VCTC rule checked the transaction and it's within limits

```json
{
  "interpretation": "❌ Transaction would be DECLINED by VCTC rule"
}
```
= Your VCTC rule would block this transaction (amount too high)

### Alert History Response
```json
{
  "interpretation": "📭 No alerts found"
}
```
= No transactions have triggered your rules yet

```json
{
  "interpretation": "📬 Found 2 alert(s)"
}
```
= 2 transactions matched your monitoring rules

---

## Visual Testing Flow

```
1. Create Payment
   ↓
2. Simulate Transaction
   ↓
   ├─→ Approved ✅
   └─→ Declined ❌
   ↓
3. Check Alert History
   ↓
   Verify monitoring works 🎉
```

---

## One-Liner Test Script

```bash
# Create payment, simulate transaction, check alerts - all in one!
PAYMENT_ID=$(curl -s -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo_user","type":"rent","merchantName":"Test Prop","amount":800,"frequency":"monthly","dueDay":1,"merchantCategoryCode":"6513","reminderDays":[7,3,1]}' \
  | jq -r '.payment.id') && \
echo "Payment ID: $PAYMENT_ID" && \
curl -X POST http://localhost:3000/api/test/simulate-transaction \
  -H "Content-Type: application/json" \
  -d "{\"paymentId\":\"$PAYMENT_ID\"}" | jq && \
curl -s http://localhost:3000/api/test/alert-history?card=4514170000000001 | jq
```

---

## Success Checklist

- [ ] Payment created with `vctcDocumentId`
- [ ] Transaction simulation returns decision
- [ ] Can test different amounts
- [ ] Alert history shows triggered alerts
- [ ] VCTC monitoring is working! 🎉

---

For detailed documentation, see `TESTING_VCTC.md`
