import fs from 'fs';
import https from 'https';
import path from 'path';

/**
 * VCTC API Client with Two-Way SSL Authentication
 * Based on working vdp-helloworld.js example
 */

const BASE_URL = 'sandbox.api.visa.com';

// Certificate paths from .env.local
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
    console.log(`[VCTC] Attempting to load cert from: ${fullPath}`);
    if (fs.existsSync(fullPath)) {
      const cert = fs.readFileSync(fullPath);
      console.log(`[VCTC] Successfully loaded cert: ${path.basename(fullPath)} (${cert.length} bytes)`);
      return cert;
    } else {
      console.warn(`[VCTC] Certificate file not found: ${fullPath}`);
    }
  } catch (error) {
    console.error(`[VCTC] Error loading cert from ${relativePath}:`, error);
  }
  return undefined;
}

/**
 * Create HTTPS agent with Two-Way SSL
 */
function createSSLAgent(): https.Agent {
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

  return new https.Agent({
    cert,
    key,
    ca: ca.length > 0 ? ca : undefined,
  });
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
 * Make VCTC API request
 */
async function makeVCTCRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
): Promise<T> {
  return new Promise((resolve, reject) => {
    const agent = createSSLAgent();
    const bodyString = body ? JSON.stringify(body) : undefined;

    const options: https.RequestOptions = {
      host: BASE_URL,
      path,
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': createAuthHeader(),
        ...(bodyString && { 'Content-Length': Buffer.byteLength(bodyString) }),
      },
      agent,
    };

    console.log(`[VCTC] ${method} https://${BASE_URL}${path}`);
    console.log(`[VCTC] Body:`, bodyString);

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk) => chunks.push(chunk));

      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString('utf8');
        console.log(`[VCTC] Status: ${res.statusCode}`);
        console.log(`[VCTC] Response body:`, responseBody.substring(0, 500));

        try {
          const data = JSON.parse(responseBody);

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            const errorMsg = data?.message || data?.errorMessage || JSON.stringify(data);
            console.error(`[VCTC] API Error Details:`, JSON.stringify(data, null, 2));
            reject(new Error(`VCTC API Error (${res.statusCode}): ${errorMsg}`));
          }
        } catch (error) {
          console.error(`[VCTC] Failed to parse response:`, responseBody);
          reject(new Error(`Failed to parse response (${res.statusCode}): ${responseBody.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[VCTC] Request error:', error.message);
      reject(error);
    });

    if (bodyString) {
      req.write(bodyString);
    }

    req.end();
  });
}

/**
 * Get a customer profile by userIdentifier
 * Returns 404 if profile doesn't exist
 */
export async function getCustomerProfile(userIdentifier: string) {
  return makeVCTCRequest(
    'GET',
    `/vctc/customerrules/v1/consumertransactioncontrols/customer/${encodeURIComponent(userIdentifier)}`
  );
}

/**
 * Create a customer profile (Alert History & Customer Profiles API)
 * Correct endpoint from Visa API Reference
 */
export async function createCustomerProfile(input: {
  userIdentifier: string;
  firstName?: string;
  lastName?: string;
  preferredLanguage?: string;
  countryCode?: string;
  isProfileActive?: boolean;
  defaultAlertsPreferences?: Array<{
    contactType: 'Email' | 'SMS' | 'Push';
    contactValue: string;
    callingCode?: string;
    preferredEmailFormat?: 'Html' | 'Plain';
    status?: string;
  }>;
}) {
  return makeVCTCRequest(
    'POST',
    '/vctc/customerrules/v1/consumertransactioncontrols/customer',
    input
  );
}

/**
 * Enroll a card (Customer Rules API - Register Card)
 * Returns control document reference for adding rules
 * Correct endpoint from Visa API Reference
 */
export async function enrollCard(input: {
  primaryAccountNumber: string;
  userIdentifier?: string;
}) {
  return makeVCTCRequest(
    'POST',
    '/vctc/customerrules/v1/consumertransactioncontrols',
    input
  );
}

/**
 * Add or update rules on an existing control document
 * Correct endpoint: POST /vctc/customerrules/v1/consumertransactioncontrols/{documentID}/rules
 */
export async function addOrUpdateRules(
  documentID: string,
  rulesPayload: any
) {
  return makeVCTCRequest<CustomerRulesResponse>(
    'POST',
    `/vctc/customerrules/v1/consumertransactioncontrols/${documentID}/rules`,
    rulesPayload
  );
}

/**
 * Request an authorization decision (Validation API)
 * Correct endpoint from Visa API Reference
 * Simplified interface - builds complete request structure internally
 */
export async function requestDecision(input: {
  primaryAccountNumber: string;
  amount: number;
  merchantName?: string;
  merchantCategoryCode?: string;
}) {
  const now = new Date();
  // Format: MMddhhmmss (10 digits exactly as per Visa API requirement)
  const dateTimeLocal =
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');

  const decisionRequest = {
    primaryAccountNumber: input.primaryAccountNumber,
    cardholderBillAmount: input.amount,
    merchantInfo: {
      name: input.merchantName || 'Test Merchant',
      merchantCategoryCode: input.merchantCategoryCode || '5999',
      transactionAmount: input.amount,
      currencyCode: '840', // USD
      city: 'San Francisco',
      region: 'CA',
      countryCode: 'USA',
      postalCode: '94102',
      addressLines: ['123 Market St'],
    },
    messageType: '0100',
    processingCode: '000000',
    decisionType: 'RECOMMENDED',
    retrievalReferenceNumber: Date.now().toString().substring(0, 12),
    transactionID: Date.now().toString(),
    dateTimeLocal,
    pointOfServiceInfo: {
      securityCondition: 'IDENTIFICATION_VERIFIED',
      terminalClass: {
        isAttended: false,
        howOperated: 'CUSTOMER_OPERATED',
        deviceLocation: 'ON_PREMISE',
      },
      presentationData: {
        isCardPresent: true,
        howPresented: 'CUSTOMER_PRESENT',
      },
      terminalEntryCapability: 'MAG_STRIPE_READ',
      terminalType: 'POS_TERMINAL',
    },
  };

  return makeVCTCRequest('POST', '/vctc/validation/v1/decisions', decisionRequest);
}

/**
 * Get notifications by userIdentifier (Customer Rules API)
 * Correct endpoint from Visa API Reference
 */
export async function getAlertsByUser(
  userIdentifier: string,
  page: number = 1,
  limit: number = 10
) {
  return makeVCTCRequest(
    'GET',
    `/vctc/customerrules/v1/consumertransactioncontrols/customer/notifications?userIdentifier=${encodeURIComponent(userIdentifier)}&page=${page}&limit=${limit}`
  );
}

/**
 * VCTC API Types
 */

export interface MerchantControl {
  controlType: string; // REQUIRED: Must be MCT_ value (e.g., MCT_DINING, MCT_GAMBLING, MCT_GROCERY)
  isControlEnabled: boolean; // REQUIRED
  shouldDeclineAll?: boolean;
  shouldAlertOnDecline?: boolean;
  alertThreshold?: number;
  declineThreshold?: number;
  userIdentifier?: string;
  currencyCode?: string; // ISO 8583 three-digit code (e.g., "840" for USD)
  spendLimit?: {
    type?: 'LMT_MONTH' | 'LMT_WEEK' | 'LMT_DAY' | 'LMT_RECURRING';
    recurringCycleTime?: number; // Days for LMT_RECURRING
    alertThreshold?: string;
    declineThreshold?: string;
    currentPeriodSpend?: string;
  };
}

export interface TransactionControl {
  controlType: string; // e.g., "TCT_AUTO_PAY", "TCT_ATM_WITHDRAW"
  isControlEnabled: boolean;
  shouldDeclineAll: boolean;
  shouldAlertOnDecline?: boolean;
  alertThreshold?: number;
  declineThreshold?: number;
}

export interface GlobalControls {
  isControlEnabled: boolean;
  shouldDeclineAll: boolean;
  shouldAlertOnDecline?: boolean;
  alertThreshold?: number;
  declineThreshold?: number;
}

export interface CustomerRulesRequest {
  globalControls?: GlobalControls;
  merchantControls?: MerchantControl[];
  transactionControls?: TransactionControl[];
}

export interface CustomerRulesResponse {
  receivedTimestamp: string;
  resource: {
    documentID: string;
    lastUpdateTimeStamp: string;
    globalControls?: GlobalControls;
    merchantControls?: MerchantControl[];
    transactionControls?: TransactionControl[];
  };
  processingTimeinMs: number;
}

/**
 * Get available merchant type controls for a card
 * Returns list of MCT_ values supported by this card
 */
export async function getMerchantTypeControls(primaryAccountNumber: string): Promise<any> {
  return makeVCTCRequest(
    'POST',
    '/vctc/customerrules/v1/merchanttypecontrols/cardinquiry',
    { primaryAccountNumber }
  );
}

/**
 * Get available transaction type controls for a card
 * Returns list of TCT_ values supported by this card
 */
export async function getTransactionTypeControls(primaryAccountNumber: string): Promise<any> {
  return makeVCTCRequest(
    'POST',
    '/vctc/customerrules/v1/transactiontypecontrols/cardinquiry',
    { primaryAccountNumber }
  );
}

/**
 * Test VCTC connection with Hello World
 */
export async function testVCTCConnection(): Promise<any> {
  return makeVCTCRequest('GET', '/vdp/helloworld');
}

/**
 * Create customer rules (register payment monitoring)
 */
export async function createCustomerRules(
  rules: CustomerRulesRequest
): Promise<CustomerRulesResponse> {
  return makeVCTCRequest<CustomerRulesResponse>(
    'POST',
    '/vctc/customerrules/v1/consumertransactioncontrols',
    rules
  );
}

/**
 * Get customer rules by document ID
 */
export async function getCustomerRules(
  documentID: string
): Promise<CustomerRulesResponse> {
  return makeVCTCRequest<CustomerRulesResponse>(
    'GET',
    `/vctc/customerrules/v1/consumertransactioncontrols/${documentID}`
  );
}

/**
 * Update customer rules
 */
export async function updateCustomerRules(
  documentID: string,
  rules: CustomerRulesRequest
): Promise<CustomerRulesResponse> {
  return makeVCTCRequest<CustomerRulesResponse>(
    'PUT',
    `/vctc/customerrules/v1/consumertransactioncontrols/${documentID}`,
    rules
  );
}

/**
 * Delete customer rules
 */
export async function deleteCustomerRules(documentID: string): Promise<any> {
  return makeVCTCRequest(
    'DELETE',
    `/vctc/customerrules/v1/consumertransactioncontrols/${documentID}`
  );
}

/**
 * Create VCTC rule for payment monitoring
 * @param controlType - MCT_ value (e.g., MCT_DINING, MCT_GROCERY, MCT_GAMBLING)
 * @param amount - Alert threshold amount
 * @param userIdentifier - Optional user identifier
 * @param frequency - Optional frequency for spend limit tracking
 */
export async function createPaymentMonitoringRule(
  controlType: string,
  amount: number,
  userIdentifier?: string,
  frequency?: 'monthly' | 'quarterly' | 'semester'
): Promise<string> {
  const spendLimit: any = {
    alertThreshold: amount.toFixed(2),
    declineThreshold: (amount * 1.1).toFixed(2), // 10% buffer
  };

  // Set spend limit type based on frequency
  if (frequency === 'monthly') {
    spendLimit.type = 'LMT_RECURRING';
    spendLimit.recurringCycleTime = 30;
  } else if (frequency === 'quarterly') {
    spendLimit.type = 'LMT_RECURRING';
    spendLimit.recurringCycleTime = 90;
  } else {
    spendLimit.type = 'LMT_MONTH';
  }

  const merchantControl: MerchantControl = {
    controlType, // REQUIRED: MCT_ value
    isControlEnabled: true, // REQUIRED
    shouldDeclineAll: false,
    alertThreshold: amount,
    declineThreshold: amount * 1.1,
    userIdentifier,
    spendLimit,
  };

  const response = await createCustomerRules({
    merchantControls: [merchantControl],
  });

  return response.resource.documentID;
}

/**
 * Simulate a transaction (for testing VCTC rules)
 * Uses Authorization Decision API
 */
export interface SimulatedTransaction {
  primaryAccountNumber: string;
  merchantName: string;
  merchantCategoryCode: string;
  amount: number;
  cardholderBillAmount: number;
}

export async function simulateTransaction(
  transaction: SimulatedTransaction
): Promise<any> {
  const now = new Date();
  // Format: MMddhhmmss (10 digits exactly as per Visa API requirement)
  const dateTimeLocal =
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');

  const decisionRequest = {
    primaryAccountNumber: transaction.primaryAccountNumber,
    cardholderBillAmount: transaction.cardholderBillAmount,
    merchantInfo: {
      name: transaction.merchantName,
      merchantCategoryCode: transaction.merchantCategoryCode,
      transactionAmount: transaction.amount,
      currencyCode: '840', // USD
      city: 'San Francisco',
      region: 'CA',
      countryCode: 'USA',
      postalCode: '94102',
      addressLines: ['123 Market St'],
    },
    messageType: '0100',
    processingCode: '000000',
    decisionType: 'RECOMMENDED',
    retrievalReferenceNumber: Date.now().toString().substring(0, 12),
    transactionID: Date.now().toString(),
    dateTimeLocal,
    pointOfServiceInfo: {
      securityCondition: 'IDENTIFICATION_VERIFIED',
      terminalClass: {
        isAttended: false,
        howOperated: 'CUSTOMER_OPERATED',
        deviceLocation: 'ON_PREMISE',
      },
      presentationData: {
        isCardPresent: true,
        howPresented: 'CUSTOMER_PRESENT',
      },
      terminalEntryCapability: 'MAG_STRIPE_READ',
      terminalType: 'POS_TERMINAL',
    },
  };

  return makeVCTCRequest('POST', '/vctc/validation/v1/decisions', decisionRequest);
}

/**
 * Get alert history for an account
 * Uses Notification Inquiry API
 */
export async function getAlertHistory(
  primaryAccountNumber: string,
  pageLimit: number = 10
): Promise<any> {
  const request = {
    primaryAccountNumber,
    includeAlertDetails: true,
    includeMerchantDetails: true,
    includeContactDetails: false,
    pagination: {
      pageLimit: pageLimit.toString(),
      startIndex: '1',
    },
  };

  return makeVCTCRequest(
    'POST',
    '/vctc/customerrules/v1/consumertransactioncontrols/customer/notificationInquiry',
    request
  );
}
