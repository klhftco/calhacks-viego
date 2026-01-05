import { NextResponse } from 'next/server';

/**
 * Simple proxy for Merchant Offers Resource Center (Visa).
 *
 * Notes:
 * - For production you should implement the exact Visa auth (mutual TLS or OAuth) per their docs.
 * - Set the following env vars in Vercel/your host or .env.local:
 *   - VISA_MOCK=true             -> returns canned offers for local dev
 *   - VISA_OFFERS_URL=<URL>      -> full Visa endpoint to forward to (optional)
 *   - VISA_API_KEY=<token>       -> token or API key used by Visa (if applicable)
 *
 * This route accepts POST JSON: { merchantId?: string, contentId?: string, mcc?: string }
 */

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { merchantId, contentId, mcc } = body || {};

  // If developer opts into mock mode or no remote URL configured, return sample offers
  const MOCK = process.env.VISA_MOCK === 'true' || !process.env.VISA_OFFERS_URL;
  if (MOCK) {
    // Return a small set of example offers; shape your UI around this
    const sample = {
      merchantId: merchantId ?? 'campus-coffee',
      offers: [
        {
          id: 'offer-1',
          title: '15% off beverages',
          description: '15% off all beverages for students',
          discount: '15% OFF',
          minPurchase: 0,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
          contentId: contentId ?? 'content-abc',
        },
      ],
      source: 'mock',
    };
    return NextResponse.json(sample);
  }

  // Forward to configured Visa endpoint. The exact request shape depends on Visa API.
  const url = process.env.VISA_OFFERS_URL!; // trust that the env var exists when not MOCK
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (process.env.VISA_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.VISA_API_KEY}`;
    }

    // Build forward payload - Visa docs will define expected query/body parameters
    const forwardBody = { merchantId, contentId, mcc };

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(forwardBody),
    });

    const text = await resp.text();
    // Try to parse JSON; if not JSON, return as text
    try {
      const json = JSON.parse(text);
      return NextResponse.json({ source: 'visa', data: json }, { status: resp.status });
    } catch (e) {
      return new NextResponse(text, { status: resp.status });
    }
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
