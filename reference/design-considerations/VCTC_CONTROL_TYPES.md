# VCTC Control Types Reference

## Merchant Control Types (MCT_)

Valid values for `merchantControls[].controlType`:

- `MCT_ADULT_ENTERTAINMENT` - Adult entertainment merchants
- `MCT_AIRFARE` - Airline tickets
- `MCT_ALCOHOL` - Alcohol/liquor stores
- `MCT_APPAREL_AND_ACCESSORIES` - Clothing and accessories
- `MCT_AUTOMOTIVE` - Automotive services and parts
- `MCT_CAR_RENTAL` - Car rental services
- `MCT_DINING` - Restaurants and dining
- `MCT_ELECTRONICS` - Electronics stores
- `MCT_GAMBLING` - Casinos and gambling
- `MCT_GAS_AND_PETROLEUM` - Gas stations
- `MCT_GROCERY` - Grocery stores and supermarkets
- `MCT_HOTEL_AND_LODGING` - Hotels and accommodations
- `MCT_HOUSEHOLD` - Household goods and supplies
- `MCT_PERSONAL_CARE` - Personal care and beauty
- `MCT_SMOKE_AND_TOBACCO` - Tobacco products
- `MCT_SPORT_AND_RECREATION` - Sports and recreation

## Transaction Control Types (TCT_)

Valid values for `transactionControls[].controlType`:

- `TCT_ATM_WITHDRAW` - ATM withdrawals
- `TCT_AUTO_PAY` - Automatic/recurring payments
- `TCT_BRICK_AND_MORTAR` - In-person store transactions
- `TCT_CROSS_BORDER` - International transactions
- `TCT_E_COMMERCE` - Online purchases
- `TCT_CONTACTLESS` - Contactless/tap payments
- `TCT_PURCHASE_RETURN` - Purchase returns/refunds
- `TCT_OCT` - Original Credit Transactions

## Required Fields

### For merchantControls:
```typescript
{
  controlType: string;     // REQUIRED - Must be MCT_ value
  isControlEnabled: boolean; // REQUIRED
  shouldDeclineAll?: boolean;
  alertThreshold?: number;
  declineThreshold?: number;
  userIdentifier?: string;
  currencyCode?: string;   // e.g., "840" for USD
  spendLimit?: {
    type?: 'LMT_MONTH' | 'LMT_WEEK' | 'LMT_DAY' | 'LMT_RECURRING';
    alertThreshold?: string;
    declineThreshold?: string;
  }
}
```

### For transactionControls:
```typescript
{
  controlType: string;     // REQUIRED - Must be TCT_ value
  isControlEnabled: boolean; // REQUIRED
  shouldDeclineAll?: boolean;
  alertThreshold?: number;
  declineThreshold?: number;
  shouldAlertOnDecline?: boolean;
}
```

### For globalControls:
```typescript
{
  isControlEnabled: boolean;
  shouldDeclineAll: boolean;
  shouldAlertOnDecline?: boolean;
  alertThreshold?: number;
  declineThreshold?: number;
  userIdentifier?: string;
  transactionLimit?: {
    currentTransactionCount?: string;
    maxTransactionCount?: string;
  }
}
```

## Example Usage

### Merchant Control (Dining limit):
```javascript
const rules = {
  merchantControls: [
    {
      controlType: "MCT_DINING",
      isControlEnabled: true,
      shouldDeclineAll: false,
      alertThreshold: 50,
      declineThreshold: 100,
      userIdentifier: "demo-user-001"
    }
  ]
};
```

### Transaction Control (E-commerce limit):
```javascript
const rules = {
  transactionControls: [
    {
      controlType: "TCT_E_COMMERCE",
      isControlEnabled: true,
      shouldDeclineAll: false,
      alertThreshold: 100,
      declineThreshold: 500
    }
  ]
};
```

### Global Control (Account-wide):
```javascript
const rules = {
  globalControls: {
    isControlEnabled: true,
    shouldDeclineAll: false,
    alertThreshold: 500,
    declineThreshold: 1000,
    userIdentifier: "demo-user-001"
  }
};
```

## Common Patterns

### Spending Limit with Monthly Reset:
```javascript
{
  controlType: "MCT_GROCERY",
  isControlEnabled: true,
  userIdentifier: "user-123",
  spendLimit: {
    type: "LMT_MONTH",
    alertThreshold: "200.00",
    declineThreshold: "250.00"
  }
}
```

### Block All Gambling Transactions:
```javascript
{
  controlType: "MCT_GAMBLING",
  isControlEnabled: true,
  shouldDeclineAll: true
}
```

### Alert on High ATM Withdrawals:
```javascript
{
  controlType: "TCT_ATM_WITHDRAW",
  isControlEnabled: true,
  alertThreshold: 200,
  shouldAlertOnDecline: true
}
```
