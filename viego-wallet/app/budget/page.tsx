"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Bell, Calendar, CreditCard, ShoppingBag, Coffee, Bus, Home } from "lucide-react";

interface SpendingLimit {
  id: number;
  category: string;
  icon: any;
  limit: number;
  spent: number;
  color: string;
}

interface Transaction {
  id: number;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  icon: any;
}

interface AutoPayment {
  id: number;
  name: string;
  amount: number;
  dueDate: string;
  icon: any;
}

export default function BudgetPage() {
  const [spendingLimits] = useState<SpendingLimit[]>([
    { id: 1, category: "Food & Dining", icon: Coffee, limit: 200, spent: 145, color: "bg-orange-500" },
    { id: 2, category: "Shopping", icon: ShoppingBag, limit: 150, spent: 89, color: "bg-pink-500" },
    { id: 3, category: "Transportation", icon: Bus, limit: 100, spent: 42, color: "bg-blue-500" },
    { id: 4, category: "Housing", icon: Home, limit: 800, spent: 800, color: "bg-green-500" },
  ]);

  const [transactions] = useState<Transaction[]>([
    { id: 1, merchant: "Campus Cafe", amount: -12.50, category: "Food", date: "Today, 2:30 PM", icon: Coffee },
    { id: 2, merchant: "Campus Bookstore", amount: -45.00, category: "Shopping", date: "Today, 11:00 AM", icon: ShoppingBag },
    { id: 3, merchant: "Monthly Transit Pass", amount: -42.00, category: "Transport", date: "Yesterday", icon: Bus },
    { id: 4, merchant: "Scholarship Deposit", amount: 500.00, category: "Income", date: "Oct 20", icon: TrendingUp },
  ]);

  const [autoPayments] = useState<AutoPayment[]>([
    { id: 1, name: "Rent Payment", amount: 800, dueDate: "Nov 1", icon: Home },
    { id: 2, name: "Tuition Installment", amount: 2500, dueDate: "Nov 15", icon: CreditCard },
    { id: 3, name: "Transit Pass", amount: 42, dueDate: "Nov 1", icon: Bus },
  ]);

  const totalSpent = 1076;
  const totalIncome = 1500;
  const savingsGoal = 500;
  const currentSavings = 424;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Budget & Spending</h1>
        <p className="text-gray-600">Track your spending, set limits, and automate payments</p>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Monthly Income</h3>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalIncome}</p>
          <p className="text-sm text-green-600 mt-2">+$500 this month</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Total Spent</h3>
            <TrendingDown className="text-red-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalSpent}</p>
          <p className="text-sm text-gray-500 mt-2">{((totalSpent/totalIncome)*100).toFixed(1)}% of income</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Savings Goal</h3>
            <DollarSign className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">${currentSavings}</p>
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full rounded-full"
                style={{ width: `${(currentSavings/savingsGoal)*100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">{((currentSavings/savingsGoal)*100).toFixed(0)}% to ${savingsGoal}</p>
          </div>
        </div>
      </div>

      {/* Positive Nudge Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 rounded-full p-3 mt-1">
            <Bell size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">You're doing great! 🎉</h3>
            <p className="text-white/90 text-lg">
              You're 85% to your savings goal! Skip that $12 delivery fee and you'll hit it by Friday.
              Your monsters are cheering you on! 🦖
            </p>
          </div>
        </div>
      </div>

      {/* Spending Limits by Category */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Spending Limits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {spendingLimits.map((limit) => {
            const Icon = limit.icon;
            const percentage = (limit.spent / limit.limit) * 100;
            const isNearLimit = percentage >= 80;

            return (
              <div key={limit.id} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`${limit.color} text-white rounded-full p-3`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{limit.category}</h3>
                      <p className="text-sm text-gray-500">Weekly limit</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">${limit.spent}</p>
                    <p className="text-sm text-gray-500">of ${limit.limit}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isNearLimit ? 'bg-red-500' : limit.color
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                {isNearLimit && percentage < 100 && (
                  <p className="text-sm text-orange-600 font-semibold">
                    ⚠️ Approaching limit - ${limit.limit - limit.spent} remaining
                  </p>
                )}
                {percentage >= 100 && (
                  <p className="text-sm text-red-600 font-semibold">
                    🚫 Limit reached for this week
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Automated Payments */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="text-blue-500" />
          Automated Payments
        </h2>
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          {autoPayments.map((payment, index) => {
            const Icon = payment.icon;
            return (
              <div
                key={payment.id}
                className={`p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  index !== autoPayments.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-3">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{payment.name}</h3>
                    <p className="text-sm text-gray-500">Due: {payment.dueDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">${payment.amount}</p>
                  <p className="text-sm text-green-600">Auto-pay enabled</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          {transactions.map((transaction, index) => {
            const Icon = transaction.icon;
            const isPositive = transaction.amount > 0;

            return (
              <div
                key={transaction.id}
                className={`p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  index !== transactions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${isPositive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'} rounded-full p-3`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{transaction.merchant}</h3>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-gray-900'}`}>
                    {isPositive ? '+' : ''}{transaction.amount < 0 ? transaction.amount : `+${transaction.amount}`}
                  </p>
                  <p className="text-sm text-gray-500">{transaction.category}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
