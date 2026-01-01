#!/usr/bin/env tsx
/**
 * CLI Seed Script
 * Seeds MongoDB and/or Visa API with demo data
 *
 * Usage:
 *   npm run seed              # Seed both MongoDB and Visa API
 *   npm run seed:db           # Seed MongoDB only
 *   npm run seed:visa         # Seed Visa API only
 *   npm run seed:if-empty     # Seed only if MongoDB is empty
 *
 * Or directly:
 *   npx tsx scripts/seed.ts
 *   npx tsx scripts/seed.ts --db-only
 *   npx tsx scripts/seed.ts --visa-only
 *   npx tsx scripts/seed.ts --if-empty
 */

import { seedDatabase, seedIfEmpty } from '../lib/mongo/seed/seedDatabase';
import { seedVisaAPI } from '../lib/mongo/seed/seedVisa';

export { seedDatabase, seedIfEmpty, seedVisaAPI };

async function main() {
  const args = process.argv.slice(2);
  const dbOnly = args.includes('--db-only');
  const visaOnly = args.includes('--visa-only');
  const ifEmpty = args.includes('--if-empty');

  console.log('🌱 Starting seed process...\n');

  try {
    // Seed MongoDB
    if (!visaOnly) {
      if (ifEmpty) {
        await seedIfEmpty();
      } else {
        await seedDatabase();
      }
    }

    // Seed Visa API
    if (!dbOnly) {
      await seedVisaAPI();
    }

    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

main();
