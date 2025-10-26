Nice — here’s a concise, copy-paste-ready toolkit: concrete example request bodies + runnable cURL, plus a Node/Next.js example showing how to call Sandbox directly with mutual TLS (mTLS). I also explain what you must keep server-side and what Visa docs say about the flow. I’ve marked where you must replace placeholders with values from your Visa Developer project (username/password, cert paths, userIdentifier, PAN or test PAN).

Quick context (source): Visa’s VCTC Sandbox expects you to create customers by calling the APIs (no pre-seeded demo accounts). VCTC uses mTLS + Basic Auth for many endpoints and supports an Authorization Decision API to simulate activity. ([Visa Developer][1])

---

# 1) Constants / placeholders to replace

* `BASE=https://sandbox.api.visa.com`
* `USERID=demo-user-001` (your chosen userIdentifier — must be unique / non-PII)
* `VDP_USERNAME` and `VDP_PASSWORD` — from your Visa Developer project credentials
* Cert/key files from Visa Developer: `cert.pem`, `privateKey.pem`, and root CA `DigiCertGlobalRootCA.pem` (or a single `.p12`/`.pfx` if you exported one) ([Visa Developer][2])

---

# 2) Example JSON bodies (canonical examples)

### A — Create Customer Profile (alert contact prefs)

Use this if you want alerts to be deliverable or to store contact prefs for the `userIdentifier`.

```json
{
  "userIdentifier": "demo-user-001",
  "profile": {
    "preferredLanguage": "en",
    "contacts": [
      {
        "contactType": "EMAIL",
        "contactValue": "demo+alerts@example.com",
        "notificationPreference": "EMAIL"
      }
    ]
  }
}
```

> Note: POST this body to the Alert History & Customer Profiles endpoint in the VCTC product (use API Explorer to copy the exact path for `createCustomerProfile_v1`). VCTC docs explain this API is for managing contact prefs and alert history. ([Visa Developer][3])

---

### B — Register / Enroll a card (Customer Rules)

This enrolls a PAN (or token) so a control document is created and you can add rules.

```json
{
  "userIdentifier": "demo-user-001",
  "card": {
    "pan": "4111111111111111",
    "expiryDate": "12/2027",
    "tokenizationIndicator": "PAN"
  },
  "meta": {
    "requestReference": "enroll-req-001"
  }
}
```

> POST to the Customer Rules “register/enroll card” endpoint. Visa returns a `documentId` or control doc reference you’ll use for adding rules. Use the API Reference to copy exact request/response fields. ([Visa Developer][1])

---

### C — Add a simple rule (e.g., block e-commerce > $20)

A typical control rule body — adjust structure to match the “Add Rule” schema in the Customer Rules API Explorer.

```json
{
  "userIdentifier": "demo-user-001",
  "documentId": "returned-document-id-from-enroll",
  "rule": {
    "ruleName": "block-ecom-over-20",
    "ruleType": "ECOMMERCE_AMOUNT",
    "action": "DECLINE",
    "threshold": {
      "amount": 20,
      "currency": "USD"
    },
    "enabled": true
  }
}
```

> POST to the Customer Rules “add/update control” endpoint. The exact attribute names vary slightly by API version — copy from the API Reference. ([Visa Developer][1])

---

### D — Request an Authorization Decision (to simulate a transaction)

This creates a decision (so you have something in alert/decision history to show).

```json
{
  "userIdentifier": "demo-user-001",
  "card": {
    "pan": "4111111111111111"
  },
  "transaction": {
    "merchantType": "ECOMMERCE",
    "amount": 25.00,
    "currency": "USD",
    "transactionId": "txn-demo-001",
    "timestamp": "2025-10-25T12:00:00Z"
  },
  "meta": {
    "requestReference": "decision-req-001"
  }
}
```

> POST to the Authorization Decision API (requestDecision). VTC will evaluate the configured rules and return a recommendation/decision. Use that decision/alert to display “activity” in your demo. ([Visa Developer][3])

---

### E — Fetch Alert History / Decision history

Simple GET to list recent alerts/decisions for `demo-user-001`:

```
GET ${BASE}/vctc/alerthistory/v1/alerts/customer/demo-user-001
```

> Exact query params and path names are available in the API Reference; use API Explorer to copy the precise GET path for alert history or decision list. ([Visa Developer][4])

---

# 3) Runnable cURL examples (replace placeholders)

### Create a profile (cURL)

```bash
curl -X POST "${BASE}/vctc/alerthistory/v1/customerprofile" \
  -u "${VDP_USERNAME}:${VDP_PASSWORD}" \
  --cert cert.pem --key privateKey.pem --cacert DigiCertGlobalRootCA.pem \
  -H "Content-Type: application/json" \
  -d '@customer_profile.json'
```

### Enroll card (cURL)

```bash
curl -X POST "${BASE}/vctc/customerrules/v1/consumertransactioncontrols/enroll" \
  -u "${VDP_USERNAME}:${VDP_PASSWORD}" \
  --cert cert.pem --key privateKey.pem --cacert DigiCertGlobalRootCA.pem \
  -H "Content-Type: application/json" \
  -d '@enroll_card.json'
```

### Request a decision (cURL)

```bash
curl -X POST "${BASE}/vctc/authorization/v1/decision" \
  -u "${VDP_USERNAME}:${VDP_PASSWORD}" \
  --cert cert.pem --key privateKey.pem --cacert DigiCertGlobalRootCA.pem \
  -H "Content-Type: application/json" \
  -d '@decision_request.json'
```

### Get alert history (cURL)

```bash
curl -X GET "${BASE}/vctc/alerthistory/v1/alerts/customer/${USERID}" \
  -u "${VDP_USERNAME}:${VDP_PASSWORD}" \
  --cert cert.pem --key privateKey.pem --cacert DigiCertGlobalRootCA.pem
```

> If you prefer `.p12` / `.pfx` you can convert or use `--cert client.p12:mypassword` with curl, or create a PKCS#12 keystore per Visa’s Two-Way SSL docs. ([Visa Developer][2])

---

# 4) Can you bypass the Playground and call from your Next.js API? — Yes. How to do it safely

Short answer: **Yes**, you can call Sandbox directly from your Next.js server (server-side API routes or serverless functions) that are configured for mTLS. **Do not** call Visa directly from client-side/browser because you must keep the client cert and private key secret.

Key points:

* **Server-only**: Store the client cert & private key in secure server env (not checked into git). Use environment variables and secret storage (e.g., Vercel secrets, AWS Secrets Manager).
* **mTLS & Basic Auth**: You must present the client certificate (and key) when performing HTTPS requests and also include the Basic Auth credentials issued by Visa. The TLS handshake authenticates your client cert, and the request still needs the Basic Auth header (or `-u` in curl). ([Visa Developer][2])
* **Network**: Your Next.js server must be able to reach `sandbox.api.visa.com` (no firewall blocking) and must support loading cert/key into an HTTPS agent (Node.js `https.Agent`).

Minimal Node example (Axios + https.Agent) — put this in an API route (server-only):

```js
// pages/api/vctc/enroll.js  (Next.js API route)
import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';

export default async function handler(req, res) {
  try {
    // load certs from a secure path (do NOT commit to repo)
    const cert = fs.readFileSync(process.env.VISA_CLIENT_CERT_PATH); // PEM or PFX
    const key = fs.readFileSync(process.env.VISA_PRIVATE_KEY_PATH); // PEM (if separate)
    const ca = fs.readFileSync(process.env.VISA_CA_CERT_PATH);

    const httpsAgent = new https.Agent({
      cert,        // or pfx if using .p12/pfx
      key,
      ca,
      rejectUnauthorized: true
    });

    const base = 'https://sandbox.api.visa.com';
    const username = process.env.VDP_USERNAME;
    const password = process.env.VDP_PASSWORD;

    const body = {
      userIdentifier: 'demo-user-001',
      card: { pan: '4111111111111111', expiryDate: '12/2027' }
    };

    const r = await axios.post(`${base}/vctc/customerrules/v1/consumertransactioncontrols/enroll`,
      body,
      {
        httpsAgent,
        auth: { username, password },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    res.status(200).json(r.data);
  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({ error: err?.message || 'request failed' });
  }
}
```

Notes:

* If Visa gives you a `.p12`/`.pfx` bundle, you can put it into `https.Agent` as `pfx: fs.readFileSync('client.p12'), passphrase: process.env.PFX_PASSWORD`.
* Keep cert/key access on the server: serverless platforms have different ways to provide files (mount, env secrets, or fetch from secret manager at runtime).

---

# 5) Practical checklist to get from zero → demo running in your Next.js app

1. Create a Visa Developer project and enable VCTC; generate Sandbox credentials and client cert/key. ([Visa Developer][2])
2. Add cert & key to your server environment (secure secret store).
3. Implement an API route (server-side) that builds an `https.Agent` with cert/key and calls the needed VCTC endpoints. Use Basic Auth for username/password.
4. Use the API Explorer in Visa Developer for the exact endpoint URLs and sample request/response schemas, copy their sample JSON exactly and paste into your request. (The Explorer is authoritative for the operation names/fields.) ([Visa Developer][4])
5. Enroll a card, add a rule, call Authorization Decision with a simulated transaction, then fetch alert/decision history to show results.

---

# 6) Gotchas & troubleshooting

* If you get TLS errors, verify your cert/key pair is correct and include the DigiCert root CA if cURL/Node cannot verify the server. ([Visa Developer][2])
* If you get 401/403, ensure your Basic Auth username:password is correct for the project and you used the correct auth type for that specific endpoint (some Visa APIs use X-Pay or different auth methods — VCTC specifically expects mTLS+Basic Auth). ([Visa Developer][2])
* “Customer not found” usually means you haven’t enrolled a card or created any rules for that `userIdentifier` yet. Enroll → add rules → simulate a decision. ([Visa Developer][1])

---

If you want, I’ll:

* paste fully-filled cURL files (with exact sample endpoints copied from the API Explorer) using `demo-user-001`, or
* produce the actual request bodies and route handlers exactly tailored to your repo structure (show me the path where you plan to store certs, or tell me if you use `.p12` vs PEM).

Which would you like next?

[1]: https://developer.visa.com/capabilities/vctc?utm_source=chatgpt.com "Visa Transaction Controls - Visa Developer"
[2]: https://developer.visa.com/docs?utm_source=chatgpt.com "Documentation - Visa Developer"
[3]: https://developer.visa.com/capabilities/vctc/docs-how-to?utm_source=chatgpt.com "How to Use Visa Transaction Controls - Visa Developer"
[4]: https://developer.visa.com/capabilities/vctc/reference?utm_source=chatgpt.com "Visa Transaction Controls API Reference - Visa Developer"
