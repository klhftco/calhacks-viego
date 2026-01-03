/**
 * Visa Consumer Transaction Controls (VCTC) Client
 * Handles VCTC APIs: Customer Profiles, Rules, Transactions, Alerts
 */

import { makeVisaApiCall, testVisaConnection as testVCTCConnection } from './visaBaseClient';
import { randomUUID } from 'crypto';

// Re-export test function for backwards compatibility
export { testVCTCConnection };

/**
 * Customer Profile Types
 */
export interface CustomerProfile {
  viegoUID: string; // Our internal UID
  visaUserIdentifier: string; // Visa's user identifier
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  preferences?: {
    notifications?: boolean;
    budgetAlerts?: boolean;
  };
  accountStatus: 'active' | 'inactive' | 'suspended';
}

export interface CreateProfileRequest {
  email?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userIdentifier?: string;
  preferredLanguage?: string;
  countryCode?: string;
  defaultAlertsPreferences?: Array<{
    contactType: 'Email' | 'SMS' | 'Push';
    contactValue: string;
    preferredEmailFormat?: string;
    callingCode?: string;
    status: string;
  }>;
}

export interface VisaCreateProfileResponse {
  userIdentifier: string;
  status: string;
  responseStatus?: any;
}

export interface VisaRetrieveProfileResponse {
  userIdentifier: string;
  userProfile?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
  notifications?: any[];
  responseStatus?: any;
}

/**
 * VCTC Rules Types
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
 * Transaction Simulation Types
 */
export interface SimulatedTransaction {
  primaryAccountNumber: string;
  merchantName: string;
  merchantCategoryCode: string;
  amount: number;
  cardholderBillAmount: number;
}

/**
 * Generate a unique Viego UID (separate from Visa's userIdentifier)
 */
export function generateViegoUID(): string {
  return `viego_${Date.now()}_${randomUUID().split('-')[0]}`;
}

/**
 * Create a new customer profile
 * Returns both Viego UID and Visa userIdentifier
 */
export async function createCustomerProfile(
  profileData: CreateProfileRequest
): Promise<CustomerProfile> {
  // Generate our internal Viego UID
  const viegoUID = generateViegoUID();

  // Use provided userIdentifier or generate a new UUID
  const visaUserIdentifier = profileData.userIdentifier || randomUUID();

  // Build defaultAlertsPreferences from provided data or email/phone
  let defaultAlertsPreferences = profileData.defaultAlertsPreferences;
  if (!defaultAlertsPreferences && profileData.email) {
    defaultAlertsPreferences = [
      {
        contactType: 'Email' as const,
        contactValue: profileData.email,
        preferredEmailFormat: 'Html',
        status: 'Active',
      },
      ...(profileData.phoneNumber ? [{
        contactType: 'SMS' as const,
        contactValue: profileData.phoneNumber.replace(/[^0-9]/g, ''),
        callingCode: '1',
        status: 'Active',
      }] : []),
    ];
  }

  const createPayload = {
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    userIdentifier: visaUserIdentifier,
    isProfileActive: true,
    preferredLanguage: profileData.preferredLanguage || 'en-us',
    countryCode: profileData.countryCode || 'USA',
    defaultAlertsPreferences: defaultAlertsPreferences || [],
  };

  try {
    console.log('Creating Visa customer profile:', {
      email: profileData.email,
      viegoUID,
      visaUserIdentifier,
    });

    const response = await makeVisaApiCall<any>({
      method: 'POST',
      endpoint: '/vctc/customerrules/v1/consumertransactioncontrols/customer',
      data: createPayload,
    });

    console.log('✅ Visa API Response:', response);

    // Create our internal profile object
    const profile: CustomerProfile = {
      viegoUID,
      visaUserIdentifier: response.resource?.userIdentifier || visaUserIdentifier,
      email: profileData.email,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phoneNumber: profileData.phoneNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accountStatus: 'active',
      preferences: {
        notifications: true,
        budgetAlerts: true,
      },
    };

    console.log('✅ Customer profile created:', {
      viegoUID: profile.viegoUID,
      visaUserIdentifier: profile.visaUserIdentifier,
    });

    return profile;
  } catch (error) {
    console.error('Failed to create customer profile:', error);
    throw error;
  }
}

/**
 * Get a customer profile by userIdentifier
 * Returns 404 if profile doesn't exist
 */
export async function getCustomerProfile(userIdentifier: string) {
  return makeVisaApiCall({
    method: 'GET',
    endpoint: `/vctc/customerrules/v1/consumertransactioncontrols/customer/${encodeURIComponent(userIdentifier)}`,
  });
}

/**
 * Retrieve an existing customer profile by Visa userIdentifier
 * This is used to check notifications and profile data
 */
export async function retrieveCustomerProfile(
  userIdentifier: string
): Promise<CustomerProfile> {
  const messageDateTime = new Date().toISOString().slice(0, 23);
  const requestMessageId = `RETRIEVE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log('Retrieving customer profile:', { userIdentifier });

    const response = await makeVisaApiCall<VisaRetrieveProfileResponse>({
      method: 'GET',
      endpoint: `/customerprofiles/v1/profiles/${userIdentifier}?messageDateTime=${messageDateTime}&requestMessageId=${requestMessageId}`,
    });

    // Reconstruct our CustomerProfile from Visa's response
    const profile: CustomerProfile = {
      viegoUID: (response as any).customFields?.viegoUID || `viego_legacy_${userIdentifier}`,
      visaUserIdentifier: response.userIdentifier,
      email: response.userProfile?.email,
      firstName: response.userProfile?.firstName,
      lastName: response.userProfile?.lastName,
      phoneNumber: response.userProfile?.phoneNumber,
      createdAt: (response as any).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accountStatus: 'active',
      preferences: {
        notifications: true,
        budgetAlerts: true,
      },
    };

    console.log('✅ Customer profile retrieved:', {
      viegoUID: profile.viegoUID,
      hasNotifications: response.notifications && response.notifications.length > 0,
    });

    return profile;
  } catch (error) {
    console.error('Failed to retrieve customer profile:', error);
    throw error;
  }
}

/**
 * Check if a customer profile exists by email or identifier
 */
export async function checkProfileExists(identifier: string): Promise<boolean> {
  try {
    await retrieveCustomerProfile(identifier);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get or create customer profile
 * This is the main function to use - it checks if profile exists, creates if not
 */
export async function getOrCreateProfile(
  profileData: CreateProfileRequest
): Promise<{ profile: CustomerProfile; isNew: boolean }> {
  try {
    // Try to create new profile
    const profile = await createCustomerProfile(profileData);
    return { profile, isNew: true };
  } catch (error: any) {
    // If profile already exists, retrieve it
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      throw new Error('Profile already exists. Use retrieveCustomerProfile instead.');
    }
    throw error;
  }
}

/**
 * Enroll a card (Customer Rules API - Register Card)
 * Returns control document reference for adding rules
 */
export async function enrollCard(input: {
  primaryAccountNumber: string;
  userIdentifier?: string;
}) {
  return makeVisaApiCall({
    method: 'POST',
    endpoint: '/vctc/customerrules/v1/consumertransactioncontrols',
    data: input,
  });
}

/**
 * Create customer rules (register payment monitoring)
 */
export async function createCustomerRules(
  rules: CustomerRulesRequest
): Promise<CustomerRulesResponse> {
  return makeVisaApiCall<CustomerRulesResponse>({
    method: 'POST',
    endpoint: '/vctc/customerrules/v1/consumertransactioncontrols',
    data: rules,
  });
}

/**
 * Get customer rules by document ID
 */
export async function getCustomerRules(
  documentID: string
): Promise<CustomerRulesResponse> {
  return makeVisaApiCall<CustomerRulesResponse>({
    method: 'GET',
    endpoint: `/vctc/customerrules/v1/consumertransactioncontrols/${documentID}`,
  });
}

/**
 * Update customer rules
 */
export async function updateCustomerRules(
  documentID: string,
  rules: CustomerRulesRequest
): Promise<CustomerRulesResponse> {
  return makeVisaApiCall<CustomerRulesResponse>({
    method: 'PUT',
    endpoint: `/vctc/customerrules/v1/consumertransactioncontrols/${documentID}`,
    data: rules,
  });
}

/**
 * Add or update rules on an existing control document
 */
export async function addOrUpdateRules(
  documentID: string,
  rulesPayload: any
) {
  return makeVisaApiCall<CustomerRulesResponse>({
    method: 'POST',
    endpoint: `/vctc/customerrules/v1/consumertransactioncontrols/${documentID}/rules`,
    data: rulesPayload,
  });
}

/**
 * Delete customer rules
 */
export async function deleteCustomerRules(documentID: string): Promise<any> {
  return makeVisaApiCall({
    method: 'DELETE',
    endpoint: `/vctc/customerrules/v1/consumertransactioncontrols/${documentID}`,
  });
}

/**
 * Create VCTC rule for payment monitoring
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
 * Get available merchant type controls for a card
 * Returns list of MCT_ values supported by this card
 */
export async function getMerchantTypeControls(primaryAccountNumber: string): Promise<any> {
  return makeVisaApiCall({
    method: 'POST',
    endpoint: '/vctc/customerrules/v1/merchanttypecontrols/cardinquiry',
    data: { primaryAccountNumber },
  });
}

/**
 * Get available transaction type controls for a card
 * Returns list of TCT_ values supported by this card
 */
export async function getTransactionTypeControls(primaryAccountNumber: string): Promise<any> {
  return makeVisaApiCall({
    method: 'POST',
    endpoint: '/vctc/customerrules/v1/transactiontypecontrols/cardinquiry',
    data: { primaryAccountNumber },
  });
}

/**
 * Request an authorization decision (Validation API)
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

  return makeVisaApiCall({
    method: 'POST',
    endpoint: '/vctc/validation/v1/decisions',
    data: decisionRequest,
  });
}

/**
 * Simulate a transaction (for testing VCTC rules)
 * Uses Authorization Decision API
 */
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

  return makeVisaApiCall({
    method: 'POST',
    endpoint: '/vctc/validation/v1/decisions',
    data: decisionRequest,
  });
}

/**
 * Get notifications by userIdentifier (Customer Rules API)
 */
export async function getAlertsByUser(
  userIdentifier: string,
  page: number = 1,
  limit: number = 10
) {
  return makeVisaApiCall({
    method: 'GET',
    endpoint: `/vctc/customerrules/v1/consumertransactioncontrols/customer/notifications?userIdentifier=${encodeURIComponent(userIdentifier)}&page=${page}&limit=${limit}`,
  });
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

  return makeVisaApiCall({
    method: 'POST',
    endpoint: '/vctc/customerrules/v1/consumertransactioncontrols/customer/notificationInquiry',
    data: request,
  });
}
