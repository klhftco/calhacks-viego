import { NextResponse } from 'next/server';
import { createPaymentMonitoringRule, getCustomerRules } from '@/lib/vctc-client';

/**
 * POST /api/test/customer-rules
 * Test creating a VCTC customer rule
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      merchantName = 'Test Merchant',
      amount = 100,
      merchantCategoryCode = '5999',
      frequency = 'monthly',
    } = body;

    console.log('[Test] Creating customer rule...');
    console.log('  Merchant:', merchantName);
    console.log('  Amount:', amount);
    console.log('  MCC:', merchantCategoryCode);
    console.log('  Frequency:', frequency);

    const documentId = await createPaymentMonitoringRule(
      merchantName,
      amount,
      merchantCategoryCode,
      frequency as 'monthly' | 'quarterly' | 'semester'
    );

    console.log('[Test] Rule created successfully:', documentId);

    // Try to retrieve the rule to verify it exists
    const ruleDetails = await getCustomerRules(documentId);

    return NextResponse.json({
      success: true,
      message: 'Customer rule created successfully',
      documentId,
      ruleDetails,
    });
  } catch (error: any) {
    console.error('[Test] Error creating customer rule:', error);
    console.error('[Test] Full error:', error.stack);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        hint: 'Check server logs for full error details',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test/customer-rules
 * Get info about testing customer rules
 */
export async function GET() {
  return NextResponse.json({
    message: 'Test Customer Rules Creation',
    usage: 'POST to this endpoint to test creating a VCTC customer rule',
    body: {
      merchantName: 'Test Merchant',
      amount: 100,
      merchantCategoryCode: '5999',
      frequency: 'monthly',
    },
  });
}
