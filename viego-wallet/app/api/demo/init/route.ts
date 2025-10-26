import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const BAILEY = {
  userIdentifier: 'bailey-student-001',
  firstName: 'Bailey',
  lastName: 'Chen',
  email: 'bailey@university.edu',
  pan: '4514170000000001',
};

const OLIVER = {
  userIdentifier: 'oliver-student-002',
  firstName: 'Oliver',
  lastName: 'Martinez',
  email: 'oliver@university.edu',
  pan: '4514170000000002',
};

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

async function setupUser(user: typeof BAILEY) {
  const results: any = {
    profile: null,
    documentID: null,
    controls: [],
    transactions: [],
  };

  try {
    // 1. Create profile
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
    results.profile = 'created';

    // 2. Enroll card
    const enrollResult = await callApi('/api/vctc/enroll-card', {
      method: 'POST',
      body: JSON.stringify({
        primaryAccountNumber: user.pan,
        userIdentifier: user.userIdentifier,
      }),
    });
    results.documentID =
      enrollResult.result?.resource?.documentID || enrollResult.result?.documentID;

    // 3. Check available controls
    const controlsResult = await callApi(
      `/api/vctc/available-controls?pan=${encodeURIComponent(user.pan)}`
    );
    results.controls =
      controlsResult.merchantControls?.resource?.availableMerchantTypeRules?.map(
        (c: any) => c.name
      ) || [];

    // 4. Set rules
    if (user.userIdentifier === BAILEY.userIdentifier) {
      const rules: any = { merchantControls: [] };

      const alcoholControl = results.controls.find((c: string) => c.includes('ALCOHOL'));
      const gamblingControl = results.controls.find((c: string) => c.includes('GAMBLING'));
      const groceryControl = results.controls.find((c: string) => c.includes('GROCERY'));

      if (alcoholControl) {
        rules.merchantControls.push({
          controlType: alcoholControl,
          isControlEnabled: true,
          shouldDeclineAll: true,
          userIdentifier: user.userIdentifier,
        });
      }

      if (gamblingControl) {
        rules.merchantControls.push({
          controlType: gamblingControl,
          isControlEnabled: true,
          shouldDeclineAll: true,
          userIdentifier: user.userIdentifier,
        });
      }

      if (groceryControl) {
        rules.merchantControls.push({
          controlType: groceryControl,
          isControlEnabled: true,
          shouldDeclineAll: false,
          alertThreshold: 150,
          declineThreshold: 200,
          userIdentifier: user.userIdentifier,
        });
      }

      if (rules.merchantControls.length > 0) {
        await callApi('/api/vctc/rules', {
          method: 'POST',
          body: JSON.stringify({ documentId: results.documentID, rules }),
        });
      }
    } else {
      // Oliver's rules
      const rules: any = { merchantControls: [] };

      const adultEntControl = results.controls.find((c: string) => c.includes('ADULT_ENTERTAINMENT'));
      const electronicsControl = results.controls.find((c: string) => c.includes('ELECTRONICS'));
      const apparelControl = results.controls.find((c: string) => c.includes('APPAREL'));

      if (adultEntControl) {
        rules.merchantControls.push({
          controlType: adultEntControl,
          isControlEnabled: true,
          shouldDeclineAll: false,
          alertThreshold: 50,
          declineThreshold: 100,
          userIdentifier: user.userIdentifier,
        });
      }

      if (electronicsControl) {
        rules.merchantControls.push({
          controlType: electronicsControl,
          isControlEnabled: true,
          shouldDeclineAll: false,
          alertThreshold: 100,
          declineThreshold: 150,
          userIdentifier: user.userIdentifier,
        });
      }

      if (apparelControl) {
        rules.merchantControls.push({
          controlType: apparelControl,
          isControlEnabled: true,
          shouldDeclineAll: false,
          alertThreshold: 75,
          declineThreshold: 125,
          userIdentifier: user.userIdentifier,
        });
      }

      if (rules.merchantControls.length > 0) {
        await callApi('/api/vctc/rules', {
          method: 'POST',
          body: JSON.stringify({ documentId: results.documentID, rules }),
        });
      }
    }

    results.rules = 'configured';

    // 5. Simulate transactions
    const transactions = user.userIdentifier === BAILEY.userIdentifier
      ? [
          { amount: 45.0, merchantName: 'Whole Foods', merchantCategoryCode: '5411' },
          { amount: 62.50, merchantName: 'Safeway', merchantCategoryCode: '5411' },
          { amount: 89.99, merchantName: 'Costco', merchantCategoryCode: '5411' },
          { amount: 28.0, merchantName: 'Trader Joes', merchantCategoryCode: '5411' },
          { amount: 42.0, merchantName: 'Target Groceries', merchantCategoryCode: '5411' },
          { amount: 25.0, merchantName: 'Liquor Store', merchantCategoryCode: '5921' },
          { amount: 35.0, merchantName: 'Wine Shop', merchantCategoryCode: '5921' },
          { amount: 50.0, merchantName: 'Casino Royale', merchantCategoryCode: '7995' },
        ]
      : [
          { amount: 35.0, merchantName: 'Best Buy', merchantCategoryCode: '5732' },
          { amount: 45.0, merchantName: 'Apple Store', merchantCategoryCode: '5732' },
          { amount: 85.0, merchantName: 'Nordstrom', merchantCategoryCode: '5651' },
          { amount: 60.0, merchantName: 'GameStop Electronics', merchantCategoryCode: '5732' },
          { amount: 50.0, merchantName: 'Zara', merchantCategoryCode: '5651' },
          { amount: 15.99, merchantName: 'H&M', merchantCategoryCode: '5651' },
        ];

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
        results.transactions.push({ ...tx, status: 'success' });
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        results.transactions.push({ ...tx, status: 'failed', error: error.message });
      }
    }

    return results;
  } catch (error: any) {
    throw new Error(`Setup failed for ${user.firstName}: ${error.message}`);
  }
}

export async function POST(request: Request) {
  try {
    const baileyResults = await setupUser(BAILEY);
    const oliverResults = await setupUser(OLIVER);

    return NextResponse.json({
      success: true,
      message: 'Demo data initialized successfully',
      bailey: baileyResults,
      oliver: oliverResults,
    });
  } catch (error: any) {
    console.error('Demo init error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
