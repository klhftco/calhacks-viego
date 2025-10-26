"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Bell, Calendar, CreditCard, ShoppingBag, Coffee, Bus, Home, RefreshCw } from "lucide-react";
import DonutChart from "@/components/DonutChart";

type User = {
  userIdentifier: string;
  firstName: string;
  lastName: string;
  pan: string;
  email: string;
  description: string;
};

type Alert = any;

type BudgetLimit = {
  controlType: string;
  alertThreshold: number;
  declineThreshold: number;
  currentSpend: number;
};

const USERS: User[] = [
  {
    userIdentifier: "bailey-student-001",
    firstName: "Bailey",
    lastName: "Chen",
    pan: "4514170000000001",
    email: "bailey@university.edu",
    description: "Budget-conscious freshman trying to save money",
  },
  {
    userIdentifier: "oliver-student-002",
    firstName: "Oliver",
    lastName: "Martinez",
    pan: "4514170000000002",
    email: "oliver@university.edu",
    description: "Junior managing overspending habits",
  },
];

// Mock data for demo (alerts are only generated when thresholds are exceeded)
const MOCK_TRANSACTIONS = {
  "bailey-student-001": [
    { merchantName: "Whole Foods", amount: 45.00, controlType: "MCT_GROCERY", decision: "APPROVED", timestamp: "2025-10-25T14:30:00Z" },
    { merchantName: "Safeway", amount: 62.50, controlType: "MCT_GROCERY", decision: "APPROVED", timestamp: "2025-10-25T09:15:00Z" },
    { merchantName: "Costco", amount: 89.99, controlType: "MCT_GROCERY", decision: "APPROVED", timestamp: "2025-10-24T16:20:00Z" },
    { merchantName: "Trader Joes", amount: 28.00, controlType: "MCT_GROCERY", decision: "APPROVED", timestamp: "2025-10-24T10:45:00Z" },
    { merchantName: "Liquor Store", amount: 25.00, controlType: "MCT_ALCOHOL", decision: "DECLINED", timestamp: "2025-10-23T21:15:00Z" },
    { merchantName: "Wine Shop", amount: 35.00, controlType: "MCT_ALCOHOL", decision: "DECLINED", timestamp: "2025-10-23T19:00:00Z" },
    { merchantName: "Casino Royale", amount: 50.00, controlType: "MCT_GAMBLING", decision: "DECLINED", timestamp: "2025-10-22T23:30:00Z" },
    { merchantName: "Target Groceries", amount: 42.00, controlType: "MCT_GROCERY", decision: "APPROVED", timestamp: "2025-10-22T18:00:00Z" },
  ],
  "oliver-student-002": [
    { merchantName: "Best Buy", amount: 35.00, controlType: "MCT_ELECTRONICS", decision: "APPROVED", timestamp: "2025-10-25T19:30:00Z" },
    { merchantName: "Apple Store", amount: 45.00, controlType: "MCT_ELECTRONICS", decision: "APPROVED", timestamp: "2025-10-24T15:20:00Z" },
    { merchantName: "Nordstrom", amount: 85.00, controlType: "MCT_APPAREL_AND_ACCESSORIES", decision: "APPROVED", timestamp: "2025-10-23T20:00:00Z" },
    { merchantName: "GameStop Electronics", amount: 60.00, controlType: "MCT_ELECTRONICS", decision: "APPROVED", timestamp: "2025-10-23T14:15:00Z" },
    { merchantName: "Zara", amount: 50.00, controlType: "MCT_APPAREL_AND_ACCESSORIES", decision: "DECLINED", timestamp: "2025-10-22T19:30:00Z" },
    { merchantName: "H&M", amount: 15.99, controlType: "MCT_APPAREL_AND_ACCESSORIES", decision: "DECLINED", timestamp: "2025-10-21T16:00:00Z" },
  ],
};

export default function BudgetPage() {
  const [spendingLimits] = useState<SpendingLimit[]>([
    { id: 1, category: "Food & Dining", icon: Coffee, limit: 200, spent: 145, color: "#22c55e" }, // green-500
    { id: 2, category: "Shopping", icon: ShoppingBag, limit: 150, spent: 89, color: "#06b6d4" }, // cyan-500
    { id: 3, category: "Transportation", icon: Bus, limit: 100, spent: 42, color: "#3b82f6" }, // blue-500
    { id: 4, category: "Housing", icon: Home, limit: 800, spent: 800, color: "#10b981" }, // emerald-500
  ]);

  // Get logged-in user from localStorage
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "simulate" | "limits">("overview");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableControls, setAvailableControls] = useState<string[]>([]);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("viego_user");
    const demoUserID = localStorage.getItem("demo_user");

    if (savedUser && demoUserID) {
      const user = USERS.find(u => u.userIdentifier === demoUserID);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, []);

  // Simulate transaction state
  const [simAmount, setSimAmount] = useState("25.00");
  const [simMerchant, setSimMerchant] = useState("Test Merchant");
  const [simMCC, setSimMCC] = useState("5812");

  // Add limit state
  const [selectedControl, setSelectedControl] = useState("");
  const [newAlertThreshold, setNewAlertThreshold] = useState("100");
  const [newDeclineThreshold, setNewDeclineThreshold] = useState("150");

  useEffect(() => {
    loadData();
  }, [selectedUser]);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch alerts/transaction history
      const alertsRes = await fetch(
        `/api/vctc/alerts?userIdentifier=${encodeURIComponent(selectedUser.userIdentifier)}`
      );
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        const realAlerts = data.result?.alerts || [];

        // Use mock data if no real alerts (sandbox limitation: test cards don't support merchant controls)
        if (realAlerts.length === 0 && MOCK_TRANSACTIONS[selectedUser.userIdentifier as keyof typeof MOCK_TRANSACTIONS]) {
          setAlerts(MOCK_TRANSACTIONS[selectedUser.userIdentifier as keyof typeof MOCK_TRANSACTIONS]);
        } else {
          setAlerts(realAlerts);
        }
      }

      // Fetch available controls
      const controlsRes = await fetch(
        `/api/vctc/available-controls?pan=${encodeURIComponent(selectedUser.pan)}`
      );
      if (controlsRes.ok) {
        const data = await controlsRes.json();
        const merchantTypes =
          data.merchantControls?.resource?.merchantControls?.map((c: any) => c.name) || [];
        setAvailableControls(merchantTypes);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulateTransaction() {
    setLoading(true);
    try {
      const res = await fetch("/api/vctc/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryAccountNumber: selectedUser.pan,
          amount: parseFloat(simAmount),
          merchantName: simMerchant,
          merchantCategoryCode: simMCC,
        }),
      });
      const data = await res.json();

      const decision = data.result?.decision || data.result?.decisionResponse?.decision || "UNKNOWN";
      alert(
        `Transaction ${decision === "APPROVED" ? "✓ APPROVED" : decision === "DECLINED" ? "✗ DECLINED" : "processed"}!\n\nMerchant: ${simMerchant}\nAmount: $${simAmount}`
      );

      // Reload alerts
      await loadData();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Calculate spending by category from alerts
  const spendingByCategory = alerts.reduce((acc, alert) => {
    const category = alert.controlType || "OTHER";
    const amount = alert.amount || 0;
    if (alert.decision === "APPROVED" || alert.decision === "APPROVE") {
      acc[category] = (acc[category] || 0) + amount;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate budget limits (based on user - using actual VCTC controls)
  const budgetLimits: BudgetLimit[] = !selectedUser
    ? []
    : selectedUser.firstName === "Bailey"
      ? [
          {
            controlType: "MCT_GROCERY",
            alertThreshold: 150,
            declineThreshold: 200,
            currentSpend: spendingByCategory["MCT_GROCERY"] || 0,
          },
          {
            controlType: "MCT_ALCOHOL",
            alertThreshold: 0,
            declineThreshold: 0,
            currentSpend: spendingByCategory["MCT_ALCOHOL"] || 0,
          },
          {
            controlType: "MCT_GAMBLING",
            alertThreshold: 0,
            declineThreshold: 0,
            currentSpend: spendingByCategory["MCT_GAMBLING"] || 0,
          },
        ]
      : [
          {
            controlType: "MCT_ELECTRONICS",
            alertThreshold: 100,
            declineThreshold: 150,
            currentSpend: spendingByCategory["MCT_ELECTRONICS"] || 0,
          },
          {
            controlType: "MCT_APPAREL_AND_ACCESSORIES",
            alertThreshold: 75,
            declineThreshold: 125,
            currentSpend: spendingByCategory["MCT_APPAREL_AND_ACCESSORIES"] || 0,
          },
          {
            controlType: "MCT_ADULT_ENTERTAINMENT",
            alertThreshold: 50,
            declineThreshold: 100,
            currentSpend: spendingByCategory["MCT_ADULT_ENTERTAINMENT"] || 0,
          },
        ];

  // Calculate blocked transactions
  const blockedTransactions = alerts.filter((a) => a.decision === "DECLINED" || a.decision === "DECLINE");
  const approvedTransactions = alerts.filter((a) => a.decision === "APPROVED" || a.decision === "APPROVE");

  // Calculate total savings from blocked transactions
  const totalBlocked = blockedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">Viego Student Wallet</h1>
          <p className="text-blue-100">Smart budgeting powered by Visa Transaction Controls</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Loading or no user */}
        {!selectedUser && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6 text-center">
            <p className="text-yellow-800 font-semibold">
              Please <a href="/login" className="underline text-blue-600">login</a> to view your budget dashboard
            </p>
          </div>
        )}

        {/* User Header */}
        {selectedUser && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {selectedUser.firstName[0]}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{selectedUser.description}</p>
                <p className="text-xs text-gray-400 font-mono mt-1">{selectedUser.email}</p>
              </div>
              <CreditCard className="text-blue-600" size={32} />
            </div>
          </div>
        )}

        {/* Only show content if user is logged in */}
        {selectedUser && (
          <>
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border-l-4 border-green-500 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 font-medium">Approved</div>
                <div className="text-2xl font-bold text-gray-900">{approvedTransactions.length}</div>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white border-l-4 border-red-500 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 font-medium">Blocked</div>
                <div className="text-2xl font-bold text-gray-900">{blockedTransactions.length}</div>
              </div>
              <Bell className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-white border-l-4 border-blue-500 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 font-medium">Saved</div>
                <div className="text-2xl font-bold text-gray-900">${totalBlocked.toFixed(2)}</div>
              </div>
              <DollarSign className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white border-l-4 border-purple-500 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 font-medium">Total</div>
                <div className="text-2xl font-bold text-gray-900">{alerts.length}</div>
              </div>
              <Calendar className="text-purple-500" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === "overview"
                    ? "border-b-4 border-blue-500 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                📊 Budget Overview
              </button>
              <button
                onClick={() => setActiveTab("simulate")}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === "simulate"
                    ? "border-b-4 border-blue-500 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                🎮 Simulate Transaction
              </button>
              <button
                onClick={() => setActiveTab("limits")}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === "limits"
                    ? "border-b-4 border-blue-500 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                🎯 Manage Limits
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Spending Insights Banner */}
                {blockedTransactions.length > 0 && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 rounded-full p-3">
                        <Bell size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Great job, {selectedUser.firstName}! 🎉</h3>
                        <p className="text-white/90 text-lg">
                          You've blocked {blockedTransactions.length} impulse purchases this month, saving ${totalBlocked.toFixed(2)}. Keep it up!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Budget Progress Bars */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold">Budget Progress</h3>
                    <button
                      onClick={loadData}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-5">
                    {budgetLimits.map((limit) => {
                      const percentage = limit.declineThreshold > 0
                        ? Math.min((limit.currentSpend / limit.declineThreshold) * 100, 100)
                        : 0;
                      const isBlocked = limit.declineThreshold === 0;
                      const isNearLimit = percentage >= 75 && !isBlocked;
                      const isOverLimit = percentage >= 100;

                      return (
                        <div key={limit.controlType} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-lg">{limit.controlType}</h4>
                              {isBlocked && (
                                <span className="text-sm text-red-600 font-semibold">🚫 COMPLETELY BLOCKED</span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                ${limit.currentSpend.toFixed(2)}
                              </div>
                              {!isBlocked && (
                                <div className="text-sm text-gray-600">
                                  of ${limit.declineThreshold.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>

                          {!isBlocked && (
                            <>
                              <div className="w-full bg-gray-300 rounded-full h-5 overflow-hidden shadow-inner">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isOverLimit
                                      ? "bg-red-500"
                                      : isNearLimit
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-600">
                                  Alert at ${limit.alertThreshold}
                                </span>
                                <span
                                  className={`font-semibold ${
                                    isOverLimit
                                      ? "text-red-600"
                                      : isNearLimit
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {percentage.toFixed(1)}% used
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Spending by Category */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h4 className="font-bold text-lg mb-4">Spending by Category</h4>
                    <div className="space-y-3">
                      {Object.entries(spendingByCategory)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 6)
                        .map(([category, amount]) => (
                          <div key={category} className="flex justify-between items-center">
                            <span className="text-gray-700">{category}</span>
                            <span className="font-bold text-gray-900">${amount.toFixed(2)}</span>
                          </div>
                        ))}
                      {Object.keys(spendingByCategory).length === 0 && (
                        <p className="text-gray-500 text-center py-4">No spending data yet</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                    <h4 className="font-bold text-lg mb-4">💡 Smart Insights</h4>
                    <div className="space-y-3 text-sm">
                      {blockedTransactions.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-lg">🛡️</span>
                          <span>
                            Blocked {blockedTransactions.length} transactions, saving ${totalBlocked.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {budgetLimits.some((l) => l.declineThreshold > 0 && (l.currentSpend / l.declineThreshold) * 100 >= 75) && (
                        <div className="flex items-start gap-2">
                          <span className="text-lg">⚠️</span>
                          <span>Approaching spending limits in some categories</span>
                        </div>
                      )}
                      {approvedTransactions.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-lg">📈</span>
                          <span>{approvedTransactions.length} approved transactions this period</span>
                        </div>
                      )}
                      {alerts.length === 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-lg">🎯</span>
                          <span>No transaction history yet. Try simulating some transactions!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">Recent Transactions</h3>
                  <div className="space-y-2">
                    {alerts.slice(0, 10).map((alert, idx) => {
                      const isApproved = alert.decision === "APPROVED" || alert.decision === "APPROVE";
                      const isDeclined = alert.decision === "DECLINED" || alert.decision === "DECLINE";

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow ${
                                isApproved
                                  ? "bg-green-500"
                                  : isDeclined
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                              }`}
                            >
                              {isApproved ? "✓" : isDeclined ? "✗" : "?"}
                            </div>
                            <div>
                              <div className="font-semibold text-lg">{alert.merchantName || "Unknown Merchant"}</div>
                              <div className="text-sm text-gray-600">
                                {alert.controlType || "N/A"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xl">
                              ${(alert.amount || 0).toFixed(2)}
                            </div>
                            <div
                              className={`text-xs font-semibold uppercase ${
                                isApproved
                                  ? "text-green-600"
                                  : isDeclined
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {alert.decision || "Unknown"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {alerts.length === 0 && (
                      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg">No transactions yet</p>
                        <p className="text-gray-400 text-sm mt-2">Use the "Simulate Transaction" tab to create test data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Simulate Transaction Tab */}
            {activeTab === "simulate" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h3 className="text-xl font-bold mb-2">Test Your Budget Controls</h3>
                  <p className="text-gray-700">
                    Simulate transactions to see how your budget rules respond. This helps you test and understand your spending limits before real purchases.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Merchant Name</label>
                    <input
                      type="text"
                      value={simMerchant}
                      onChange={(e) => setSimMerchant(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                      placeholder="Starbucks"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={simAmount}
                      onChange={(e) => setSimAmount(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                      placeholder="25.00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">
                      Merchant Category Code (MCC)
                    </label>
                    <select
                      value={simMCC}
                      onChange={(e) => setSimMCC(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="5812">5812 - Restaurants/Dining</option>
                      <option value="5411">5411 - Grocery Stores</option>
                      <option value="5999">5999 - Miscellaneous Retail</option>
                      <option value="5921">5921 - Liquor Stores</option>
                      <option value="7995">7995 - Gambling</option>
                      <option value="7832">7832 - Movie Theaters/Entertainment</option>
                      <option value="5541">5541 - Gas Stations</option>
                      <option value="5942">5942 - Bookstores</option>
                      <option value="7841">7841 - Streaming Services</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSimulateTransaction}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-4 text-lg font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {loading ? "Processing..." : "🎮 Simulate Transaction"}
                </button>

                <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5">
                  <div className="font-bold text-yellow-900 mb-3">💡 Test Scenarios:</div>
                  <ul className="text-sm text-yellow-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span><strong>Bailey:</strong> Try liquor store (MCC 5921) - Should be blocked completely</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span><strong>Bailey:</strong> Try dining over $200 - Should be declined</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span><strong>Oliver:</strong> Try entertainment over $100 - Should be declined</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Try small purchases under limits - Should be approved</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Manage Limits Tab */}
            {activeTab === "limits" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Current Spending Limits</h3>
                  <div className="space-y-3">
                    {budgetLimits.map((limit) => (
                      <div
                        key={limit.controlType}
                        className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div>
                          <div className="font-bold text-lg">{limit.controlType}</div>
                          {limit.declineThreshold === 0 ? (
                            <div className="text-sm text-red-600 font-semibold">Completely Blocked</div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              Alert at ${limit.alertThreshold} • Decline at ${limit.declineThreshold}
                            </div>
                          )}
                        </div>
                        <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors">
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="text-2xl font-bold mb-4">Add New Limit</h3>
                  <p className="text-gray-700 mb-6">
                    Set spending limits for specific merchant categories. Only categories supported by your card are available.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Control Type</label>
                      <select
                        value={selectedControl}
                        onChange={(e) => setSelectedControl(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select a category...</option>
                        {availableControls.map((control) => (
                          <option key={control} value={control}>
                            {control}
                          </option>
                        ))}
                      </select>
                      {availableControls.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          Loading available controls for card ****{selectedUser.pan.slice(-4)}...
                        </p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Alert Threshold ($)
                        </label>
                        <input
                          type="number"
                          value={newAlertThreshold}
                          onChange={(e) => setNewAlertThreshold(e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                          placeholder="100"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Get notified when spending reaches this amount
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Decline Threshold ($)
                        </label>
                        <input
                          type="number"
                          value={newDeclineThreshold}
                          onChange={(e) => setNewDeclineThreshold(e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                          placeholder="150"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Block transactions when spending reaches this
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!selectedControl || loading}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl py-4 text-lg font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      Add Spending Limit
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="font-bold text-blue-900 mb-3">ℹ️ How Spending Limits Work</div>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span><strong>Alert Threshold:</strong> You'll get a notification, but transaction still processes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span><strong>Decline Threshold:</strong> Transactions are automatically blocked at this amount</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span><strong>Monthly Reset:</strong> All limits reset at the beginning of each month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span><strong>Card Support:</strong> You can only set limits for categories your specific card supports</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
