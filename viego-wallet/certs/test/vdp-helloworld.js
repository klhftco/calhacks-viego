const fs = require('fs');
const https = require('https');

// Fixed file locations
const CERT = 'certs-v3/vdp_client_cert.pem';
const KEY = 'certs-v3/vdp_client_key.pem';
const CA_CANDIDATES = [
  'certs-v3/DigiCertGlobalRootCA.pem',
  'certs-v3/vdp_root_cert.pem',
  'certs-v3/vdp_intermediate_cert.pem',
];

// Load VISA_USER_ID/PASSWORD from certs-v3/.env if not set
function loadEnv() {
  if (process.env.VISA_USER_ID && (process.env.VISA_USER_PASSWORD || process.env.VISA_PASSWORD)) return;
  try {
    const lines = fs.readFileSync('certs-v3/.env', 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch (_) {}
}

function b64(s) { return Buffer.from(s, 'ascii').toString('base64'); }
function readIf(p) { try { return fs.readFileSync(p); } catch { return undefined; } }

function main() {
  loadEnv();
  const user = process.env.VISA_USER_ID;
  const pass = process.env.VISA_USER_PASSWORD || process.env.VISA_PASSWORD; // fallback if present

  if (!user || !pass) {
    console.error('Missing VISA_USER_ID/VISA_USER_PASSWORD (set in certs-v3/.env).');
    process.exit(1);
  }
  if (!fs.existsSync(CERT) || !fs.existsSync(KEY)) {
    console.error('Missing cert or key. Expect certs-v3/vdp_client_cert.pem and certs-v3/vdp_client_key.pem');
    process.exit(1);
  }

  const ca = CA_CANDIDATES.map(readIf).filter(Boolean);
  const agent = new https.Agent({ cert: readIf(CERT), key: readIf(KEY), ca: ca.length ? ca : undefined });

  const req = https.request({
    host: 'sandbox.api.visa.com',
    path: '/vdp/helloworld',
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${b64(`${user}:${pass}`)}`,
    },
    agent,
  }, (res) => {
    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log('Body:');
      console.log(Buffer.concat(chunks).toString('utf8'));
    });
  });

  req.on('error', (e) => console.error('Request error:', e.message));
  req.end();
}

main();
