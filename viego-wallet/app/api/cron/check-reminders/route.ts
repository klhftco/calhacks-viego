import { NextResponse } from 'next/server';
import { getPendingReminders, markReminderAsSent, getPaymentById } from '@/lib/storage';

/**
 * GET /api/cron/check-reminders
 *
 * Check for pending reminders and "send" them
 * In production, this would be called by a cron job (e.g., Vercel Cron, GitHub Actions)
 * For now, it can be called manually or via setInterval on the client
 */
export async function GET() {
  try {
    const pendingReminders = getPendingReminders();

    if (pendingReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending reminders',
        count: 0,
      });
    }

    const sentReminders = [];

    for (const reminder of pendingReminders) {
      // In production, this would send a push notification, email, or SMS
      // For now, we just log it and mark as sent
      const payment = getPaymentById(reminder.paymentId);

      if (payment) {
        console.log('[Reminder] Sending:', reminder.message);
        console.log('[Reminder] Payment:', payment.merchantName, '$' + payment.amount);

        // Mark as sent
        markReminderAsSent(reminder.id);

        sentReminders.push({
          reminder,
          payment: {
            id: payment.id,
            merchantName: payment.merchantName,
            amount: payment.amount,
            dueDate: payment.nextDueDate,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentReminders.length} reminder(s)`,
      count: sentReminders.length,
      reminders: sentReminders,
    });
  } catch (error: any) {
    console.error('Error checking reminders:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
