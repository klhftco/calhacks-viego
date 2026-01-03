"use client";

import { useState } from "react";
import { Gift, Tag, TrendingUp, CheckCircle, Clock, Star, Percent } from "lucide-react";

interface Offer {
  id: number;
  merchant: string;
  title: string;
  description: string;
  discount: string;
  category: string;
  expiresIn: string;
  isActive: boolean;
  timesUsed: number;
  maxUses: number;
  color: string;
}

interface Savings {
  thisMonth: number;
  allTime: number;
  activeOffers: number;
}

export default function SavingsPage() {
  const [savings] = useState<Savings>({
    thisMonth: 47.50,
    allTime: 285.75,
    activeOffers: 12,
  });

  const [offers] = useState<Offer[]>([
    {
      id: 1,
      merchant: "Campus Coffee",
      title: "Student Discount",
      description: "15% off all beverages with student ID",
      discount: "15% OFF",
      category: "Food & Dining",
      expiresIn: "30 days",
      isActive: true,
      timesUsed: 3,
      maxUses: 10,
      color: "bg-teal-500",
    },
    {
      id: 2,
      merchant: "Campus Bookstore",
      title: "Back to School Sale",
      description: "$20 off purchases over $100",
      discount: "$20 OFF",
      category: "Books",
      expiresIn: "7 days",
      isActive: true,
      timesUsed: 0,
      maxUses: 1,
      color: "bg-blue-500",
    },
    {
      id: 3,
      merchant: "Pizza Palace",
      title: "Free Delivery",
      description: "Free delivery on orders over $15",
      discount: "FREE DELIVERY",
      category: "Food & Dining",
      expiresIn: "14 days",
      isActive: true,
      timesUsed: 5,
      maxUses: 999,
      color: "bg-emerald-500",
    },
    {
      id: 4,
      merchant: "Healthy Bites",
      title: "Loyalty Reward",
      description: "Buy 5 smoothies, get 1 free",
      discount: "BUY 5 GET 1",
      category: "Food & Dining",
      expiresIn: "60 days",
      isActive: true,
      timesUsed: 2,
      maxUses: 5,
      color: "bg-green-500",
    },
    {
      id: 5,
      merchant: "Gym Plus",
      title: "Student Membership",
      description: "50% off monthly membership",
      discount: "50% OFF",
      category: "Health & Fitness",
      expiresIn: "3 days",
      isActive: true,
      timesUsed: 0,
      maxUses: 1,
      color: "bg-teal-600",
    },
    {
      id: 6,
      merchant: "Tech Store",
      title: "Electronics Sale",
      description: "$50 off laptops and tablets",
      discount: "$50 OFF",
      category: "Electronics",
      expiresIn: "21 days",
      isActive: true,
      timesUsed: 0,
      maxUses: 1,
      color: "bg-sky-500",
    },
  ]);

  const activeOffers = offers.filter(offer => offer.isActive);
  const expiringSoon = offers.filter(offer => {
    const days = parseInt(offer.expiresIn);
    return days <= 7;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Savings & Offers</h1>
        <p className="text-gray-600">Automatically apply merchant offers to stretch your budget</p>
      </div>

      {/* Savings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">This Month</h3>
            <TrendingUp size={24} />
          </div>
          <p className="text-4xl font-bold">${savings.thisMonth}</p>
          <p className="text-white/90 text-sm mt-2">in savings</p>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-teal-500 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">All Time</h3>
            <Star size={24} />
          </div>
          <p className="text-4xl font-bold">${savings.allTime}</p>
          <p className="text-white/90 text-sm mt-2">total saved</p>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Active Offers</h3>
            <Gift size={24} />
          </div>
          <p className="text-4xl font-bold">{savings.activeOffers}</p>
          <p className="text-white/90 text-sm mt-2">available now</p>
        </div>
      </div>

      {/* Auto-Apply Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 rounded-full p-3 mt-1">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Auto-Apply is ON</h3>
            <p className="text-white/90 text-lg">
              We&#39;ll automatically apply the best available offers when you make purchases at participating merchants.
              No codes needed!
            </p>
          </div>
        </div>
      </div>

      {/* Expiring Soon Section */}
      {expiringSoon.length > 0 && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="text-blue-600" />
            Expiring Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expiringSoon.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`${offer.color} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                        {offer.discount}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Clock size={12} />
                        {offer.expiresIn}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{offer.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{offer.merchant}</p>
                    <p className="text-gray-700">{offer.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-600">{offer.category}</span>
                  <span className="text-sm text-gray-600">
                    Used {offer.timesUsed}/{offer.maxUses === 999 ? '∞' : offer.maxUses}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Active Offers */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="text-blue-600" />
          All Available Offers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOffers.map((offer) => {
            const isExpiringSoon = parseInt(offer.expiresIn) <= 7;
            const usagePercentage = (offer.timesUsed / offer.maxUses) * 100;

            return (
              <div
                key={offer.id}
                className={`bg-white rounded-2xl p-6 shadow-lg border-2 hover:shadow-xl transition-all ${
                  isExpiringSoon ? 'border-blue-200' : 'border-gray-100'
                }`}
              >
                {/* Discount Badge */}
                <div className={`${offer.color} text-white text-center py-3 px-4 rounded-xl mb-4 shadow-md`}>
                  <div className="flex items-center justify-center gap-2">
                    <Percent size={24} />
                    <span className="text-2xl font-bold">{offer.discount}</span>
                  </div>
                </div>

                {/* Offer Details */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{offer.title}</h3>
                <p className="text-gray-600 font-semibold mb-2">{offer.merchant}</p>
                <p className="text-gray-700 mb-4 text-sm">{offer.description}</p>

                {/* Expiration */}
                <div className={`flex items-center gap-2 mb-3 ${isExpiringSoon ? 'text-blue-700' : 'text-gray-600'}`}>
                  <Clock size={16} />
                  <span className="text-sm font-semibold">Expires in {offer.expiresIn}</span>
                </div>

                {/* Usage Progress */}
                {offer.maxUses !== 999 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Uses: {offer.timesUsed}/{offer.maxUses}</span>
                      <span>{Math.round(usagePercentage)}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${offer.color} h-full rounded-full transition-all`}
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Category */}
                <div className="pt-3 border-t border-gray-100">
                  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {offer.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mt-12 bg-blue-50 rounded-2xl p-8 border-2 border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Gift className="text-blue-500" />
          How Auto-Apply Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              1
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Shop Normally</h3>
            <p className="text-gray-600 text-sm">
              Use your Viego card at any participating merchant
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              2
            </div>
            <h3 className="font-bold text-gray-900 mb-2">We Find Offers</h3>
            <p className="text-gray-600 text-sm">
              Our system automatically checks for available discounts
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              3
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Save Money</h3>
            <p className="text-gray-600 text-sm">
              The best offer is applied automatically - no codes needed!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
