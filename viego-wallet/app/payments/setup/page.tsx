"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, DollarSign, Building, CreditCard } from "lucide-react";

// Merchant Category Codes for common payment types
const MCC_CODES = {
  rent: "6513", // Real Estate Agents and Managers - Rentals
  tuition: "8220", // Colleges, Universities, Professional Schools
  transit: "4111", // Local/Suburban Commuter Passenger Transportation
};

export default function PaymentSetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: "rent",
    merchantName: "",
    amount: "",
    frequency: "monthly",
    dueDay: "1",
    reminderDays: [7, 3, 1],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const userId = "demo_user"; // TODO: Get from auth context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!formData.merchantName || !formData.amount) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount");
        setLoading(false);
        return;
      }

      // Prepare payload
      const payload = {
        userId,
        type: formData.type,
        merchantName: formData.merchantName,
        merchantCategoryCode: MCC_CODES[formData.type as keyof typeof MCC_CODES],
        amount,
        frequency: formData.frequency,
        dueDay: formData.frequency === 'monthly' ? parseInt(formData.dueDay) : undefined,
        reminderDays: formData.reminderDays,
      };

      // Create payment
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Success! Redirect to payments page
        router.push('/payments');
      } else {
        setError(data.error || 'Failed to create payment');
      }
    } catch (err: any) {
      console.error('Error creating payment:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleReminderDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(day)
        ? prev.reminderDays.filter(d => d !== day)
        : [...prev.reminderDays, day].sort((a, b) => b - a),
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Back Button */}
      <Link href="/payments">
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={20} />
          Back to Payments
        </button>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Add Automated Payment</h1>
        <p className="text-gray-600">Set up automatic tracking and reminders for your recurring payments</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Payment Type */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-3">Payment Type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'rent', label: '🏠 Rent', icon: Building },
              { value: 'tuition', label: '🎓 Tuition', icon: Calendar },
              { value: 'transit', label: '🚌 Transit', icon: CreditCard },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('type', type.value)}
                className={`p-4 rounded-xl font-semibold transition-all border-2 ${
                  formData.type === type.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Merchant Name */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Merchant Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.merchantName}
            onChange={(e) => handleChange('merchantName', e.target.value)}
            placeholder={
              formData.type === 'rent' ? 'e.g., ABC Property Management' :
              formData.type === 'tuition' ? 'e.g., UC Berkeley' :
              'e.g., AC Transit'
            }
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900"
            required
          />
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0.00"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900"
              required
            />
          </div>
        </div>

        {/* Frequency */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-3">Frequency</label>
          <select
            value={formData.frequency}
            onChange={(e) => handleChange('frequency', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly (Every 3 months)</option>
            <option value="semester">Per Semester (Every 6 months)</option>
            <option value="annual">Annual</option>
          </select>
        </div>

        {/* Due Day (for monthly payments) */}
        {formData.frequency === 'monthly' && (
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Due Day of Month
            </label>
            <select
              value={formData.dueDay}
              onChange={(e) => handleChange('dueDay', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Payment will be due on the {formData.dueDay}
              {formData.dueDay === '1' ? 'st' : formData.dueDay === '2' ? 'nd' : formData.dueDay === '3' ? 'rd' : 'th'} of each month
            </p>
          </div>
        )}

        {/* Reminder Settings */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-3">
            Send Reminders
          </label>
          <p className="text-sm text-gray-600 mb-3">
            We'll notify you before the payment is due
          </p>
          <div className="space-y-2">
            {[7, 5, 3, 1].map(days => (
              <label key={days} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminderDays.includes(days)}
                  onChange={() => toggleReminderDay(days)}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  {days} day{days !== 1 ? 's' : ''} before
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>How it works:</strong> We'll create a monitoring rule using Visa's Transaction Controls API.
            When you make a payment to {formData.merchantName || 'this merchant'}, we'll automatically detect it
            and mark the payment as complete.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Payment...' : 'Create Payment'}
        </button>
      </form>
    </div>
  );
}
