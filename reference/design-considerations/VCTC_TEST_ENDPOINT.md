# VCTC Test Endpoint Guide

A flexible test endpoint that lets you call any Visa API endpoint using your configured SSL certificates.

## Endpoint

`/api/vctc/test`

## Usage

### Via UI

1. Navigate to `http://localhost:3000/test/vctc`
2. Scroll to the "🧪 Test Any Endpoint" section
3. Select HTTP method (GET, POST, PUT, DELETE, PATCH)
4. Enter the endpoint path (e.g., `/vctc/customerrules/v1/...`)
5. Add JSON body if needed (for POST/PUT/PATCH)
6. Click "Test Endpoint"

### Via API (GET requests)

```bash
curl "http://localhost:3000/api/vctc/test?endpoint=/vdp/helloworld&method=GET"
```

### Via API (POST requests)

```bash
curl -X POST "http://localhost:3000/api/vctc/test?endpoint=/vctc/customerrules/v1/consumertransactioncontrols/inquiries/cardinquiry&method=POST" \
  -H "Content-Type: application/json" \
  -d '{
    "primaryAccountNumber": "4514170000000001"
  }'
```

## Query Parameters

- `endpoint` (required) - The Visa API path (e.g., `/vctc/customerrules/v1/...`)
- `method` (optional) - HTTP method: GET, POST, PUT, DELETE, PATCH (default: GET for GET requests, POST for POST requests)

## Request Body

For POST/PUT/PATCH requests, send JSON in the body. It will be forwarded to the Visa API.

## Response Format

```json
{
  "success": true,
  "request": {
    "method": "POST",
    "endpoint": "/vctc/customerrules/v1/...",
    "fullUrl": "https://sandbox.api.visa.com/vctc/customerrules/v1/...",
    "body": { ... }
  },
  "response": {
    "statusCode": 200,
    "headers": { ... },
    "body": { ... }
  }
}
```

## Example Endpoints to Try

### 1. Test Connectivity
```
GET /vdp/helloworld
```

### 2. Card Inquiry
```
POST /vctc/customerrules/v1/consumertransactioncontrols/inquiries/cardinquiry
Body: { "primaryAccountNumber": "4514170000000001" }
```

### 3. Get Customer Profile
```
GET /vctc/customerrules/v1/consumertransactioncontrols/customer/{userIdentifier}
```

### 4. Get Control Document Rules
```
GET /vctc/customerrules/v1/consumertransactioncontrols/{documentID}
```

### 5. Get Decision Details
```
GET /vctc/validation/v1/decisions/{decisionID}
```

### 6. Get Notifications
```
GET /vctc/customerrules/v1/consumertransactioncontrols/customer/notifications?userIdentifier=demo-user-001&page=1&limit=10
```

### 7. Transaction Type Controls Inquiry
```
POST /vctc/customerrules/v1/transactiontypecontrols/cardinquiry
Body: { "primaryAccountNumber": "4514170000000001" }
```

## How It Works

1. Takes any endpoint path from `sandbox.api.visa.com`
2. Uses your configured SSL certificates (from `.env.local`)
3. Adds Basic Auth credentials automatically
4. Makes the request with mTLS (mutual TLS)
5. Returns the complete response with status code and body

## Benefits

- **No code changes needed** - Test any endpoint without creating new routes
- **Full SSL support** - Uses your existing certificate configuration
- **Authentication included** - Automatically adds Basic Auth headers
- **Debugging friendly** - See full request/response details
- **Explore APIs** - Try endpoints from Visa docs without waiting

## Security Notes

- This endpoint runs **server-side only** - SSL certs never exposed to browser
- Only accessible in your local development environment
- All requests are logged to console for debugging
- Uses the same security setup as your production endpoints

## Troubleshooting

**404 errors:**
- Double-check the endpoint path in Visa API documentation
- Ensure path starts with `/` (e.g., `/vctc/...`)

**405 errors (Method Not Allowed):**
- Try a different HTTP method
- Check if endpoint requires GET vs POST

**401/403 errors:**
- Verify `.env.local` has correct credentials
- Check SSL certificates are in place

**Certificate errors:**
- Check server console logs for cert loading details
- Verify cert paths in `.env.local`
