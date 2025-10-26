"use client";

import React, { useEffect, useState } from 'react';
import { fetchOffersForMerchant, getSpendingStatus, checkoutTransaction } from '@/hooks/useMerchantOffers';
import { useIsland } from '@/context/IslandContext';

interface Props {
  merchant: { id: number | string; name: string; contentId?: string };
  onClose?: () => void;
}

export default function SpendingAlert({ merchant, onClose }: Props) {
  const [offers, setOffers] = useState<any[] | null>(null);
  const [spending, setSpending] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>("");
  const [quote, setQuote] = useState<any | null>(null);
  const [quoting, setQuoting] = useState(false);
  const { currentXP, setXP } = useIsland();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [o, s] = await Promise.all([
          fetchOffersForMerchant(merchant.id, merchant.contentId),
          getSpendingStatus(),
        ]);
        if (!mounted) return;
        setOffers(o?.offers ?? o?.data ?? []);
        setSpending(s);
      } catch (e) {
        console.error('Failed to load offers/spending', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [merchant]);

  return (
    <div className="mt-4 bg-white rounded-2xl p-4 shadow-md border">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg">Offers & Spending for {merchant.name}</h3>
          <p className="text-sm text-gray-600">We check available merchant offers and your spending status before purchase.</p>
        </div>
        <div>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Close</button>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-gray-600">Loading...</p>
      ) : (
        <div className="mt-3">
          {/* Spending status */}
          {spending ? (
            <div className="mb-3 p-3 bg-yellow-50 rounded">
              <p className="text-sm">
                Spent this month: <span className="font-semibold">${spending.spent.toFixed(2)}</span>
                {' '} / Limit: <span className="font-semibold">${spending.limit.toFixed(2)}</span>
              </p>
              <p className={`text-sm mt-1 ${spending.nearing ? 'text-red-600' : 'text-green-700'}`}>
                {spending.nearing ? 'You are nearing your spending limit — consider a smaller purchase or apply offers.' : 'You are within your spending limit.'}
              </p>
            </div>
          ) : null}

          {/* Offers list */}
          <div>
            <h4 className="font-semibold">Available Offers</h4>
            {(!offers || offers.length === 0) ? (
              <p className="text-sm text-gray-600 mt-2">No offers found for this merchant.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {offers.map((o: any) => (
                  <li key={o.id ?? o.title} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{o.title ?? o.description}</div>
                        <div className="text-sm text-gray-600">{o.description ?? ''}</div>
                      </div>
                      <div className="text-sm text-blue-700 font-bold">{o.discount ?? ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pre-purchase quote */}
          <div className="mt-4 p-3 border rounded-md">
            <h4 className="font-semibold">Simulate a purchase</h4>
            <div className="flex items-center gap-2 mt-2">
              <span>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border rounded px-2 py-1 w-32"
                placeholder="Amount"
              />
              <button
                disabled={!amount || quoting}
                onClick={async () => {
                  try {
                    setQuoting(true);
                    const result = await checkoutTransaction({ merchantId: merchant.id, amount: parseFloat(amount), commit: false });
                    setQuote(result);
                  } finally {
                    setQuoting(false);
                  }
                }}
                className={`px-3 py-1 rounded text-white ${quoting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {quoting ? 'Checking…' : 'Check savings'}
              </button>
            </div>

            {quote && (
              <div className="mt-3 text-sm">
                {quote.nearingLimit && (
                  <p className="text-red-600 font-semibold mb-1">Warning: You’re nearing your monthly spending limit.</p>
                )}
                <p>Best offer: <span className="font-semibold">{quote.appliedOffer?.title || quote.reason || 'None'}</span></p>
                <p>Savings: <span className="font-semibold">${Number(quote.savings || 0).toFixed(2)}</span></p>
                <p>Final amount: <span className="font-semibold">${Number(quote.finalAmount || 0).toFixed(2)}</span></p>
                <div className="mt-2">
                  <button
                    disabled={quoting}
                    onClick={async () => {
                      try {
                        setQuoting(true);
                        const result = await checkoutTransaction({ merchantId: merchant.id, amount: parseFloat(amount), commit: true });
                        setQuote(result);
                        // refresh spending summary after committing
                        const s = await getSpendingStatus();
                        setSpending(s);
                        // Award XP based on savings (bonus) and a tiny portion of spend
                        const bonus = Math.max(0, Math.round((result?.savings || 0)));
                        const spendXP = Math.max(0, Math.round((result?.finalAmount || 0) * 0.02));
                        const gain = bonus + spendXP;
                        if (gain > 0) {
                          setXP(currentXP + gain);
                        }
                      } finally {
                        setQuoting(false);
                      }
                    }}
                    className={`px-3 py-1 rounded text-white ${quoting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    Apply and purchase (demo)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
