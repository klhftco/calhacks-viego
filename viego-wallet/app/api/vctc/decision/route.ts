import { NextResponse } from 'next/server';
import { requestDecision } from '@/lib/vctc-client';

// POST /api/vctc/decision
// Requests an authorization decision to simulate a transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { primaryAccountNumber, amount, merchantName, merchantCategoryCode } = body || {};

    if (!primaryAccountNumber || amount === undefined) {
      return NextResponse.json(
        { error: 'primaryAccountNumber and amount are required' },
        { status: 400 }
      );
    }

    const result = await requestDecision({
      primaryAccountNumber,
      amount,
      merchantName,
      merchantCategoryCode
    });
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Request failed' },
      { status: 500 }
    );
  }
}

