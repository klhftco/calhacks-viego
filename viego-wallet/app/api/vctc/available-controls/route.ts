import { NextResponse } from 'next/server';
import { getMerchantTypeControls, getTransactionTypeControls } from '@/lib/vctc-client';

// GET /api/vctc/available-controls?pan=4514170000000001
// Returns available merchant and transaction controls for a card
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pan = searchParams.get('pan');

    if (!pan) {
      return NextResponse.json(
        { error: 'pan query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch both types of controls in parallel
    const [merchantControls, transactionControls] = await Promise.all([
      getMerchantTypeControls(pan).catch(err => ({ error: err.message })),
      getTransactionTypeControls(pan).catch(err => ({ error: err.message }))
    ]);

    return NextResponse.json({
      success: true,
      primaryAccountNumber: pan,
      merchantControls,
      transactionControls,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Request failed' },
      { status: 500 }
    );
  }
}
