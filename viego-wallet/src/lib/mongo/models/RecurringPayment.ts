/**
 * Recurring Payment Model
 * Represents automated/recurring payments that students need to track
 * (rent, tuition, transit passes, etc.)
 */

import mongoose, { Schema, model, models } from 'mongoose';

export interface IRecurringPayment {
  _id?: string;
  userId: string; // viegoUID reference
  type: 'rent' | 'tuition' | 'transit' | 'utilities' | 'subscriptions' | 'other';
  merchantName: string;
  merchantCategoryCode?: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'semester' | 'annual' | 'one-time';
  dueDay?: number; // Day of month (1-31) for monthly payments
  dueDate?: Date; // Specific date for one-time/semester payments
  reminderDays: number[]; // Days before due date to send reminders (e.g., [7, 3, 1])
  status: 'active' | 'paused' | 'completed';
  nextDueDate: Date;
  lastPaidDate?: Date;
  vctcDocumentId?: string; // Optional: VCTC monitoring rule ID
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringPaymentSchema = new Schema<IRecurringPayment>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['rent', 'tuition', 'transit', 'utilities', 'subscriptions', 'other'],
      required: true,
    },
    merchantName: {
      type: String,
      required: true,
      trim: true,
    },
    merchantCategoryCode: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'semester', 'annual', 'one-time'],
      required: true,
    },
    dueDay: {
      type: Number,
      min: 1,
      max: 31,
    },
    dueDate: {
      type: Date,
    },
    reminderDays: {
      type: [Number],
      default: [7, 3, 1], // Default: remind 7, 3, and 1 days before
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    nextDueDate: {
      type: Date,
      required: true,
      index: true,
    },
    lastPaidDate: {
      type: Date,
    },
    vctcDocumentId: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding upcoming payments that need reminders
RecurringPaymentSchema.index({ userId: 1, nextDueDate: 1 });
RecurringPaymentSchema.index({ status: 1, nextDueDate: 1 });

// Prevent model recompilation in development
export const RecurringPayment =
  models.RecurringPayment || model<IRecurringPayment>('RecurringPayment', RecurringPaymentSchema);
