"use client";
// client helper for fetching offers and spending status
export async function fetchOffersForMerchant(merchantId: string | number, contentId?: string) {
  const res = await fetch('/api/visa-offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId, contentId }),
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

export async function checkoutTransaction(params: { merchantId: string | number; amount: number; contentId?: string; commit?: boolean }) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

export default { fetchOffersForMerchant, getSpendingStatus, addTransaction, checkoutTransaction };
