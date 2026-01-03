/**
 * Merchant Category Code (MCC) to App Category Mapper
 */

export interface CategoryInfo {
  category: string;
  icon: string;
  color: string;
}

/**
 * Maps Merchant Category Codes to app categories
 * Based on Visa MCC codes: https://usa.visa.com/content/dam/VCOM/download/merchants/visa-merchant-data-standards-manual.pdf
 */
export function getMCCCategory(mccCodes: string[]): CategoryInfo {
  // Default to shopping if no MCC codes
  if (!mccCodes || mccCodes.length === 0) {
    return { category: 'shopping', icon: 'ShoppingBag', color: 'bg-indigo-500' };
  }

  // Check primary MCC code
  const primaryMCC = mccCodes[0];
  const mccNum = parseInt(primaryMCC);

  // Skip if not a valid number
  if (isNaN(mccNum)) {
    return { category: 'shopping', icon: 'ShoppingBag', color: 'bg-indigo-500' };
  }

  // Dining & Restaurants (5812-5814, 5811)
  if (['5812', '5813', '5814', '5811'].includes(primaryMCC)) {
    return { category: 'dining', icon: 'Utensils', color: 'bg-red-500' };
  }

  // Food & Grocery (5411, 5422, 5451, 5462, 5499, 5912, 5122)
  if (
    ['5411', '5422', '5451', '5462', '5499', '5912', '5122'].includes(primaryMCC)
  ) {
    return { category: 'food', icon: 'Coffee', color: 'bg-orange-500' };
  }

  // Education & Books (5942, 5943, 5192, 5993, 5994, 5995, 5021, 82xx schools)
  if (
    ['5942', '5943', '5192', '5993', '5994', '5995', '5021'].includes(primaryMCC) ||
    (mccNum >= 8200 && mccNum <= 8299)
  ) {
    return { category: 'education', icon: 'Book', color: 'bg-blue-500' };
  }

  // Transit & Transportation (41xx, 4784, 5541, 5542, 5571, 5172, 75xx)
  if (
    (mccNum >= 4100 && mccNum <= 4199) ||
    ['4784', '5541', '5542', '5571', '5172'].includes(primaryMCC) ||
    (mccNum >= 7500 && mccNum <= 7599)
  ) {
    return { category: 'transit', icon: 'Bus', color: 'bg-green-500' };
  }

  // Entertainment & Recreation (79xx, 7832, 7841, 7911, 7922, 7929, 7932, 7933, 7991-7999)
  if (
    (mccNum >= 7900 && mccNum <= 7999) ||
    ['7832', '7841'].includes(primaryMCC)
  ) {
    return { category: 'entertainment', icon: 'Heart', color: 'bg-purple-500' };
  }

  // Services (72xx-73xx, 76xx, 77xx, 80xx-81xx medical/legal, 83xx, 86xx-89xx professional services)
  if (
    (mccNum >= 7200 && mccNum <= 7399) ||
    (mccNum >= 7600 && mccNum <= 7799) ||
    (mccNum >= 8000 && mccNum <= 8199) ||
    (mccNum >= 8300 && mccNum <= 8399) ||
    (mccNum >= 8600 && mccNum <= 8999)
  ) {
    return { category: 'services', icon: 'ShoppingBag', color: 'bg-teal-500' };
  }

  // Shopping & Retail (5000-5699)
  if (mccNum >= 5000 && mccNum <= 5699) {
    return { category: 'shopping', icon: 'ShoppingBag', color: 'bg-indigo-500' };
  }

  // Default to shopping for any other MCC codes
  return { category: 'shopping', icon: 'ShoppingBag', color: 'bg-indigo-500' };
}

/**
 * Get a human-readable category name
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    dining: 'Dining',
    food: 'Food & Grocery',
    education: 'Education',
    transit: 'Transit',
    entertainment: 'Entertainment',
    services: 'Services',
    shopping: 'Shopping & Retail',
  };
  return names[category] || 'Other';
}

/**
 * Check if an MCC code matches a specific category
 */
export function isMCCInCategory(mccCode: string, category: string): boolean {
  if (!mccCode || !category || category === 'all') return true;

  const categoryInfo = getMCCCategory([mccCode]);
  return categoryInfo.category === category;
}
