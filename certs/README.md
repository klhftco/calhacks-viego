VDP Mutual TLS (certs-v3)

**What This Is**
- mTLS materials for Visa Developer Platform (VDP) sandbox.
- Used by `scripts/vdp-helloworld.js` to call `https://sandbox.api.visa.com/vdp/helloworld` with 2‑way SSL and Basic Auth.

**Contents**
- `vdp_client_cert.pem` — Client certificate issued by VDP for your project - next to each two-way SSL key.
- `vdp_client_key.pem` — Private key that pairs with the client cert - during CSR generation.
- `vdp_intermediate_cert.pem` — Visa intermediate CA that signs your client cert - underneath two-way SSL section.
- `vdp_root_cert.pem` — Visa root CA for the client cert chain - underneath two-way SSL section.
- `DigiCertGlobalRootCA.pem` — Public root used to verify `sandbox.api.visa.com` (server side trust).
  - Generated from `DigiCertGlobalRootCA.crt` via https://developer.visa.com/pages/working-with-visa-apis/two-way-ssl
- `.env` — Holds `VISA_USER_ID` and `VISA_USER_PASSWORD` used for Basic Auth - underneath each two-way SSL key.

**Quick Start**
- Place your `vdp_client_cert.pem` and `vdp_client_key.pem` in this folder.
- Create `.env` in this folder with:
  - `VISA_USER_ID=...`
  - `VISA_USER_PASSWORD=...`
- From repo root, run the Node test:
  - `node scripts/vdp-helloworld.js`
- Expected: `Status: 200` and a small JSON body.

**How It Works**
- Client authentication: Node `https.Agent` loads `vdp_client_cert.pem` and `vdp_client_key.pem` for mutual TLS.
- Server authentication: OS trust store is used; if needed, the script also tries `DigiCertGlobalRootCA.pem` in this folder.
- Authorization: Adds `Authorization: Basic <base64(VISA_USER_ID:VISA_USER_PASSWORD)>` header.

**Troubleshooting**
- 401 Unauthorized
  - Check `.env` values and that the project credentials are enabled for mTLS.
- TLS trust errors (e.g., UNABLE_TO_VERIFY_LEAF_SIGNATURE)
  - Ensure `DigiCertGlobalRootCA.pem` exists here; the Node script will include it.
  - Verify system clock and that you are hitting `sandbox.api.visa.com`.
- Handshake failures / bad certificate
  - Confirm the cert/key pair matches: run the OpenSSL check below.
  - Make sure you are using the sandbox client cert for the sandbox endpoint.
- Cert/key mismatch check (OpenSSL)
  - `openssl x509 -noout -modulus -in vdp_client_cert.pem | openssl md5`
  - `openssl rsa  -noout -modulus -in vdp_client_key.pem  | openssl md5`
  - Hashes must match.

**Notes and Options**
- The Visa client CA files (`vdp_root_cert.pem`, `vdp_intermediate_cert.pem`) are for your client cert chain, not for verifying the Visa server certificate.
- If your private key is passphrase‑protected, update the script to include a `passphrase` in the HTTPS agent.
- To enforce Visa’s minimum TLS version explicitly, add `minVersion: 'TLSv1.2'` to the HTTPS agent in `scripts/vdp-helloworld.js`.
- If your password contains non‑ASCII characters, Base64‑encode using UTF‑8.

**Security**
- Keep `vdp_client_key.pem` private and out of version control.
- Rotate/revoke the cert/key in VDP immediately if exposed.
