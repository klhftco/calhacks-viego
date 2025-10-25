"use client";

import React, { useEffect, useState } from 'react';
import { fetchOffersForMerchant, getSpendingStatus } from '@/hooks/useMerchantOffers';

interface Props {
  merchant: { id: number | string; name: string };
  onClose?: () => void;
}

export default function SpendingAlert({ merchant, onClose }: Props) {
  const [offers, setOffers] = useState<any[] | null>(null);
  const [spending, setSpending] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [o, s] = await Promise.all([
          fetchOffersForMerchant(merchant.id),
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
        </div>
      )}
    </div>
  );
}
