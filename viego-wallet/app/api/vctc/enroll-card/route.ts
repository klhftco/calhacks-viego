import { NextResponse } from 'next/server';
import { enrollCard } from '@/lib/vctc-client';

// POST /api/vctc/enroll-card
// Enrolls a PAN for a user and returns the control document reference
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { primaryAccountNumber, userIdentifier } = body || {};

    if (!primaryAccountNumber) {
      return NextResponse.json(
        { error: 'primaryAccountNumber is required' },
        { status: 400 }
      );
    }

    const result = await enrollCard({ primaryAccountNumber, userIdentifier });
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Request failed' },
      { status: 500 }
    );
  }
}

