import { NextResponse } from 'next/server';
import {
  createPayment,
  getPaymentsByUserId,
  updatePayment,
  deletePayment,
  createReminder,
  calculateNextDueDate,
  type AutomatedPayment,
} from '@/lib/storage';
import { createPaymentMonitoringRule, deleteCustomerRules } from '@/lib/vctc-client';

/**
 * GET /api/payments?userId=xxx
 * Get all automated payments for a user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const payments = getPaymentsByUserId(userId);

    return NextResponse.json({
      success: true,
      payments,
      count: payments.length,
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments
 * Create a new automated payment
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      type,
      merchantName,
      merchantCategoryCode,
      amount,
      frequency,
      dueDay,
      dueDate,
      reminderDays = [7, 3, 1],
    } = body;

    // Validation
    if (!userId || !type || !merchantName || !amount || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, merchantName, amount, frequency' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Calculate next due date
    const now = new Date();
    let nextDueDate: string;

    if (dueDate) {
      nextDueDate = new Date(dueDate).toISOString();
    } else if (dueDay && frequency === 'monthly') {
      const next = new Date(now);
      next.setDate(dueDay);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      nextDueDate = next.toISOString();
    } else {
      nextDueDate = now.toISOString();
    }

    // Create VCTC monitoring rule
    let vctcDocumentId: string | undefined;
    try {
      console.log('[Payments API] Creating VCTC monitoring rule...');
      vctcDocumentId = await createPaymentMonitoringRule(
        merchantName,
        amount,
        merchantCategoryCode,
        frequency as 'monthly' | 'quarterly' | 'semester'
      );
      console.log('[Payments API] VCTC rule created:', vctcDocumentId);
    } catch (vctcError: any) {
      console.error('[Payments API] Failed to create VCTC rule:', vctcError.message);
      // Continue anyway - payment tracking can still work without VCTC
    }

    // Create payment record
    const payment = createPayment({
      userId,
      type,
      merchantName,
      merchantCategoryCode,
      amount,
      frequency,
      dueDay,
      dueDate,
      reminderDays,
      status: 'pending',
      nextDueDate,
      vctcDocumentId,
    });

    // Create reminders
    const reminders = reminderDays.map((days: number) => {
      const reminderDate = new Date(nextDueDate);
      reminderDate.setDate(reminderDate.getDate() - days);

      return createReminder({
        paymentId: payment.id,
        userId,
        scheduledDate: reminderDate.toISOString(),
        daysBeforeDue: days,
        sent: false,
        message: `${type === 'rent' ? '🏠' : type === 'tuition' ? '🎓' : '🚌'} Reminder: ${merchantName} payment of $${amount} due in ${days} day${days !== 1 ? 's' : ''}`,
      });
    });

    return NextResponse.json({
      success: true,
      payment,
      reminders,
      message: 'Payment created successfully',
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/payments
 * Update a payment
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Don't allow changing VCTC document ID directly
    delete updates.vctcDocumentId;

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
    });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payments?id=xxx
 * Delete a payment
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get payment to find VCTC document ID
    const payment = getPaymentsByUserId('').find(p => p.id === id);

    // Delete VCTC rule if it exists
    if (payment?.vctcDocumentId) {
      try {
        await deleteCustomerRules(payment.vctcDocumentId);
      } catch (error) {
        console.error('Error deleting VCTC rule:', error);
        // Continue with payment deletion anyway
      }
    }

    const deleted = deletePayment(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
