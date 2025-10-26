/**
 * Setup Demo Users in Sandbox
 * Run with: npx tsx scripts/setup-demo-users.ts
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Demo users
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
  console.log(`\n========================================`);
  console.log(`Setting up ${user.firstName} ${user.lastName}`);
  console.log(`========================================\n`);

  // 1. Create profile
  console.log(`1. Creating profile...`);
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
  console.log(`✓ Profile created`);

  // 2. Enroll card
  console.log(`2. Enrolling card...`);
  const enrollResult = await callApi('/api/vctc/enroll-card', {
    method: 'POST',
    body: JSON.stringify({
      primaryAccountNumber: user.pan,
      userIdentifier: user.userIdentifier,
    }),
  });
  const documentID =
    enrollResult.result?.resource?.documentID || enrollResult.result?.documentID;
  console.log(`✓ Card enrolled. documentID: ${documentID}`);

  // 3. Check available controls
  console.log(`3. Checking available controls...`);
  const controlsResult = await callApi(
    `/api/vctc/available-controls?pan=${encodeURIComponent(user.pan)}`
  );
  const availableControls =
    controlsResult.merchantControls?.resource?.availableMerchantTypeRules?.map(
      (c: any) => c.name
    ) || [];
  console.log(`✓ Available controls: ${availableControls.join(', ')}`);

  return { documentID, availableControls };
}

async function setBaileyRules(documentID: string, availableControls: string[]) {
  console.log(`\n4. Setting Bailey's rules...`);

  // Find available controls
  const alcoholControl = availableControls.find((c) => c.includes('ALCOHOL'));
  const gamblingControl = availableControls.find((c) => c.includes('GAMBLING'));
  const groceryControl = availableControls.find((c) => c.includes('GROCERY'));

  const rules: any = { merchantControls: [] };

  // Block alcohol if available
  if (alcoholControl) {
    rules.merchantControls.push({
      controlType: alcoholControl,
      isControlEnabled: true,
      shouldDeclineAll: true,
      userIdentifier: BAILEY.userIdentifier,
    });
    console.log(`  - Blocking ${alcoholControl}`);
  }

  // Block gambling if available
  if (gamblingControl) {
    rules.merchantControls.push({
      controlType: gamblingControl,
      isControlEnabled: true,
      shouldDeclineAll: true,
      userIdentifier: BAILEY.userIdentifier,
    });
    console.log(`  - Blocking ${gamblingControl}`);
  }

  // Cap grocery spending if available
  if (groceryControl) {
    rules.merchantControls.push({
      controlType: groceryControl,
      isControlEnabled: true,
      shouldDeclineAll: false,
      alertThreshold: 150,
      declineThreshold: 200,
      userIdentifier: BAILEY.userIdentifier,
    });
    console.log(`  - Grocery limit: $200/month (alert at $150)`);
  }

  if (rules.merchantControls.length > 0) {
    await callApi('/api/vctc/rules', {
      method: 'POST',
      body: JSON.stringify({ documentId: documentID, rules }),
    });
    console.log(`✓ Rules configured`);
  } else {
    console.log(`⚠ No suitable controls found for Bailey`);
  }

  return { alcoholControl, gamblingControl, groceryControl };
}

async function setOliverRules(documentID: string, availableControls: string[]) {
  console.log(`\n4. Setting Oliver's rules...`);

  const adultEntControl = availableControls.find((c) =>
    c.includes('ADULT_ENTERTAINMENT')
  );
  const electronicsControl = availableControls.find((c) => c.includes('ELECTRONICS'));
  const apparelControl = availableControls.find((c) => c.includes('APPAREL'));

  const rules: any = { merchantControls: [] };

  // Adult entertainment limit if available
  if (adultEntControl) {
    rules.merchantControls.push({
      controlType: adultEntControl,
      isControlEnabled: true,
      shouldDeclineAll: false,
      alertThreshold: 50,
      declineThreshold: 100,
      userIdentifier: OLIVER.userIdentifier,
    });
    console.log(`  - Adult Entertainment limit: $100/month (alert at $50)`);
  }

  // Electronics limit if available
  if (electronicsControl) {
    rules.merchantControls.push({
      controlType: electronicsControl,
      isControlEnabled: true,
      shouldDeclineAll: false,
      alertThreshold: 100,
      declineThreshold: 150,
      userIdentifier: OLIVER.userIdentifier,
    });
    console.log(`  - Electronics limit: $150/month (alert at $100)`);
  }

  // Apparel limit if available
  if (apparelControl) {
    rules.merchantControls.push({
      controlType: apparelControl,
      isControlEnabled: true,
      shouldDeclineAll: false,
      alertThreshold: 75,
      declineThreshold: 125,
      userIdentifier: OLIVER.userIdentifier,
    });
    console.log(`  - Apparel limit: $125/month (alert at $75)`);
  }

  if (rules.merchantControls.length > 0) {
    await callApi('/api/vctc/rules', {
      method: 'POST',
      body: JSON.stringify({ documentId: documentID, rules }),
    });
    console.log(`✓ Rules configured`);
  } else {
    console.log(`⚠ No suitable controls found for Oliver`);
  }

  return { adultEntControl, electronicsControl, apparelControl };
}

async function simulateBaileyTransactions() {
  console.log(`\n5. Simulating Bailey's transactions...`);

  const transactions = [
    { amount: 45.0, merchantName: 'Whole Foods', merchantCategoryCode: '5411' }, // Grocery
    { amount: 62.50, merchantName: 'Safeway', merchantCategoryCode: '5411' }, // Grocery
    { amount: 89.99, merchantName: 'Costco', merchantCategoryCode: '5411' }, // Grocery
    { amount: 28.0, merchantName: 'Trader Joes', merchantCategoryCode: '5411' }, // Grocery
    { amount: 42.0, merchantName: 'Target Groceries', merchantCategoryCode: '5411' }, // Grocery (approaching limit)
    { amount: 25.0, merchantName: 'Liquor Store', merchantCategoryCode: '5921' }, // Alcohol - Should be blocked
    { amount: 35.0, merchantName: 'Wine Shop', merchantCategoryCode: '5921' }, // Alcohol - Should be blocked
    { amount: 50.0, merchantName: 'Casino Royale', merchantCategoryCode: '7995' }, // Gambling - Should be blocked
  ];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    try {
      await callApi('/api/vctc/decision', {
        method: 'POST',
        body: JSON.stringify({
          primaryAccountNumber: BAILEY.pan,
          amount: tx.amount,
          merchantName: tx.merchantName,
          merchantCategoryCode: tx.merchantCategoryCode,
        }),
      });
      console.log(`  ${i + 1}. ${tx.merchantName}: $${tx.amount} ✓`);
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      console.log(`  ${i + 1}. ${tx.merchantName}: $${tx.amount} ✗ (${error.message})`);
    }
  }
  console.log(`✓ Simulated ${transactions.length} transactions`);
}

async function simulateOliverTransactions() {
  console.log(`\n5. Simulating Oliver's transactions...`);

  const transactions = [
    { amount: 35.0, merchantName: 'Best Buy', merchantCategoryCode: '5732' }, // Electronics
    { amount: 45.0, merchantName: 'Apple Store', merchantCategoryCode: '5732' }, // Electronics
    { amount: 85.0, merchantName: 'Nordstrom', merchantCategoryCode: '5651' }, // Apparel
    { amount: 60.0, merchantName: 'GameStop Electronics', merchantCategoryCode: '5732' }, // Electronics - Should exceed $150 limit
    { amount: 50.0, merchantName: 'Zara', merchantCategoryCode: '5651' }, // Apparel - Should exceed $125 limit
    { amount: 15.99, merchantName: 'H&M', merchantCategoryCode: '5651' }, // Apparel
  ];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    try {
      await callApi('/api/vctc/decision', {
        method: 'POST',
        body: JSON.stringify({
          primaryAccountNumber: OLIVER.pan,
          amount: tx.amount,
          merchantName: tx.merchantName,
          merchantCategoryCode: tx.merchantCategoryCode,
        }),
      });
      console.log(`  ${i + 1}. ${tx.merchantName}: $${tx.amount} ✓`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      console.log(`  ${i + 1}. ${tx.merchantName}: $${tx.amount} ✗ (${error.message})`);
    }
  }
  console.log(`✓ Simulated ${transactions.length} transactions`);
}

async function main() {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  Demo Users Setup Script               ║`);
  console.log(`║  Viego Student Wallet                  ║`);
  console.log(`╚════════════════════════════════════════╝`);

  try {
    // Setup Bailey
    const baileyData = await setupUser(BAILEY);
    const baileyRules = await setBaileyRules(
      baileyData.documentID,
      baileyData.availableControls
    );
    await simulateBaileyTransactions();

    // Setup Oliver
    const oliverData = await setupUser(OLIVER);
    const oliverRules = await setOliverRules(
      oliverData.documentID,
      oliverData.availableControls
    );
    await simulateOliverTransactions();

    console.log(`\n========================================`);
    console.log(`✓ Demo setup complete!`);
    console.log(`========================================`);
    console.log(`\nBailey Chen (bailey-student-001):`);
    console.log(`  - Card: ${BAILEY.pan}`);
    console.log(`  - Document ID: ${baileyData.documentID}`);
    console.log(`  - Rules: Alcohol blocked, Gambling blocked, Dining $200 limit`);
    console.log(`  - Transactions: 8 simulated`);

    console.log(`\nOliver Martinez (oliver-student-002):`);
    console.log(`  - Card: ${OLIVER.pan}`);
    console.log(`  - Document ID: ${oliverData.documentID}`);
    console.log(`  - Rules: Entertainment $100 limit, Dining $150 limit`);
    console.log(`  - Transactions: 6 simulated`);

    console.log(`\nNext steps:`);
    console.log(`  1. Navigate to http://localhost:3000/budget`);
    console.log(`  2. Select Bailey or Oliver to view their dashboard`);
    console.log(`  3. View budget progress, transactions, and insights`);
  } catch (error: any) {
    console.error(`\n❌ Setup failed:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
