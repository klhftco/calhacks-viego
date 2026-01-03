/**
 * MongoDB Seed Script
 * Seeds the database with demo users and data
 *
 * Usage:
 *   import { seedDatabase } from '@/lib/mongo/seed/seedDatabase';
 *   await seedDatabase();
 *
 * Or via CLI: npm run seed
 */

import { connectToDatabase } from '../connection';
import { User } from '../models/User';
import { RecurringPayment } from '../models/RecurringPayment';
import demoUsersData from './demo-users.json';
import recurringPaymentsData from './recurring-payments.json';

export interface SeedResult {
  success: boolean;
  users: number;
  payments: number;
  errors: string[];
}

interface DemoUser {
  viegoUID: string;
  userIdentifier: string;
  email: string;
  firstName: string;
  lastName: string;
  xp?: number;
  schoolName?: string;
  accountStatus?: 'active' | 'inactive' | 'suspended';
  preferences?: {
    notifications?: boolean;
    budgetAlerts?: boolean;
  };
}

interface RecurringPaymentData {
  userId: string;
  type: string;
  merchantName: string;
  merchantCategoryCode?: string;
  amount: number;
  frequency: string;
  dueDay?: number;
  dueDate?: string;
  reminderDays: number[];
  status?: string;
  nextDueDate: string;
}

const demoUsers = demoUsersData as DemoUser[];
const recurringPayments = recurringPaymentsData as RecurringPaymentData[];

/**
 * Seed MongoDB with demo data
 */
export async function seedDatabase(): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    users: 0,
    payments: 0,
    errors: [],
  };

  try {
    console.log('🌱 Seeding database...');

    // Connect to MongoDB
    await connectToDatabase();

    // Clear existing demo data (optional - be careful in production!)
    const demoEmails = demoUsers.map(u => u.email);
    const demoUIDs = demoUsers.map(u => u.viegoUID);

    await User.deleteMany({ email: { $in: demoEmails } });
    await RecurringPayment.deleteMany({ userId: { $in: demoUIDs } });
    console.log('🗑️  Cleared existing demo data');

    // Create users
    for (const userData of demoUsers) {
      try {
        const user = new User({
          viegoUID: userData.viegoUID,
          visaUserIdentifier: userData.userIdentifier,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          xp: userData.xp || 0,
          schoolName: userData.schoolName,
          accountStatus: userData.accountStatus || 'active',
          preferences: userData.preferences || {
            notifications: true,
            budgetAlerts: true,
          },
          friends: [],
          badges: [],
          monsters: [],
        });
        await user.save();

        console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
        result.users++;
      } catch (error: any) {
        const errorMsg = `Failed to create user ${userData.email}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        result.success = false;
      }
    }

    // Create recurring payments
    for (const paymentData of recurringPayments) {
      try {
        const payment = new RecurringPayment({
          userId: paymentData.userId,
          type: paymentData.type,
          merchantName: paymentData.merchantName,
          merchantCategoryCode: paymentData.merchantCategoryCode,
          amount: paymentData.amount,
          frequency: paymentData.frequency,
          dueDay: paymentData.dueDay,
          dueDate: paymentData.dueDate ? new Date(paymentData.dueDate) : undefined,
          reminderDays: paymentData.reminderDays,
          status: paymentData.status || 'active',
          nextDueDate: new Date(paymentData.nextDueDate),
        });
        await payment.save();

        console.log(`✅ Created payment: ${payment.merchantName} ($${payment.amount}) for ${payment.userId}`);
        result.payments++;
      } catch (error: any) {
        const errorMsg = `Failed to create payment ${paymentData.merchantName}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        result.success = false;
      }
    }

    console.log(`\n🎉 Database seeding complete!`);
    console.log(`   Users created: ${result.users}`);
    console.log(`   Payments created: ${result.payments}`);
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Database seeding failed:', error);
    result.success = false;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Seed only if database is empty
 */
export async function seedIfEmpty(): Promise<SeedResult | null> {
  await connectToDatabase();

  const userCount = await User.countDocuments();

  if (userCount === 0) {
    console.log('📦 Database is empty, seeding with demo data...');
    return seedDatabase();
  } else {
    console.log(`✅ Database already has ${userCount} users, skipping seed`);
    return null;
  }
}
