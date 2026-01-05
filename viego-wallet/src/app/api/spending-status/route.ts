import { NextResponse } from 'next/server';

/**
 * Simple demo spending-status API.
 * GET returns current mock spending summary.
 * POST { amount } will (for demo) increment an in-memory total (ephemeral).
 *
 * In production: persist per-user spending in DB and secure endpoints with auth.
 */

let totalSpent = 82.0; // demo in-memory value
const monthlyLimit = 100.0; // demo limit

export async function GET() {
  const remaining = Math.max(0, monthlyLimit - totalSpent);
  const percent = Math.min(1, totalSpent / monthlyLimit);
  const nearing = percent >= (parseFloat(process.env.NEARING_THRESHOLD ?? '0.8'));

  return NextResponse.json({
    limit: monthlyLimit,
    spent: totalSpent,
    remaining,
    percent,
    nearing,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount } = body as { amount?: number };
    if (typeof amount === 'number') {
      totalSpent += amount;
      return NextResponse.json({ ok: true, spent: totalSpent });
    }
    return NextResponse.json({ error: 'missing amount' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
