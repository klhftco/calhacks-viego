import { Wallet, Egg, TrendingUp, ShoppingBag, Coffee, Bus } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-600">Good to see you again</p>
      </div>

      {/* Isometric grassy area with creatures and a large tree */}
      <div className="rounded-3xl p-8 mb-6 min-h-[260px] shadow-lg border-4 border-white relative overflow-hidden bg-gradient-to-br from-green-200 to-green-400">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.2) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,0.2) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%), linear-gradient(315deg, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0) 25%)", backgroundSize: '40px 40px', backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0' }} />
        <div className="absolute right-6 bottom-6 text-6xl">🌳</div>
        <div className="absolute left-10 bottom-10 text-5xl animate-bounce">🦖</div>
        <div className="absolute left-1/3 top-12 text-5xl">🦕</div>
        <div className="absolute right-1/3 top-16 text-5xl">🐉</div>
        <div className="absolute top-3 left-4 bg-white/90 rounded-full px-3 py-1 shadow">Viego Meadow</div>
      </div>

      {/* Current Balance */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-700">Current Balance</h3>
          <Wallet className="text-blue-500" size={24} />
        </div>
        <p className="text-3xl font-bold text-gray-900">$1,234.56</p>
        <p className="text-sm text-gray-500 mt-2">+5.2% this month</p>
      </div>

      {/* Below: Recent Transactions and Goal Progress */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          </div>
          {[ 
            { id: 1, merchant: 'Campus Cafe', amount: -12.50, date: 'Today, 2:30 PM', icon: Coffee, tone: 'gray' },
            { id: 2, merchant: 'Campus Bookstore', amount: -45.00, date: 'Today, 11:00 AM', icon: ShoppingBag, tone: 'gray' },
            { id: 3, merchant: 'Monthly Transit Pass', amount: -42.00, date: 'Yesterday', icon: Bus, tone: 'gray' },
            { id: 4, merchant: 'Scholarship Deposit', amount: 500.00, date: 'Oct 20', icon: TrendingUp, tone: 'green' },
          ].map((t, idx, arr) => {
            const Icon = t.icon as any;
            const isPositive = t.amount > 0;
            return (
              <div
                key={t.id}
                className={`px-6 py-4 flex items-center justify-between ${idx !== arr.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${isPositive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'} rounded-full p-3`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.merchant}</p>
                    <p className="text-xs text-gray-500">{t.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-gray-900'}`}>
                    {isPositive ? `+$${t.amount.toFixed(2)}` : `-$${Math.abs(t.amount).toFixed(2)}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Goal Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">Goal Progress</h3>
            <Egg className="text-green-600" size={22} />
          </div>
          <p className="text-sm text-gray-600 mb-2">Monthly savings goal</p>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="bg-green-500 h-full rounded-full" style={{ width: `${(424/500)*100}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">$424 saved</span>
            <span className="text-gray-900 font-semibold">85% of $500</span>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
            Keep going! You are close to your goal.
          </div>
        </div>
      </div>
    </div>
  );
}
