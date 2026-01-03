/**
 * Visa Merchant Client
 * Handles Visa Merchant Search API
 */

import { makeVisaApiCall } from './visaBaseClient';

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
