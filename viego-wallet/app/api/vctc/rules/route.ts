import { NextResponse } from 'next/server';
import { addOrUpdateRules, createCustomerRules } from '@/lib/vctc-client';

// POST /api/vctc/rules
// Adds or updates rules on an existing control document
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentId, rules } = body || {};

    if (!rules) {
      return NextResponse.json(
        { error: 'rules are required' },
        { status: 400 }
      );
    }

    let result: any;
    if (!documentId) {
      // Create new control document
      result = await createCustomerRules(rules);
    } else {
      // Update existing document
      result = await addOrUpdateRules(documentId, rules);
    }
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Request failed' },
      { status: 500 }
    );
  }
}
