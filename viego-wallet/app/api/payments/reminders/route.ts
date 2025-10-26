import { NextResponse } from 'next/server';
import { getPendingReminders, markReminderAsSent, getRemindersByPaymentId } from '@/lib/storage';

/**
 * GET /api/payments/reminders?paymentId=xxx
 * Get reminders for a specific payment, or all pending reminders
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const pending = searchParams.get('pending') === 'true';

    let reminders;
    if (paymentId) {
      reminders = getRemindersByPaymentId(paymentId);
    } else if (pending) {
      reminders = getPendingReminders();
    } else {
      return NextResponse.json(
        { error: 'Either paymentId or pending=true must be specified' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reminders,
      count: reminders.length,
    });
  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/reminders/send
 * Manually mark reminder as sent (for testing)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reminderId } = body;

    if (!reminderId) {
      return NextResponse.json(
        { error: 'reminderId is required' },
        { status: 400 }
      );
    }

    const sent = markReminderAsSent(reminderId);

    if (!sent) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder marked as sent',
    });
  } catch (error: any) {
    console.error('Error marking reminder as sent:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
