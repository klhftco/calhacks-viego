# Visa Developer Platform Certificates

## What Certs Should Exist

This directory contains 5 certificate files for Visa API two-way SSL:

```
DigiCertGlobalRootCA.pem
vdp_client_cert.pem
vdp_client_key.pem
vdp_intermediate_cert.pem
vdp_root_cert.pem
```

## How to Get Them

1. Log in to [Visa Developer Portal](https://developer.visa.com/)
2. Go to your project dashboard
3. Navigate to **Credentials → Two-Way SSL**
4. Download the certificate bundle or generate new certificates
5. Place the `.pem` files in this directory

## What Each Is Used For

| File | Purpose |
|------|---------|
| `vdp_client_cert.pem` | Client certificate - proves your identity to Visa API |
| `vdp_client_key.pem` | Private key - pairs with client cert for authentication |
| `vdp_root_cert.pem` | Visa root CA - validates your client cert chain |
| `vdp_intermediate_cert.pem` | Visa intermediate CA - validates your client cert chain |
| `DigiCertGlobalRootCA.pem` | DigiCert root CA - verifies Visa's server certificate |

## How Two-Way SSL Works

**Client → Server Authentication:**
- Node.js loads `vdp_client_cert.pem` + `vdp_client_key.pem`
- Visa verifies your cert against their CA chain
- Proves you are an authorized developer

**Server → Client Authentication:**
- Visa presents their SSL certificate
- Your app verifies it using `DigiCertGlobalRootCA.pem`
- Proves you're talking to the real Visa API

Both sides authenticate = two-way SSL (mTLS)

## Minimal Testing

Run the test script from repo root:
```bash
node viego-wallet/certs/test/vdp-helloworld.js
```

Expected output: `Status: 200` with JSON response body.

**Troubleshooting:**
- `401 Unauthorized` → Check credentials in `.env.local`
- `UNABLE_TO_VERIFY_LEAF_SIGNATURE` → Missing `DigiCertGlobalRootCA.pem`
- Handshake failures → Verify cert/key pair match:
  ```bash
  openssl x509 -noout -modulus -in vdp_client_cert.pem | openssl md5
  openssl rsa  -noout -modulus -in vdp_client_key.pem  | openssl md5
  # Hashes must match
  ```

## Security

All files in this directory are gitignored. Never commit certificates to version control.
