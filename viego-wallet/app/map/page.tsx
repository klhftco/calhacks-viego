"use client";

import { useState } from "react";
import { MapPin, Search, Coffee, ShoppingBag, Utensils, Book, Bus, Heart, CheckCircle, X } from "lucide-react";

interface Merchant {
  id: number;
  name: string;
  category: string;
  distance: string;
  address: string;
  acceptsViego: boolean;
  icon: any;
  color: string;
  paymentMethods: string[];
}

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All", icon: MapPin },
    { id: "food", label: "Food", icon: Coffee },
    { id: "shopping", label: "Shopping", icon: ShoppingBag },
    { id: "dining", label: "Dining", icon: Utensils },
    { id: "books", label: "Books", icon: Book },
    { id: "transit", label: "Transit", icon: Bus },
  ];

  const [merchants] = useState<Merchant[]>([
    {
      id: 1,
      name: "Campus Coffee",
      category: "food",
      distance: "0.2 mi",
      address: "123 University Ave",
      acceptsViego: true,
      icon: Coffee,
      color: "bg-orange-500",
      paymentMethods: ["Visa", "Mastercard", "Viego Card"],
    },
    {
      id: 2,
      name: "Student Bookstore",
      category: "books",
      distance: "0.3 mi",
      address: "45 Campus Dr",
      acceptsViego: true,
      icon: Book,
      color: "bg-blue-500",
      paymentMethods: ["Visa", "Mastercard", "Viego Card", "Apple Pay"],
    },
    {
      id: 3,
      name: "Pizza Palace",
      category: "dining",
      distance: "0.5 mi",
      address: "789 College Blvd",
      acceptsViego: true,
      icon: Utensils,
      color: "bg-red-500",
      paymentMethods: ["Visa", "Mastercard", "Viego Card"],
    },
    {
      id: 4,
      name: "Campus Transit Hub",
      category: "transit",
      distance: "0.1 mi",
      address: "1 Transit Center",
      acceptsViego: true,
      icon: Bus,
      color: "bg-green-500",
      paymentMethods: ["Viego Card", "Transit Pass"],
    },
    {
      id: 5,
      name: "Fashion Boutique",
      category: "shopping",
      distance: "0.8 mi",
      address: "234 Downtown St",
      acceptsViego: false,
      icon: ShoppingBag,
      color: "bg-pink-500",
      paymentMethods: ["Visa", "Mastercard"],
    },
    {
      id: 6,
      name: "Healthy Bites Cafe",
      category: "food",
      distance: "0.4 mi",
      address: "567 Health Way",
      acceptsViego: true,
      icon: Heart,
      color: "bg-green-500",
      paymentMethods: ["Visa", "Mastercard", "Viego Card", "Apple Pay"],
    },
  ]);

  const filteredMerchants = merchants.filter((merchant) => {
    const matchesSearch = merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         merchant.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || merchant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const viegoAcceptedCount = merchants.filter(m => m.acceptsViego).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Merchant Map</h1>
        <p className="text-gray-600">Find nearby student essentials and see where your Viego card is accepted</p>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <CheckCircle size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{viegoAcceptedCount} Locations Near You</h3>
              <p className="text-white/90">Accept Viego Card payments</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{merchants.length}</p>
            <p className="text-white/90">Total merchants</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search merchants or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-lg"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
              }`}
            >
              <Icon size={20} />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Map Placeholder */}
      <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 mb-8 min-h-[300px] shadow-lg border-4 border-white relative overflow-hidden">
        <div className="text-center">
          <MapPin className="mx-auto text-blue-500 mb-4" size={64} />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Interactive Map</h3>
          <p className="text-gray-600 mb-4">Google Maps integration will show merchant locations here</p>
          <div className="inline-block bg-white px-6 py-3 rounded-full shadow-md">
            <p className="text-sm font-semibold text-gray-700">📍 Current Location: Campus Center</p>
          </div>
        </div>

        {/* Map pins visualization */}
        <div className="absolute top-20 left-1/4 text-3xl animate-bounce">📍</div>
        <div className="absolute bottom-20 right-1/3 text-3xl animate-pulse">📍</div>
        <div className="absolute top-1/3 right-1/4 text-3xl">📍</div>
      </div>

      {/* Merchant List */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Nearby Merchants
          {filteredMerchants.length > 0 && (
            <span className="text-lg text-gray-500 ml-3">({filteredMerchants.length} results)</span>
          )}
        </h2>

        {filteredMerchants.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <X className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No merchants found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMerchants.map((merchant) => {
              const Icon = merchant.icon;
              return (
                <div
                  key={merchant.id}
                  className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all hover:shadow-xl cursor-pointer ${
                    merchant.acceptsViego ? 'border-green-200 hover:border-green-400' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`${merchant.color} text-white rounded-full p-3`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{merchant.name}</h3>
                        <p className="text-sm text-gray-500">{merchant.address}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">{merchant.distance}</p>
                    </div>
                  </div>

                  {/* Viego Acceptance Badge */}
                  {merchant.acceptsViego ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-600" size={20} />
                        <span className="font-semibold text-green-700">Accepts Viego Card</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <X className="text-gray-400" size={20} />
                        <span className="font-semibold text-gray-600">Viego Card not accepted</span>
                      </div>
                    </div>
                  )}

                  {/* Payment Methods */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Accepted payments:</p>
                    <div className="flex flex-wrap gap-2">
                      {merchant.paymentMethods.map((method) => (
                        <span
                          key={method}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            method === "Viego Card"
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
