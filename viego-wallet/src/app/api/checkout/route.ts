import { NextResponse } from 'next/server';

type Offer = {
  id?: string;
  title?: string;
  description?: string;
  discount?: string; // e.g., "15% OFF", "$20 OFF", "FREE DELIVERY"
  minPurchase?: number;
  expiresAt?: string;
  contentId?: string;
};

function parseDiscount(amount: number, offer?: Offer): { savings: number; reason: string } {
  if (!offer || !offer.discount) return { savings: 0, reason: 'No applicable offer' };
  const text = offer.discount.trim().toUpperCase();

  // Percentage discount
  const pctMatch = text.match(/(\d{1,2})\s*%/);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    if (!isNaN(pct) && pct > 0) {
      const savings = (amount * pct) / 100;
      return { savings, reason: `${pct}% off` };
    }
  }

  // Dollar off
  const dollarMatch = text.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (dollarMatch) {
    const off = parseFloat(dollarMatch[1]);
    if (!isNaN(off) && off > 0) {
      // Respect minPurchase if defined
      if (typeof offer.minPurchase === 'number' && amount < offer.minPurchase) {
        return { savings: 0, reason: `Requires min $${offer.minPurchase}` };
      }
      return { savings: off, reason: `$${off} off` };
    }
  }

  // Free delivery heuristic
  if (text.includes('FREE DELIVERY')) {
    // Assume typical delivery fee for demo purposes
    return { savings: 5, reason: 'Free delivery' };
  }

  return { savings: 0, reason: 'Unrecognized discount' };
}

export async function POST(req: Request) {
  try {
    const { merchantId, amount, contentId, commit } = await req.json();
    if (!merchantId || typeof amount !== 'number') {
      return NextResponse.json({ error: 'merchantId and amount are required' }, { status: 400 });
    }

    // Load current spending status (to warn pre-purchase)
    const spendResp = await fetch(new URL('/api/spending-status', req.url));
    const spending = await spendResp.json();

    // Fetch offers for the merchant (optionally by contentId)
    const offersResp = await fetch(new URL('/api/visa-offers', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, contentId }),
    });
    const offersPayload = await offersResp.json();
    const offers: Offer[] = offersPayload?.offers || offersPayload?.data?.offers || offersPayload || [];

    // Choose the best savings among available offers
    let best = { savings: 0, reason: 'No offer', offer: undefined as Offer | undefined };
    for (const o of offers) {
      const { savings, reason } = parseDiscount(amount, o);
      if (savings > best.savings) {
        best = { savings, reason, offer: o };
      }
    }

    const appliedSavings = Math.min(best.savings, amount);
    const finalAmount = Math.max(0, amount - appliedSavings);

    // Optionally commit the transaction to spending totals
    let committed = false;
    if (commit === true && finalAmount > 0) {
      try {
        const commitResp = await fetch(new URL('/api/spending-status', req.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: finalAmount }),
        });
        if (commitResp.ok) committed = true;
      } catch (_) {
        // ignore commit errors for demo
      }
    }

    return NextResponse.json({
      merchantId,
      amount,
      appliedOffer: best.offer || null,
      savings: appliedSavings,
      finalAmount,
      reason: best.reason,
      nearingLimit: Boolean(spending?.nearing),
      spendingSummary: spending,
      committed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

