export interface AlertContact {
  contactType: string;
  contactValue: string;
  callingCode?: string;
  isVerified?: boolean;
  preferredEmailFormat?: string;
  status?: string;
  [key: string]: any;
}

export interface AlertPreference {
  alertType: string;
  controlType: string;
  contacts: AlertContact[];
  status?: string;
  portfolioID?: string;
  [key: string]: any;
}

export interface AlertPreferencePayload {
  alertPreferences: AlertPreference[];
}

export interface AccountNotificationsInquiryRequest {
  pagination: {
    pageLimit: string;
    startIndex: string;
  };
  documentIds?: string[];
  includeAlertDetails?: boolean;
  includeContactDetails?: boolean;
  includeMerchantDetails?: boolean;
  paymentTokens?: string[];
  primaryAccountNumbers?: string[];
  timeRange?: {
    startTime: string;
    endTime: string;
  };
  [key: string]: any;
}

export interface NotificationDetail {
  notificationId: string;
  notificationStatus: string;
  [key: string]: any;
}

export interface AccountNotificationsInquiryResponse {
  processingTimeinMs: number;
  receivedTimestamp: string;
  resource: {
    notificationDetails: NotificationDetail[];
    paginationData?: Record<string, any>;
    [key: string]: any;
  };
  [key: string]: any;
}
