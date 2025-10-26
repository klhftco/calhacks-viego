import { NextResponse } from 'next/server';
import { createCustomerProfile } from '@/lib/vctc-client';

// POST /api/vctc/customer-profile
// Creates a VCTC customer profile with contact preferences
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userIdentifier, firstName, lastName, preferredLanguage, countryCode, defaultAlertsPreferences } = body || {};

    if (!userIdentifier) {
      return NextResponse.json(
        { error: 'userIdentifier is required' },
        { status: 400 }
      );
    }

    const result = await createCustomerProfile({
      userIdentifier,
      firstName,
      lastName,
      preferredLanguage,
      countryCode,
      defaultAlertsPreferences,
    });
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Request failed' },
      { status: 500 }
    );
  }
}

