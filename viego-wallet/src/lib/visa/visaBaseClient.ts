/**
 * Visa Base Client
 * Shared certificate loading and request handling for all Visa APIs
 * Uses Two-Way SSL authentication with Basic Auth
 */

import fs from 'fs';
import https from 'https';
import path from 'path';

const VISA_BASE_URL = 'https://sandbox.api.visa.com';

export interface VisaApiOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
}

// Certificate paths from environment variables
const CERT_PATH = process.env.VISA_CERT_PATH || '../certs/vdp_client_cert.pem';
const KEY_PATH = process.env.VISA_PRIVATE_KEY_PATH || '../certs/vdp_client_key.pem';
const ROOT_CA_PATH = process.env.VISA_ROOT_CA_PATH || '../certs/vdp_root_cert.pem';
const INTERMEDIATE_CA_PATH = process.env.VISA_INTERMEDIATE_CA_PATH || '../certs/vdp_intermediate_cert.pem';
const DIGICERT_CA_PATH = process.env.DIGICERT_ROOT_CA_PATH || '../certs/DigiCertGlobalRootCA.pem';

// Credentials
const USER_ID = process.env.VISA_USER_ID;
const PASSWORD = process.env.VISA_USER_PASSWORD;

/**
 * Load certificate file if it exists
 */
function loadCert(relativePath: string): Buffer | undefined {
  try {
    const fullPath = path.resolve(process.cwd(), relativePath);
    console.log(`[Visa] Attempting to load cert from: ${fullPath}`);
    if (fs.existsSync(fullPath)) {
      const cert = fs.readFileSync(fullPath);
      console.log(`[Visa] Successfully loaded cert: ${path.basename(fullPath)} (${cert.length} bytes)`);
      return cert;
    } else {
      console.warn(`[Visa] Certificate file not found: ${fullPath}`);
    }
  } catch (error) {
    console.error(`[Visa] Error loading cert from ${relativePath}:`, error);
  }
  return undefined;
}

/**
 * Load Two-Way SSL certificates
 */
export function loadCertificates() {
  const cert = loadCert(CERT_PATH);
  const key = loadCert(KEY_PATH);

  if (!cert || !key) {
    throw new Error('Client certificate and key are required. Check VISA_CERT_PATH and VISA_PRIVATE_KEY_PATH in .env.local');
  }

  // Load CA certificates
  const ca: Buffer[] = [];
  [ROOT_CA_PATH, INTERMEDIATE_CA_PATH, DIGICERT_CA_PATH].forEach(caPath => {
    const caCert = loadCert(caPath);
    if (caCert) ca.push(caCert);
  });

  return {
    cert,
    key,
    ca: ca.length > 0 ? ca : undefined,
  };
}

/**
 * Create Basic Auth header
 */
function createAuthHeader(): string {
  if (!USER_ID || !PASSWORD) {
    throw new Error('VISA_USER_ID and VISA_USER_PASSWORD are required');
  }
  const credentials = `${USER_ID}:${PASSWORD}`;
  return `Basic ${Buffer.from(credentials, 'ascii').toString('base64')}`;
}

/**
 * Make authenticated request to Visa API using Two-Way SSL + Basic Auth
 */
export async function makeVisaApiCall<T>(options: VisaApiOptions): Promise<T> {
  const { method, endpoint, data } = options;

  const certificates = loadCertificates();
  const basicAuth = createAuthHeader();

  const url = new URL(endpoint, VISA_BASE_URL);

  console.log('📤 Visa API Request:', {
    method,
    endpoint,
    url: url.href,
    hasBasicAuth: !!basicAuth,
    hasCert: !!certificates.cert,
    hasKey: !!certificates.key,
    userId: USER_ID?.substring(0, 20) + '...',
  });

  return new Promise((resolve, reject) => {
    const bodyString = data ? JSON.stringify(data) : undefined;

    const requestOptions: https.RequestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': basicAuth,
        ...(bodyString && { 'Content-Length': Buffer.byteLength(bodyString) }),
      },
      cert: certificates.cert,
      key: certificates.key,
      ca: certificates.ca,
      rejectUnauthorized: true,
    };

    const req = https.request(requestOptions, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk) => chunks.push(chunk));

      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString('utf8');
        console.log(`[Visa] Status: ${res.statusCode}`);
        console.log(`[Visa] Response:`, responseBody.substring(0, 500));

        try {
          const parsedData = JSON.parse(responseBody);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            const errorMsg = parsedData?.message || parsedData?.errorMessage || JSON.stringify(parsedData);
            console.error(`[Visa] API Error Details:`, JSON.stringify(parsedData, null, 2));
            reject(new Error(`Visa API Error (${res.statusCode}): ${errorMsg}`));
          }
        } catch (error) {
          console.error(`[Visa] Failed to parse response:`, responseBody);
          reject(new Error(`Failed to parse response (${res.statusCode}): ${responseBody.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[Visa] Request error:', error.message);
      reject(error);
    });

    if (bodyString) {
      req.write(bodyString);
    }

    req.end();
  });
}

/**
 * Test Visa connection with Hello World endpoint
 */
export async function testVisaConnection(): Promise<any> {
  return makeVisaApiCall({
    method: 'GET',
    endpoint: '/vdp/helloworld',
  });
}
