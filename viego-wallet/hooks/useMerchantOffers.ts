"use client";
// client helper for fetching offers and spending status
export async function fetchOffersForMerchant(merchantId: string | number) {
  const res = await fetch('/api/visa-offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId }),
  });
  return res.json();
}

export async function getSpendingStatus() {
  const res = await fetch('/api/spending-status');
  return res.json();
}

export async function addTransaction(amount: number) {
  const res = await fetch('/api/spending-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  return res.json();
}

export default { fetchOffersForMerchant, getSpendingStatus, addTransaction };
