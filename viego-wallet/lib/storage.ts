import fs from 'fs';
import path from 'path';

/**
 * Local JSON file-based storage
 * Will be replaced with MongoDB later
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const REMINDERS_FILE = path.join(DATA_DIR, 'reminders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(PAYMENTS_FILE)) {
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(REMINDERS_FILE)) {
  fs.writeFileSync(REMINDERS_FILE, JSON.stringify([], null, 2));
}

export interface AutomatedPayment {
  id: string;
  userId: string;
  type: 'rent' | 'tuition' | 'transit' | 'other';
  merchantName: string;
  merchantCategoryCode?: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'semester' | 'annual' | 'one-time';
  dueDay?: number; // Day of month (1-31) for monthly payments
  dueDate?: string; // Specific date for one-time/semester payments
  reminderDays: number[]; // Days before to send reminders (e.g., [7, 3, 1])
  status: 'pending' | 'paid' | 'overdue';
  nextDueDate: string; // ISO date string
  lastPaidDate?: string; // ISO date string
  vctcDocumentId?: string; // ID from VCTC API
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReminder {
  id: string;
  paymentId: string;
  userId: string;
  scheduledDate: string; // ISO date string
  daysBeforeDue: number;
  sent: boolean;
  sentAt?: string;
  message: string;
  createdAt: string;
}

/**
 * Read payments from JSON file
 */
export function readPayments(): AutomatedPayment[] {
  try {
    const data = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading payments:', error);
    return [];
  }
}

/**
 * Write payments to JSON file
 */
export function writePayments(payments: AutomatedPayment[]): void {
  try {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
  } catch (error) {
    console.error('Error writing payments:', error);
    throw error;
  }
}

/**
 * Get payment by ID
 */
export function getPaymentById(id: string): AutomatedPayment | null {
  const payments = readPayments();
  return payments.find(p => p.id === id) || null;
}

/**
 * Get payments by user ID
 */
export function getPaymentsByUserId(userId: string): AutomatedPayment[] {
  const payments = readPayments();
  return payments.filter(p => p.userId === userId);
}

/**
 * Create new payment
 */
export function createPayment(payment: Omit<AutomatedPayment, 'id' | 'createdAt' | 'updatedAt'>): AutomatedPayment {
  const payments = readPayments();
  const newPayment: AutomatedPayment = {
    ...payment,
    id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  payments.push(newPayment);
  writePayments(payments);
  return newPayment;
}

/**
 * Update payment
 */
export function updatePayment(id: string, updates: Partial<AutomatedPayment>): AutomatedPayment | null {
  const payments = readPayments();
  const index = payments.findIndex(p => p.id === id);
  if (index === -1) return null;

  payments[index] = {
    ...payments[index],
    ...updates,
    id: payments[index].id, // Prevent ID change
    updatedAt: new Date().toISOString(),
  };
  writePayments(payments);
  return payments[index];
}

/**
 * Delete payment
 */
export function deletePayment(id: string): boolean {
  const payments = readPayments();
  const filtered = payments.filter(p => p.id !== id);
  if (filtered.length === payments.length) return false;
  writePayments(filtered);
  return true;
}

/**
 * Read reminders from JSON file
 */
export function readReminders(): PaymentReminder[] {
  try {
    const data = fs.readFileSync(REMINDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading reminders:', error);
    return [];
  }
}

/**
 * Write reminders to JSON file
 */
export function writeReminders(reminders: PaymentReminder[]): void {
  try {
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
  } catch (error) {
    console.error('Error writing reminders:', error);
    throw error;
  }
}

/**
 * Create reminder
 */
export function createReminder(reminder: Omit<PaymentReminder, 'id' | 'createdAt'>): PaymentReminder {
  const reminders = readReminders();
  const newReminder: PaymentReminder = {
    ...reminder,
    id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  reminders.push(newReminder);
  writeReminders(reminders);
  return newReminder;
}

/**
 * Get pending reminders (not yet sent, scheduled for today or earlier)
 */
export function getPendingReminders(): PaymentReminder[] {
  const reminders = readReminders();
  const now = new Date();
  return reminders.filter(r => {
    if (r.sent) return false;
    const scheduledDate = new Date(r.scheduledDate);
    return scheduledDate <= now;
  });
}

/**
 * Mark reminder as sent
 */
export function markReminderAsSent(id: string): boolean {
  const reminders = readReminders();
  const index = reminders.findIndex(r => r.id === id);
  if (index === -1) return false;

  reminders[index].sent = true;
  reminders[index].sentAt = new Date().toISOString();
  writeReminders(reminders);
  return true;
}

/**
 * Get reminders for a specific payment
 */
export function getRemindersByPaymentId(paymentId: string): PaymentReminder[] {
  const reminders = readReminders();
  return reminders.filter(r => r.paymentId === paymentId);
}

/**
 * Calculate next due date based on frequency
 */
export function calculateNextDueDate(payment: AutomatedPayment, fromDate?: Date): string {
  const base = fromDate || new Date();
  const result = new Date(base);

  switch (payment.frequency) {
    case 'monthly':
      result.setMonth(result.getMonth() + 1);
      if (payment.dueDay) {
        result.setDate(payment.dueDay);
      }
      break;
    case 'quarterly':
      result.setMonth(result.getMonth() + 3);
      break;
    case 'semester':
      result.setMonth(result.getMonth() + 6);
      break;
    case 'annual':
      result.setFullYear(result.getFullYear() + 1);
      break;
    case 'one-time':
      return payment.dueDate || result.toISOString();
  }

  return result.toISOString();
}
