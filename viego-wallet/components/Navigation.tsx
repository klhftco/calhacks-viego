"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Egg, TrendingUp, MapPin, Gift, Users, Calendar } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/island", icon: Egg, label: "Island" },
    { href: "/budget", icon: TrendingUp, label: "Budget" },
    { href: "/payments", icon: Calendar, label: "Payments" },
    { href: "/map", icon: MapPin, label: "Map" },
    { href: "/savings", icon: Gift, label: "Offers" },
    { href: "/friends", icon: Users, label: "Friends" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:static md:border-b md:border-t-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center py-3 md:py-4">
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
  );
}
