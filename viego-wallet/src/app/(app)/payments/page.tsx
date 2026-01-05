"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface AutomatedPayment {
  id: string;
  type: string;
  merchantName: string;
  amount: number;
  frequency: string;
  nextDueDate: string;
  status: string;
  lastPaidDate?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AutomatedPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = "demo_user"; // TODO: Get from auth context

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      const response = await fetch(`/api/payments?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsPaid(paymentId: string) {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });

      if (response.ok) {
        loadPayments(); // Refresh list
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getDaysUntilDue(dateString: string): number {
    const due = new Date(dateString);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'rent': return '🏠';
      case 'tuition': return '🎓';
      case 'transit': return '🚌';
      default: return '💳';
    }
  }

  const upcomingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Automated Payments</h1>
          <p className="text-gray-600">Manage your recurring payments and due dates</p>
        </div>
        <Link href="/payments/setup">
          <button className="bg-blue-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2">
            <Plus size={20} />
            Add Payment
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Upcoming</h3>
            <Clock className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{upcomingPayments.length}</p>
          <p className="text-sm text-gray-500 mt-2">Pending payments</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Paid This Month</h3>
            <CheckCircle className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{paidPayments.length}</p>
          <p className="text-sm text-gray-500 mt-2">On-time payments</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Total Monthly</h3>
            <DollarSign className="text-purple-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${payments.reduce((sum, p) => sum + (p.frequency === 'monthly' ? p.amount : 0), 0).toFixed(0)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Monthly commitments</p>
        </div>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Upcoming Payments</h2>
          <div className="space-y-4">
            {upcomingPayments.map((payment) => {
              const daysUntil = getDaysUntilDue(payment.nextDueDate);
              const isUrgent = daysUntil <= 3;

              return (
                <div
                  key={payment.id}
                  className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all hover:shadow-xl ${
                    isUrgent ? 'border-orange-300' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-5xl">{getTypeIcon(payment.type)}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {payment.merchantName}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          ${payment.amount} • {payment.frequency}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar size={16} />
                            <span className="text-sm font-semibold">
                              Due {formatDate(payment.nextDueDate)}
                            </span>
                          </div>
                          {isUrgent && (
                            <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                              <AlertCircle size={14} />
                              Due in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => markAsPaid(payment.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors whitespace-nowrap"
                      >
                        Mark as Paid
                      </button>
                      <Link href={`/payments/${payment.id}`}>
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors w-full">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg mb-8">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Upcoming Payments</h3>
          <p className="text-gray-600 mb-4">You're all caught up! Add a payment to get started.</p>
          <Link href="/payments/setup">
            <button className="bg-blue-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2">
              <Plus size={20} />
              Add Your First Payment
            </button>
          </Link>
        </div>
      )}

      {/* Payment History */}
      {paidPayments.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent History</h2>
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
            {paidPayments.map((payment, index) => (
              <div
                key={payment.id}
                className={`p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  index !== paidPayments.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getTypeIcon(payment.type)}</div>
                  <div>
                    <h3 className="font-bold text-gray-900">{payment.merchantName}</h3>
                    <p className="text-sm text-gray-500">
                      Paid {payment.lastPaidDate ? formatDate(payment.lastPaidDate) : 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">${payment.amount}</p>
                  </div>
                  <div className={`${getStatusColor(payment.status)} px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1`}>
                    <CheckCircle size={14} />
                    Paid
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
