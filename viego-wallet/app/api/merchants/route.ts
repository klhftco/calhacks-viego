/**
 * Merchant Search API Route
 * Proxies requests to Visa Merchant Search API
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchMerchants } from '@/lib/visaClient';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const merchantName = searchParams.get('merchantName');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const postalCode = searchParams.get('postalCode');
    const distance = searchParams.get('distance');
    const maxRecords = searchParams.get('maxRecords');

    // Validate and limit maxRecords to prevent API errors
    const maxRecordsValue = maxRecords ? Math.min(parseInt(maxRecords), 25) : 25;

    const params = {
      ...(latitude && { latitude: parseFloat(latitude) }),
      ...(longitude && { longitude: parseFloat(longitude) }),
      ...(merchantName && { merchantName }),
      ...(city && { city }),
      ...(state && { state }),
      ...(postalCode && { postalCode }),
      ...(distance && { distance: parseFloat(distance) }),
      maxRecords: maxRecordsValue,
    };

    const merchants = await searchMerchants(params);

    return NextResponse.json({
      success: true,
      count: merchants.length,
      merchants,
    });
  } catch (error) {
    console.error('Merchant Search API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const merchants = await searchMerchants(body);

    return NextResponse.json({
      success: true,
      count: merchants.length,
      merchants,
    });
  } catch (error) {
    console.error('Merchant Search API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
