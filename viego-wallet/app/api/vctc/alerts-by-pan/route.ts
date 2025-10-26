import { NextResponse } from 'next/server';
import { getAlertHistory } from '@/lib/vctc-client';

// GET /api/vctc/alerts-by-pan?pan=4514170000000001&limit=10
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pan = searchParams.get('pan');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!pan) {
      return NextResponse.json(
        { error: 'pan is required' },
        { status: 400 }
      );
    }

    const result = await getAlertHistory(pan, limit);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Request failed' },
      { status: 500 }
    );
  }
}

