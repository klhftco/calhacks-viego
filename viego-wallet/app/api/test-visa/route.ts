/**
 * Test Visa API Connection
 * Simple endpoint to verify API setup
 */

import { NextResponse } from 'next/server';
import { searchMerchants } from '@/lib/visaClient';

export async function GET() {
  console.log('🔵 TEST: API endpoint hit!');

  try {
    console.log('🔵 TEST: Attempting to call Visa API...');
    console.log('🔵 TEST: User ID:', process.env.VISA_USER_ID);
    console.log('🔵 TEST: X-Pay Token:', process.env.VISA_XPAY_TOKEN?.substring(0, 10) + '...');

    const merchants = await searchMerchants({
      latitude: 37.8715,
      longitude: -122.2730,
      distance: 5,
      maxRecords: 10,
    });

    console.log('✅ TEST: Visa API call successful!');
    console.log('✅ TEST: Found', merchants.length, 'merchants');

    return NextResponse.json({
      success: true,
      message: 'Visa API connection successful',
      merchantCount: merchants.length,
      merchants: merchants.slice(0, 3), // Return first 3 for testing
    });
  } catch (error) {
    console.error('❌ TEST: Visa API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
