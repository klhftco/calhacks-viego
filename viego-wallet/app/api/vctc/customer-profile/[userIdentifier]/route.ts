import { NextResponse } from 'next/server';
import { getCustomerProfile } from '@/lib/vctc-client';

// GET /api/vctc/customer-profile/[userIdentifier]
// Retrieves a customer profile by userIdentifier
export async function GET(
  request: Request,
  { params }: { params: { userIdentifier: string } }
) {
  try {
    const userIdentifier = params.userIdentifier;

    if (!userIdentifier) {
      return NextResponse.json(
        { error: 'userIdentifier is required' },
        { status: 400 }
      );
    }

    const result = await getCustomerProfile(userIdentifier);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    // 404 means profile doesn't exist
    if (err?.message?.includes('404')) {
      return NextResponse.json(
        { success: false, exists: false, error: 'Profile not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: err?.message || 'Request failed' },
      { status: 500 }
    );
  }
}
