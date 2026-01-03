/**
 * Visa API Client
 * Handles authentication and API calls to Visa Developer APIs
 * Uses 2-way SSL authentication with certificates
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const VISA_BASE_URL = 'https://sandbox.api.visa.com';

interface VisaApiOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
}

/**
 * Load Two-Way SSL certificates
 */
function loadCertificates() {
  const certsPath = path.join(process.cwd(), 'certs');

  return {
    // Use original Two-Way SSL certificate with private key
    cert: fs.readFileSync(path.join(certsPath, 'visa_cert.pem')),
    key: fs.readFileSync(path.join(certsPath, 'visa_private_key.pem')),
    ca: [
      fs.readFileSync(path.join(certsPath, 'visa_root_ca.pem')),
      fs.readFileSync(path.join(certsPath, 'visa_intermediate_ca.pem')),
      fs.readFileSync(path.join(certsPath, 'digicert_global_root_ca.pem')),
    ],
  };
}

/**
 * Make authenticated request to Visa API using X-Pay Token + Basic Auth
 */
export async function makeVisaApiCall<T>(options: VisaApiOptions): Promise<T> {
  const { method, endpoint, data } = options;

  const certificates = loadCertificates();
  const xPayToken = process.env.VISA_XPAY_TOKEN;
  const userId = process.env.VISA_USER_ID;
  const password = process.env.VISA_PASSWORD;

  if (!xPayToken) {
    throw new Error('VISA_XPAY_TOKEN is not set in environment variables');
  }

  if (!userId) {
    throw new Error('VISA_USER_ID is not set in environment variables');
  }

  if (!password) {
    throw new Error('VISA_PASSWORD is not set in environment variables');
  }

  // Create Basic Auth with actual password
  const authString = `${userId}:${password}`;
  const basicAuth = Buffer.from(authString).toString('base64');

  const url = new URL(endpoint, VISA_BASE_URL);

  // Generate unique message ID for this request
  const messageId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  // Log for debugging
  console.log('📤 Visa API Request:', {
    method,
    endpoint,
    url: url.href,
    hasXPayToken: !!xPayToken,
    hasBasicAuth: !!basicAuth,
    hasCert: !!certificates.cert,
    hasKey: !!certificates.key,
    userId: userId.substring(0, 20) + '...',
  });

  return new Promise((resolve, reject) => {
    const requestOptions: https.RequestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
        'x-pay-token': xPayToken,
      },
      cert: certificates.cert,
      key: certificates.key,
      ca: certificates.ca,
      rejectUnauthorized: true,
    };

    const req = https.request(requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`Visa API Error: ${res.statusCode} - ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Visa API response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Visa API Request Failed: ${error.message}`));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Merchant Search API Types
 */
export interface MerchantSearchParams {
  header: {
    messageDateTime: string;
    requestMessageId: string;
    startIndex: string;
  };
  searchAttrList: {
    merchantName?: string;
    merchantCity?: string;
    merchantState?: string;
    merchantPostalCode?: string;
    merchantCountryCode: number;
    distance?: string;
    distanceUnit?: string;
    latitude?: string;
    longitude?: string;
  };
  responseAttrList: string[];
  searchOptions: {
    maxRecords: string;
    matchIndicators: string;
    matchScore: string;
  };
}

export interface VisaMerchant {
  visaMerchantId?: string;
  visaStoreName?: string;
  visaMerchantName?: string;
  visaStoreId?: string;
  merchantCity?: string;
  merchantState?: string;
  merchantPostalCode?: string;
  merchantCountryCode?: string;
  merchantStreetAddress?: string;
  latitude?: string;
  longitude?: string;
  distance?: string;
  merchantCategoryCode?: string[];
  terminalType?: string[];
}

export interface MerchantSearchResponse {
  responseData: {
    response: Array<{
      responseValues: {
        visaMerchantId?: string;
        visaStoreName?: string;
        visaMerchantName?: string;
        visaStoreId?: string;
        merchantCity?: string;
        merchantState?: string;
        merchantPostalCode?: string;
        merchantCountryCode?: string;
        merchantStreetAddress?: string;
        locationAddressLatitude?: string;
        locationAddressLongitude?: string;
        distance?: string;
        merchantCategoryCode?: string[];
      };
    }>;
    header?: any;
  };
  responseStatus?: any;
}

/**
 * Search for merchants using Visa Merchant Search API
 */
export async function searchMerchants(params: {
  latitude?: number;
  longitude?: number;
  merchantName?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  distance?: number;
  maxRecords?: number;
  startIndex?: number;
}): Promise<VisaMerchant[]> {
  // Format: YYYY-MM-DDThh:mm:ss.sss (23 characters, no Z)
  const messageDateTime = new Date().toISOString().slice(0, 23);
  const requestMessageId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const searchParams: MerchantSearchParams = {
    header: {
      messageDateTime,
      requestMessageId,
      startIndex: (params.startIndex || 0).toString(),
    },
    searchAttrList: {
      merchantCountryCode: 840, // USA
      ...(params.merchantName && { merchantName: params.merchantName }),
      ...(params.city && { merchantCity: params.city }),
      ...(params.state && { merchantState: params.state }),
      ...(params.postalCode && { merchantPostalCode: params.postalCode }),
      ...(params.latitude && { latitude: params.latitude.toString() }),
      ...(params.longitude && { longitude: params.longitude.toString() }),
      ...(params.distance && {
        distance: params.distance.toString(),
        distanceUnit: 'M', // Miles
      }),
    },
    responseAttrList: ['GNLOCATOR'],
    searchOptions: {
      maxRecords: Math.min(params.maxRecords || 25, 25).toString(),
      matchIndicators: 'true',
      matchScore: 'true',
    },
  };

  try {
    const response = await makeVisaApiCall<MerchantSearchResponse>({
      method: 'POST',
      endpoint: '/merchantsearch/v1/locator',
      data: searchParams,
    });

    const merchants = response.responseData?.response?.map(
      (r: any) => r.responseValues
    ) || [];

    return merchants;
  } catch (error) {
    console.error('Visa Merchant Search Error:', error);
    throw error;
  }
}

/**
 * Customer Profile API Types
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
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
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
 * Generate a unique Viego UID (separate from Visa's userIdentifier)
 */
export function generateViegoUID(): string {
  return `viego_${Date.now()}_${randomUUID().split('-')[0]}`;
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
 * Create a new customer profile
 * Returns both Viego UID and Visa userIdentifier
 */
export async function createCustomerProfile(
  profileData: CreateProfileRequest
): Promise<CustomerProfile> {
  // Generate our internal Viego UID
  const viegoUID = generateViegoUID();

  // Generate userIdentifier as UUID (required by Visa API)
  const visaUserIdentifier = randomUUID();

  const createPayload = {
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    userIdentifier: visaUserIdentifier,
    isProfileActive: true,
    preferredLanguage: 'en-us',
    countryCode: 'USA',
    defaultAlertsPreferences: [
      {
        contactType: 'Email',
        contactValue: profileData.email,
        preferredEmailFormat: 'Html',
        status: 'Active',
      },
      ...(profileData.phoneNumber ? [{
        contactType: 'SMS',
        contactValue: profileData.phoneNumber.replace(/[^0-9]/g, ''), // Remove formatting
        callingCode: '1',
        status: 'Active',
      }] : []),
    ],
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
 * Get or create customer profile
 * This is the main function to use - it checks if profile exists, creates if not
 */
export async function getOrCreateProfile(
  profileData: CreateProfileRequest
): Promise<{ profile: CustomerProfile; isNew: boolean }> {
  // First, try to find existing profile by email (you'd need to implement search)
  // For now, we'll attempt to create and handle duplicates

  try {
    // Try to create new profile
    const profile = await createCustomerProfile(profileData);
    return { profile, isNew: true };
  } catch (error: any) {
    // If profile already exists, retrieve it
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      // Extract userIdentifier from error or search for it
      // For now, throw error - you'd implement profile search here
      throw new Error('Profile already exists. Use retrieveCustomerProfile instead.');
    }
    throw error;
  }
}
