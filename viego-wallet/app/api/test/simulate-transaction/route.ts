import { NextResponse } from 'next/server';
import { simulateTransaction, getCustomerRules } from '@/lib/vctc-client';
import { getPaymentById } from '@/lib/storage';

/**
 * POST /api/test/simulate-transaction
 *
 * Simulate a transaction to test if VCTC monitoring rule triggers
 * This uses the Authorization Decision API to test your rules
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      paymentId,
      primaryAccountNumber = '4514170000000001', // Visa test card
      amountOverride,
    } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400 }
      );
    }

    // Get the payment details
    const payment = getPaymentById(paymentId);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (!payment.vctcDocumentId) {
      return NextResponse.json(
        {
          error: 'Payment does not have a VCTC rule',
          hint: 'The payment was created without VCTC integration. This happens when the VCTC API fails during payment creation.',
        },
        { status: 400 }
      );
    }

    // Get the VCTC rule to verify it exists
    console.log('[Simulate] Checking VCTC rule:', payment.vctcDocumentId);
    try {
      const ruleDetails = await getCustomerRules(payment.vctcDocumentId);
      console.log('[Simulate] Rule found:', JSON.stringify(ruleDetails, null, 2));
    } catch (error: any) {
      console.error('[Simulate] Failed to get rule:', error.message);
      return NextResponse.json(
        {
          error: 'VCTC rule not found',
          hint: 'The rule may have been deleted or never created properly',
          vctcDocumentId: payment.vctcDocumentId,
        },
        { status: 404 }
      );
    }

    // Simulate the transaction
    const transactionAmount = amountOverride || payment.amount;

    console.log('[Simulate] Simulating transaction:');
    console.log('  - Merchant:', payment.merchantName);
    console.log('  - Amount:', transactionAmount);
    console.log('  - MCC:', payment.merchantCategoryCode);
    console.log('  - Card:', primaryAccountNumber);

    const result = await simulateTransaction({
      primaryAccountNumber,
      merchantName: payment.merchantName,
      merchantCategoryCode: payment.merchantCategoryCode || '5999',
      amount: transactionAmount,
      cardholderBillAmount: transactionAmount,
    });

    console.log('[Simulate] Result:', JSON.stringify(result, null, 2));

    // Parse the result
    const decisionResponse = result.resource?.decisionResponse;
    const shouldDecline = decisionResponse?.shouldDecline || false;
    const declineReason = decisionResponse?.declineRuleType;

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        merchantName: payment.merchantName,
        amount: payment.amount,
        vctcDocumentId: payment.vctcDocumentId,
      },
      simulatedTransaction: {
        merchantName: payment.merchantName,
        amount: transactionAmount,
        card: primaryAccountNumber.substring(0, 4) + '...' + primaryAccountNumber.substring(12),
      },
      decision: {
        shouldDecline,
        declineReason: declineReason || 'N/A',
        decisionId: result.resource?.decisionID,
        timestamp: result.receivedTimestamp,
      },
      interpretation: shouldDecline
        ? '❌ Transaction would be DECLINED by VCTC rule'
        : '✅ Transaction would be APPROVED (alert may still trigger)',
      rawResponse: result,
    });
  } catch (error: any) {
    console.error('[Simulate] Error:', error);
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

/**
 * GET /api/test/simulate-transaction?paymentId=xxx
 *
 * Get form to simulate transaction
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('paymentId');

  if (!paymentId) {
    return NextResponse.json({
      message: 'Simulate Transaction Test',
      usage: 'POST to this endpoint with: { "paymentId": "pay_xxx", "primaryAccountNumber": "4514170000000001" }',
      hint: 'This will simulate a transaction matching your payment to test if VCTC rule triggers',
    });
  }

  const payment = getPaymentById(paymentId);
  if (!payment) {
    return NextResponse.json(
      { error: 'Payment not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    payment: {
      id: payment.id,
      merchantName: payment.merchantName,
      amount: payment.amount,
      merchantCategoryCode: payment.merchantCategoryCode,
      vctcDocumentId: payment.vctcDocumentId,
    },
    instructions: {
      method: 'POST',
      endpoint: '/api/test/simulate-transaction',
      body: {
        paymentId: payment.id,
        primaryAccountNumber: '4514170000000001', // Optional, defaults to test card
        amountOverride: payment.amount, // Optional, test with different amount
      },
    },
  });
}
