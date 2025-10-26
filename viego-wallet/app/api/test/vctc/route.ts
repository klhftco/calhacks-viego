import { NextResponse } from 'next/server';
import { testVCTCConnection } from '@/lib/vctc-client';

/**
 * GET /api/test/vctc
 * Test VCTC connection with Two-Way SSL
 */
export async function GET() {
  try {
    console.log('[VCTC Test] Testing connection...');

    const result = await testVCTCConnection();

    console.log('[VCTC Test] Success:', result);

    return NextResponse.json({
      success: true,
      message: 'VCTC connection successful',
      data: result,
    });
  } catch (error: any) {
    console.error('[VCTC Test] Error:', error.message);

    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'Make sure your certificates are in the correct location and .env.local is configured',
    }, { status: 500 });
  }
}
