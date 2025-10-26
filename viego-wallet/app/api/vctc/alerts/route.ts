import { NextResponse } from 'next/server';
import { getAlertsByUser } from '@/lib/vctc-client';

// GET /api/vctc/alerts?userIdentifier=demo-user-001
// Fetch alert history by userIdentifier
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdentifier = searchParams.get('userIdentifier');

    if (!userIdentifier) {
      return NextResponse.json(
        { error: 'userIdentifier is required' },
        { status: 400 }
      );
    }

    const result = await getAlertsByUser(userIdentifier);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Request failed' },
      { status: 500 }
    );
  }
}

