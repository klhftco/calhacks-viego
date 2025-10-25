"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, Coffee, ShoppingBag, Utensils, Book, Bus, Heart, CheckCircle, X, RefreshCw } from "lucide-react";
import MerchantMap from "@/components/MerchantMap";

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
  position: {
    lat: number;
    lng: number;
  };
}

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [useRealData, setUseRealData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      position: { lat: 37.8716, lng: -122.2727 },
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
      position: { lat: 37.8697, lng: -122.2596 },
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
      position: { lat: 37.8735, lng: -122.2675 },
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
      position: { lat: 37.8701, lng: -122.2700 },
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
      position: { lat: 37.8750, lng: -122.2650 },
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
      position: { lat: 37.8690, lng: -122.2710 },
    },
  ]);

  const [realMerchants, setRealMerchants] = useState<Merchant[]>([]);

  // Fetch real merchant data from Visa API
  const fetchRealMerchants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/merchants?latitude=37.8715&longitude=-122.2730&distance=5&maxRecords=25');
      const data = await response.json();

      if (data.success && data.merchants) {
        // Transform Visa API response to our Merchant format
        const transformed: Merchant[] = data.merchants.map((m: any, index: number) => ({
          id: index + 1,
          name: m.visaStoreName || m.visaMerchantName || 'Unknown Merchant',
          category: 'shopping', // You can categorize based on merchant type
          distance: m.distance || 'N/A',
          address: m.merchantStreetAddress || `${m.merchantCity}, ${m.merchantState}`,
          acceptsViego: true, // All Visa merchants accept card
          icon: ShoppingBag,
          color: 'bg-blue-500',
          paymentMethods: m.paymentAcceptanceMethod || ['Visa', 'Mastercard', 'Viego Card'],
          position: {
            lat: parseFloat(m.locationAddressLatitude) || 37.8715,
            lng: parseFloat(m.locationAddressLongitude) || -122.2730,
          },
        }));
        setRealMerchants(transformed);
      } else {
        setError(data.error || 'Failed to fetch merchants');
      }
    } catch (err) {
      setError('Failed to connect to Visa API');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real data when toggle is switched
  useEffect(() => {
    if (useRealData && realMerchants.length === 0) {
      fetchRealMerchants();
    }
  }, [useRealData]);

  // Use real or mock data based on toggle
  const displayMerchants = useRealData ? realMerchants : merchants;

  const filteredMerchants = displayMerchants.filter((merchant) => {
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
            <p className="text-3xl font-bold">{displayMerchants.length}</p>
            <p className="text-white/90">Total merchants</p>
          </div>
        </div>
      </div>

      {/* Data Source Toggle */}
      <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-semibold">Data Source:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${useRealData ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {useRealData ? '🔴 Live Visa API' : '📦 Mock Data'}
          </span>
        </div>
        <button
          onClick={() => setUseRealData(!useRealData)}
          disabled={isLoading}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            useRealData
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-green-500 text-white hover:bg-green-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <><RefreshCw size={16} className="inline animate-spin mr-2" />Loading...</>
          ) : (
            useRealData ? 'Use Mock Data' : 'Load Real Visa Data'
          )}
        </button>
        {error && (
          <div className="text-red-600 text-sm ml-4">{error}</div>
        )}
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

      {/* Google Maps */}
      <div className="mb-8">
        <MerchantMap
          merchants={filteredMerchants}
          center={{ lat: 37.8715, lng: -122.2730 }}
          zoom={14}
        />
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
