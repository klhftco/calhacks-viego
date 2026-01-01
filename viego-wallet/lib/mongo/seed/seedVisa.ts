/**
 * Visa API Seed Script
 * Creates demo users in Visa VCTC API with rules and test transactions
 *
 * This is separate from MongoDB seeding because:
 * 1. Visa API is external (can't be "seeded" locally)
 * 2. May fail due to API limits/errors
 * 3. Should be run separately in demo environments
 */

import demoUsers from './demo-users.json';
import vctcRules from './vctc-rules.json';
import testTransactions from './test-transactions.json';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface VisaSeedResult {
  success: boolean;
  users: {
    [key: string]: {
      profile: string;
      documentID?: string;
      rules?: string;
      transactions: number;
      errors: string[];
    };
  };
}

async function callApi(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API Error: ${data.error || res.statusText}`);
  }
  return data;
}

/**
 * Seed Visa VCTC API with demo data
 */
export async function seedVisaAPI(): Promise<VisaSeedResult> {
  const result: VisaSeedResult = {
    success: true,
    users: {},
  };

  console.log('🌱 Seeding Visa VCTC API...\n');

  for (const user of demoUsers) {
    const userResult = {
      profile: 'pending',
      transactions: 0,
      errors: [] as string[],
    };

    result.users[user.userIdentifier] = userResult;

    try {
      // 1. Create VCTC customer profile
      console.log(`👤 Creating profile for ${user.firstName} ${user.lastName}...`);
      await callApi('/api/vctc/customer-profile', {
        method: 'POST',
        body: JSON.stringify({
          userIdentifier: user.userIdentifier,
          firstName: user.firstName,
          lastName: user.lastName,
          preferredLanguage: 'en-us',
          countryCode: 'USA',
          defaultAlertsPreferences: [
            {
              contactType: 'Email',
              contactValue: user.email,
              preferredEmailFormat: 'Html',
              status: 'Active',
            },
          ],
        }),
      });
      userResult.profile = 'created';

      // 2. Enroll card
      console.log(`💳 Enrolling card ${user.pan}...`);
      const enrollResult = await callApi('/api/vctc/enroll-card', {
        method: 'POST',
        body: JSON.stringify({
          primaryAccountNumber: user.pan,
          userIdentifier: user.userIdentifier,
        }),
      });
      userResult.documentID =
        enrollResult.result?.resource?.documentID || enrollResult.result?.documentID;

      // 3. Get available controls
      console.log(`🔍 Checking available controls...`);
      const controlsResult = await callApi(
        `/api/vctc/available-controls?pan=${encodeURIComponent(user.pan)}`
      );

      const availableControls =
        controlsResult.merchantControls?.resource?.availableMerchantTypeRules || [];

      // 4. Set rules from JSON config
      const userRules = (vctcRules as any)[user.userIdentifier];
      if (userRules && userRules.merchantControls) {
        console.log(`⚙️  Setting transaction control rules...`);

        const rules: any = { merchantControls: [] };

        for (const ruleConfig of userRules.merchantControls) {
          // Find matching control type from available controls
          const matchingControl = availableControls.find((c: any) =>
            c.name.includes(ruleConfig.type)
          );

          if (matchingControl) {
            rules.merchantControls.push({
              controlType: matchingControl.name,
              isControlEnabled: ruleConfig.isControlEnabled,
              shouldDeclineAll: ruleConfig.shouldDeclineAll,
              alertThreshold: ruleConfig.alertThreshold,
              declineThreshold: ruleConfig.declineThreshold,
              userIdentifier: user.userIdentifier,
            });
          } else {
            console.warn(`⚠️  Control type ${ruleConfig.type} not available for this card`);
          }
        }

        if (rules.merchantControls.length > 0) {
          await callApi('/api/vctc/rules', {
            method: 'POST',
            body: JSON.stringify({ documentId: userResult.documentID, rules }),
          });
          userResult.rules = 'configured';
        }
      }

      // 5. Simulate test transactions
      const transactions = (testTransactions as any)[user.userIdentifier] || [];
      console.log(`🧪 Simulating ${transactions.length} test transactions...`);

      for (const tx of transactions) {
        try {
          await callApi('/api/vctc/decision', {
            method: 'POST',
            body: JSON.stringify({
              primaryAccountNumber: user.pan,
              amount: tx.amount,
              merchantName: tx.merchantName,
              merchantCategoryCode: tx.merchantCategoryCode,
            }),
          });
          userResult.transactions++;
          await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limit
        } catch (error: any) {
          userResult.errors.push(`Transaction failed: ${tx.merchantName} - ${error.message}`);
        }
      }

      console.log(`✅ ${user.firstName} complete: ${userResult.transactions}/${transactions.length} transactions\n`);

    } catch (error: any) {
      console.error(`❌ Failed to seed ${user.firstName}:`, error.message);
      userResult.errors.push(error.message);
      result.success = false;
    }
  }

  console.log('🎉 Visa API seeding complete!\n');
  return result;
}
