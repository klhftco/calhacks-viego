import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import https from 'https';

const BASE_URL = 'sandbox.api.visa.com';

// Certificate paths from .env.local
const CERT_PATH = process.env.VISA_CERT_PATH || '../certs/vdp_client_cert.pem';
const KEY_PATH = process.env.VISA_PRIVATE_KEY_PATH || '../certs/vdp_client_key.pem';
const ROOT_CA_PATH = process.env.VISA_ROOT_CA_PATH || '../certs/vdp_root_cert.pem';
const INTERMEDIATE_CA_PATH = process.env.VISA_INTERMEDIATE_CA_PATH || '../certs/vdp_intermediate_cert.pem';
const DIGICERT_CA_PATH = process.env.DIGICERT_ROOT_CA_PATH || '../certs/DigiCertGlobalRootCA.pem';

const USER_ID = process.env.VISA_USER_ID;
const PASSWORD = process.env.VISA_USER_PASSWORD;

function loadCert(relativePath: string): Buffer | undefined {
  try {
    const fullPath = path.resolve(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath);
    }
  } catch (error) {
    console.error(`Error loading cert from ${relativePath}:`, error);
  }
  return undefined;
}

function createSSLAgent(): https.Agent {
  const cert = loadCert(CERT_PATH);
  const key = loadCert(KEY_PATH);

  if (!cert || !key) {
    throw new Error('Client certificate and key are required');
  }

  const ca: Buffer[] = [];
  [ROOT_CA_PATH, INTERMEDIATE_CA_PATH, DIGICERT_CA_PATH].forEach(caPath => {
    const caCert = loadCert(caPath);
    if (caCert) ca.push(caCert);
  });

  return new https.Agent({ cert, key, ca: ca.length > 0 ? ca : undefined });
}

function createAuthHeader(): string {
  if (!USER_ID || !PASSWORD) {
    throw new Error('VISA_USER_ID and VISA_USER_PASSWORD are required');
  }
  return `Basic ${Buffer.from(`${USER_ID}:${PASSWORD}`, 'ascii').toString('base64')}`;
}

async function makeRequest(method: string, endpoint: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const agent = createSSLAgent();
    const bodyString = body ? JSON.stringify(body) : undefined;

    const options: https.RequestOptions = {
      host: BASE_URL,
      path: endpoint,
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': createAuthHeader(),
        ...(bodyString && { 'Content-Length': Buffer.byteLength(bodyString) }),
      },
      agent,
    };

    console.log(`[TEST] ${method} https://${BASE_URL}${endpoint}`);
    if (bodyString) {
      console.log(`[TEST] Body:`, bodyString);
    }

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString('utf8');
        console.log(`[TEST] Status: ${res.statusCode}`);
        console.log(`[TEST] Response:`, responseBody.substring(0, 500));

        try {
          const data = JSON.parse(responseBody);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody,
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('[TEST] Request error:', error.message);
      reject(error);
    });

    if (bodyString) {
      req.write(bodyString);
    }

    req.end();
  });
}

// GET /api/vctc/test?endpoint=/vctc/...&method=GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const method = searchParams.get('method') || 'GET';

    if (!endpoint) {
      return NextResponse.json(
        { error: 'endpoint query parameter is required. Example: ?endpoint=/vctc/customerrules/v1/...' },
        { status: 400 }
      );
    }

    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const result = await makeRequest(method, normalizedEndpoint);

    return NextResponse.json({
      success: result.statusCode >= 200 && result.statusCode < 300,
      request: {
        method,
        endpoint: normalizedEndpoint,
        fullUrl: `https://${BASE_URL}${normalizedEndpoint}`,
      },
      response: result,
    }, { status: result.statusCode });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Request failed',
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}

// POST /api/vctc/test?endpoint=/vctc/...&method=POST
// Body: JSON payload to send to Visa API
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const method = searchParams.get('method') || 'POST';

    if (!endpoint) {
      return NextResponse.json(
        { error: 'endpoint query parameter is required. Example: ?endpoint=/vctc/customerrules/v1/...' },
        { status: 400 }
      );
    }

    // Parse request body
    let body: any = undefined;
    try {
      body = await request.json();
    } catch (e) {
      // No body or invalid JSON - that's okay for some requests
    }

    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const result = await makeRequest(method, normalizedEndpoint, body);

    return NextResponse.json({
      success: result.statusCode >= 200 && result.statusCode < 300,
      request: {
        method,
        endpoint: normalizedEndpoint,
        fullUrl: `https://${BASE_URL}${normalizedEndpoint}`,
        body,
      },
      response: result,
    }, { status: result.statusCode });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Request failed',
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}
