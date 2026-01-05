"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, MapPin, Egg, Calendar, Users, UserCircle } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  // Navigation order: Budget, Map, Island, Payments, Friends
  const navItems = [
    { href: "/budget", icon: TrendingUp, label: "Budget" },
    { href: "/map", icon: MapPin, label: "Map" },
    { href: "/island", icon: Egg, label: "Island" },
    { href: "/payments", icon: Calendar, label: "Payments" },
    { href: "/friends", icon: Users, label: "Friends" },
  ];

  const isAccountActive = pathname === "/account";

  return (
    <>
      {/* Top Account Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <div className="text-xl font-bold text-gray-900">Viego Wallet</div>
            <Link
              href="/account"
              className={`flex flex-row items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isAccountActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
              title="Account Settings"
            >
              <UserCircle size={24} />
              <span className="text-sm font-medium hidden md:inline">Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-around items-center py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
