import { NextResponse } from 'next/server';
import { getPaymentById, updatePayment } from '@/lib/storage';

/**
 * GET /api/payments/[id]
 * Get a specific payment by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = getPaymentById(id);

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error: any) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/payments/[id]
 * Mark payment as paid or update status
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, lastPaidDate } = body;

    const updates: any = {};
    if (status) updates.status = status;
    if (lastPaidDate) updates.lastPaidDate = lastPaidDate;

    // If marking as paid, update last paid date to now
    if (status === 'paid' && !lastPaidDate) {
      updates.lastPaidDate = new Date().toISOString();
    }

    const updatedPayment = updatePayment(id, updates);

    if (!updatedPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: status === 'paid' ? 'Payment marked as paid' : 'Payment updated',
    });
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
