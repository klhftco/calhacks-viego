import { NextResponse } from 'next/server';
import { getAlertHistory } from '@/lib/vctc-client';

/**
 * GET /api/test/alert-history?card=xxx
 *
 * Check alert/notification history for a card
 * This shows what transactions triggered VCTC alerts
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const primaryAccountNumber = searchParams.get('card') || '4514170000000001';
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('[Alert History] Fetching alerts for card:', primaryAccountNumber);

    const result = await getAlertHistory(primaryAccountNumber, limit);

    console.log('[Alert History] Response:', JSON.stringify(result, null, 2));

    const notifications = result.resource?.notificationDetails || [];
    const totalCount = result.resource?.paginationData?.totalCount || 0;

    // Parse notifications into a more readable format
    const alerts = notifications.map((notification: any) => {
      const payload = notification.outBoundAlertsNotificationPayload || {};
      const transactionDetails = payload.transactionDetails || {};
      const transactionOutcome = payload.transactionOutcome || {};
      const merchantInfo = transactionDetails.merchantInfo || {};

      return {
        id: notification.notificationDetailId,
        timestamp: transactionDetails.requestReceivedTimeStamp,
        merchant: {
          name: merchantInfo.name,
          mcc: merchantInfo.merchantCategoryCode,
          city: merchantInfo.city,
          state: merchantInfo.region,
        },
        transaction: {
          amount: transactionDetails.cardholderBillAmount,
          currency: transactionDetails.billerCurrencyCode,
          id: transactionDetails.transactionID,
        },
        outcome: {
          approved: transactionOutcome.transactionApproved,
          decisionId: transactionOutcome.decisionID,
          documentId: transactionOutcome.documentID,
        },
        alerts: (transactionOutcome.alertDetails || []).map((alert: any) => ({
          reason: alert.alertReason,
          ruleType: alert.ruleType,
          ruleCategory: alert.ruleCategory,
        })),
        callbackStatus: notification.outboundCallDetails?.status,
      };
    });

    return NextResponse.json({
      success: true,
      card: primaryAccountNumber.substring(0, 4) + '...' + primaryAccountNumber.substring(12),
      totalAlerts: totalCount,
      alerts,
      interpretation: totalCount === 0
        ? '📭 No alerts found. Either no transactions occurred, or no rules triggered.'
        : `📬 Found ${totalCount} alert(s). These transactions triggered VCTC rules.`,
      rawResponse: result,
    });
  } catch (error: any) {
    console.error('[Alert History] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        hint: 'Check server logs for details. Make sure VCTC credentials are configured.',
      },
      { status: 500 }
    );
  }
}
