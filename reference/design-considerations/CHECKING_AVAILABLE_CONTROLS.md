# Checking Available Controls for Cards

**IMPORTANT:** Not all cards support all control types. You MUST check which controls are available for a specific card before attempting to set rules.

## Why This Matters

Different cards issued by different banks support different sets of merchant and transaction controls. For example:
- Some test cards may only support `MCT_ALCOHOL` and `MCT_GAMBLING`
- Others may support all 16+ merchant control types
- Transaction controls (TCT_) availability also varies by card

If you try to set a control type that isn't supported by the card, you'll get an error: **"controlType cannot be empty"** or similar validation errors.

## How to Check Available Controls

### Via UI

1. Navigate to `http://localhost:3000/test/vctc`
2. Enter the card PAN (e.g., `4514170000000001`)
3. Click **"Check Available"** button in the Control Type section
4. View available controls in the dropdown
5. Select a control type from the dropdown
6. Click "Add Rule" to set a limit for that control type

### Via API

```bash
GET /api/vctc/available-controls?pan=4514170000000001
```

**Response:**
```json
{
  "success": true,
  "primaryAccountNumber": "4514170000000001",
  "merchantControls": {
    "resource": {
      "merchantControls": [
        { "name": "MCT_ALCOHOL", "isSupported": true },
        { "name": "MCT_GAMBLING", "isSupported": true },
        { "name": "MCT_GROCERY", "isSupported": true }
      ]
    }
  },
  "transactionControls": {
    "resource": {
      "transactionControls": [
        { "name": "TCT_ATM_WITHDRAW", "isSupported": true },
        { "name": "TCT_E_COMMERCE", "isSupported": true }
      ]
    }
  }
}
```

## Visa API Endpoints

### Merchant Type Controls Inquiry
```
POST /vctc/customerrules/v1/merchanttypecontrols/cardinquiry
Body: { "primaryAccountNumber": "4514170000000001" }
```

Returns which MCT_ controls the card supports.

### Transaction Type Controls Inquiry
```
POST /vctc/customerrules/v1/transactiontypecontrols/cardinquiry
Body: { "primaryAccountNumber": "4514170000000001" }
```

Returns which TCT_ controls the card supports.

## Updated Workflow

The correct workflow is now:

1. **Check Profile** (optional) - See if profile exists
2. **Create Profile** - Create customer profile
3. **Enroll Card** - Enroll the PAN, get documentID
4. **Check Available Controls** ⬅️ NEW! Must do this before adding rules
5. **Select Control Type** - Pick from available controls
6. **Add Rule** - Set spending limits for the selected control
7. **Request Decision** - Simulate a transaction
8. **Fetch Alerts** - View notifications

## Example: Using Library Functions

```typescript
import {
  getMerchantTypeControls,
  getTransactionTypeControls
} from '@/lib/vctc-client';

// Check what's available
const merchantControls = await getMerchantTypeControls('4514170000000001');
const transactionControls = await getTransactionTypeControls('4514170000000001');

// Extract control type names
const availableMCT = merchantControls.resource.merchantControls
  .filter(c => c.isSupported)
  .map(c => c.name);

console.log('Available merchant controls:', availableMCT);
// Output: ['MCT_ALCOHOL', 'MCT_GAMBLING', 'MCT_GROCERY']

// Now you can safely create a rule with one of these types
const rules = {
  merchantControls: [{
    controlType: availableMCT[0], // Use an available type!
    isControlEnabled: true,
    alertThreshold: 100,
    declineThreshold: 200
  }]
};
```

## Common Issues

### "controlType cannot be empty"
**Cause:** You're trying to set a control type that isn't supported by the card.
**Fix:** Check available controls first and only use supported types.

### "No control type selected"
**Cause:** You haven't selected a control type from the dropdown.
**Fix:** Click "Check Available" then select a type from the dropdown.

### Empty dropdown
**Cause:** Either:
1. You haven't clicked "Check Available" yet
2. The card doesn't support any merchant controls (unlikely)
3. API error when fetching controls

**Fix:** Check the logs panel for error messages.

## Test Card Support

The default test card `4514170000000001` typically supports:
- **Merchant Controls:** Check via API (varies)
- **Transaction Controls:** Check via API (varies)

Always check before assuming a control type is supported!

## Benefits

✅ Prevents errors from setting unsupported controls
✅ Shows users only what they can actually configure
✅ Improves UX by dynamically populating dropdowns
✅ Aligns with real-world use case (different banks, different support)

## Implementation Details

**Files involved:**
- `lib/vctc-client.ts` - Added `getMerchantTypeControls()` and `getTransactionTypeControls()`
- `app/api/vctc/available-controls/route.ts` - API endpoint wrapper
- `app/test/vctc/page.tsx` - UI to check/select controls

The UI automatically:
- Fetches available controls when you click "Check Available"
- Populates dropdown with only supported types
- Auto-selects the first available control
- Validates control type before adding rules
