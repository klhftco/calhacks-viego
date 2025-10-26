import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAccountNotifications,
  isVisaAlertsProxyEnabled,
} from '@/lib/visaAlerts';
import {
  AccountNotificationsInquiryRequest,
  AccountNotificationsInquiryResponse,
} from '@/types/visaAlerts';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AccountNotificationsInquiryRequest;

  if (!body || !body.pagination) {
    return NextResponse.json(
      {
        success: false,
        error: 'pagination object with pageLimit and startIndex is required',
      },
      { status: 400 }
    );
  }

  if (!isVisaAlertsProxyEnabled()) {
    return NextResponse.json({
      success: true,
      resource: {
        notificationDetails: [],
        paginationData: {
          firstPage: true,
          lastPage: true,
          pageLimit: body.pagination.pageLimit,
          startIndex: body.pagination.startIndex,
          totalCount: 0,
          totalPages: 0,
          recordCount: 0,
        },
      },
      message: 'Visa Alert API proxy disabled. Returning empty history.',
    });
  }

  try {
    const response: AccountNotificationsInquiryResponse = await fetchAccountNotifications(body);
    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error('Alert history inquiry failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch alert history',
      },
      { status: 500 }
    );
  }
}
