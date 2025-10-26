import { makeVisaApiCall } from './visaClient';
import {
  AccountNotificationsInquiryRequest,
  AccountNotificationsInquiryResponse,
  AlertPreference,
} from '@/types/visaAlerts';

interface VisaAlertPreferenceResponse {
  processingTimeinMs: number;
  receivedTimestamp: string;
  resource: Record<string, any>;
  [key: string]: any;
}

const shouldProxyToVisa = process.env.VISA_ALERTS_PROXY === 'true';

function assertProxyEnabled() {
  if (!shouldProxyToVisa) {
    throw new Error('Visa Alert Delivery proxy is disabled. Set VISA_ALERTS_PROXY=true to enable direct calls.');
  }
}

function ensureTemplate(template: string | undefined, envName: string) {
  if (!template) {
    throw new Error(`Missing ${envName}. Set ${envName} in environment variables to call Visa Alert APIs.`);
  }
  return template;
}

function buildEndpoint(template: string, documentId: string, userIdentifier: string) {
  return template
    .replace('{documentId}', encodeURIComponent(documentId))
    .replace('{userIdentifier}', encodeURIComponent(userIdentifier));
}

export function isVisaAlertsProxyEnabled() {
  return shouldProxyToVisa;
}

export async function replaceAlertPreferencesRemote(params: {
  documentId: string;
  userIdentifier: string;
  alertPreferences: AlertPreference[];
}): Promise<VisaAlertPreferenceResponse> {
  assertProxyEnabled();

  const template = ensureTemplate(process.env.VISA_ALERTS_REPLACE_TEMPLATE, 'VISA_ALERTS_REPLACE_TEMPLATE');
  const endpoint = buildEndpoint(template, params.documentId, params.userIdentifier);

  return makeVisaApiCall<VisaAlertPreferenceResponse>({
    method: 'PUT',
    endpoint,
    data: {
      alertPreferences: params.alertPreferences,
    },
  });
}

export async function addTailoredAlertPreferencesRemote(params: {
  documentId: string;
  userIdentifier: string;
  alertPreferences: AlertPreference[];
}): Promise<VisaAlertPreferenceResponse> {
  assertProxyEnabled();

  const template = ensureTemplate(process.env.VISA_ALERTS_ADD_TEMPLATE, 'VISA_ALERTS_ADD_TEMPLATE');
  const endpoint = buildEndpoint(template, params.documentId, params.userIdentifier);

  return makeVisaApiCall<VisaAlertPreferenceResponse>({
    method: 'POST',
    endpoint,
    data: {
      alertPreferences: params.alertPreferences,
    },
  });
}

export async function removeAlertPreferencesRemote(params: {
  documentId: string;
  userIdentifier: string;
  alertPreferences: AlertPreference[];
}): Promise<VisaAlertPreferenceResponse> {
  assertProxyEnabled();

  const template = ensureTemplate(process.env.VISA_ALERTS_REMOVE_TEMPLATE, 'VISA_ALERTS_REMOVE_TEMPLATE');
  const endpoint = buildEndpoint(template, params.documentId, params.userIdentifier);

  return makeVisaApiCall<VisaAlertPreferenceResponse>({
    method: 'POST',
    endpoint,
    data: {
      alertPreferences: params.alertPreferences,
    },
  });
}

export async function fetchAccountNotifications(
  requestBody: AccountNotificationsInquiryRequest
): Promise<AccountNotificationsInquiryResponse> {
  assertProxyEnabled();

  const endpoint = ensureTemplate(
    process.env.VISA_ALERTS_INQUIRY_ENDPOINT,
    'VISA_ALERTS_INQUIRY_ENDPOINT'
  );

  return makeVisaApiCall<AccountNotificationsInquiryResponse>({
    method: 'POST',
    endpoint,
    data: requestBody,
  });
}
