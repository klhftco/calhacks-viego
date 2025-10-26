"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, Coffee, ShoppingBag, Utensils, Book, Bus, Heart, CheckCircle, X, RefreshCw } from "lucide-react";
import SpendingAlert from '@/components/SpendingAlert';
import MerchantMap from "@/components/MerchantMap";
import { getMCCCategory } from "@/lib/mccCategories";

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
  contentId?: string;
  terminalTypes: string[];
  position: {
    lat: number;
    lng: number;
  };
}

// Helper function to map icon string names to icon components
function getIconComponent(iconName: string) {
  const iconMap: Record<string, any> = {
    'Coffee': Coffee,
    'ShoppingBag': ShoppingBag,
    'Utensils': Utensils,
    'Book': Book,
    'Bus': Bus,
    'Heart': Heart,
  };
  const icon = iconMap[iconName];
  if (!icon) {
    console.warn(`Icon "${iconName}" not found in iconMap, using ShoppingBag as fallback`);
    return ShoppingBag;
  }
  return icon;
}

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All", icon: MapPin },
    { id: "food", label: "Food", icon: Coffee },
    { id: "shopping", label: "Shopping", icon: ShoppingBag },
    { id: "dining", label: "Dining", icon: Utensils },
    { id: "education", label: "Education", icon: Book },
    { id: "transit", label: "Transit", icon: Bus },
    { id: "entertainment", label: "Entertainment", icon: Heart },
    { id: "services", label: "Services", icon: ShoppingBag },
  ];

  const [realMerchants, setRealMerchants] = useState<Merchant[]>([]);

  // Fetch real merchant data from Visa API
  const fetchRealMerchants = async (category?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const transformMerchant = (m: any, index: number): Merchant => {
        // Normalize MCC codes to always be an array
        const mccCodes = Array.isArray(m.merchantCategoryCode)
          ? m.merchantCategoryCode
          : m.merchantCategoryCode
            ? [m.merchantCategoryCode]
            : [];

        // Get category info based on MCC codes
        const categoryInfo = getMCCCategory(mccCodes);
        const IconComponent = getIconComponent(categoryInfo.icon);

        // Map terminal type values to friendly names
        const terminalTypes: string[] = [];
        if (m.terminalType) {
          const types = Array.isArray(m.terminalType) ? m.terminalType : [m.terminalType];
          types.forEach((type: string) => {
            if (type.toLowerCase().includes('swipe') || type.toLowerCase().includes('magnetic')) {
              terminalTypes.push('Swipe');
            }
            if (type.toLowerCase().includes('chip') || type.toLowerCase().includes('emv')) {
              terminalTypes.push('Chip');
            }
            if (type.toLowerCase().includes('contactless') || type.toLowerCase().includes('nfc') || type.toLowerCase().includes('tap')) {
              terminalTypes.push('Contactless');
            }
          });
        }

        // Default terminal types if none found
        if (terminalTypes.length === 0) {
          terminalTypes.push('Chip', 'Contactless');
        }

        // Parse and validate coordinates
        const lat = parseFloat(m.locationAddressLatitude);
        const lng = parseFloat(m.locationAddressLongitude);
        const validLat = !isNaN(lat) ? lat : 37.8715;
        const validLng = !isNaN(lng) ? lng : -122.2730;

        const merchant = {
          id: index + 1,
          name: m.visaStoreName || m.visaMerchantName || 'Unknown Merchant',
          category: categoryInfo.category,
          distance: m.distance || 'N/A',
          address: m.merchantStreetAddress || `${m.merchantCity}, ${m.merchantState}`,
          acceptsViego: true,
          icon: IconComponent,
          color: categoryInfo.color,
          paymentMethods: [],
          terminalTypes: Array.from(new Set(terminalTypes)),
          position: {
            lat: validLat,
            lng: validLng,
          },
        };

        // Enhanced logging for debugging
        console.log(`[Merchant ${index + 1}] ${merchant.name}:`, {
          mccCodes: mccCodes.join(', ') || 'none',
          category: merchant.category,
          icon: categoryInfo.icon,
          position: `${validLat}, ${validLng}`,
          hasValidPosition: !isNaN(lat) && !isNaN(lng)
        });

        return merchant;
      };

      // If "all" category, fetch until we have 25 merchants total
      if (!category || category === 'all') {
        console.log('=== Fetching merchants for "All" category ===');
        const allMerchants: Merchant[] = [];
        let startIndex = 0;
        const maxAttempts = 5; // Increased to get more merchants
        let attempts = 0;

        while (allMerchants.length < 25 && attempts < maxAttempts) {
          console.log(`Attempt ${attempts + 1}: Fetching from startIndex ${startIndex}...`);
          const response = await fetch(
            `/api/merchants?latitude=37.871966&longitude=-122.259960&distance=5&maxRecords=25&startIndex=${startIndex}`
          );
          const data = await response.json();

          if (!data.success || !data.merchants || data.merchants.length === 0) {
            console.log(`No more merchants returned (success: ${data.success}, count: ${data.merchants?.length || 0})`);
            break; // No more merchants available
          }

          console.log(`Received ${data.merchants.length} merchants from API`);
          const batch = data.merchants.map((m: any, idx: number) => {
            return transformMerchant(m, allMerchants.length + idx);
          });
          allMerchants.push(...batch);
          console.log(`Total accumulated: ${allMerchants.length} merchants`);

          startIndex += 25;
          attempts++;

          // If we got fewer than 25 merchants in this batch, we've reached the end
          if (data.merchants.length < 25) {
            console.log(`Received fewer than 25 merchants, reached end of results`);
            break;
          }
        }

        console.log(`=== SUMMARY: Fetched ${allMerchants.length} total merchants for "All" ===`);
        console.log('Category breakdown:', allMerchants.reduce((acc, m) => {
          acc[m.category] = (acc[m.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>));

        // Take exactly 25 merchants
        const merchantsToDisplay = allMerchants.slice(0, 25);
        console.log(`Setting ${merchantsToDisplay.length} merchants to display`);
        setRealMerchants(merchantsToDisplay);
      } else {
        // For specific category, fetch in batches until we have 25 of that category
        console.log(`=== Fetching merchants for "${category}" category ===`);
        const categoryMerchants: Merchant[] = [];
        let startIndex = 0;
        const maxAttempts = 10; // Limit to prevent infinite loops
        let attempts = 0;

        while (categoryMerchants.length < 25 && attempts < maxAttempts) {
          console.log(`Attempt ${attempts + 1}: Fetching from startIndex ${startIndex}...`);
          const response = await fetch(
            `/api/merchants?latitude=37.871966&longitude=-122.259960&distance=5&maxRecords=25&startIndex=${startIndex}`
          );
          const data = await response.json();

          if (!data.success || !data.merchants || data.merchants.length === 0) {
            console.log(`No more merchants returned (success: ${data.success}, count: ${data.merchants?.length || 0})`);
            break; // No more merchants available
          }

          console.log(`Received ${data.merchants.length} merchants from API`);
          // Transform and filter by category
          const batch = data.merchants
            .map((m: any, idx: number) => transformMerchant(m, startIndex + idx))
            .filter((m: Merchant) => m.category === category);

          console.log(`${batch.length} merchants matched "${category}" category`);
          categoryMerchants.push(...batch);
          console.log(`Total accumulated for "${category}": ${categoryMerchants.length} merchants`);

          startIndex += 25;
          attempts++;

          // If we got fewer than 25 merchants in this batch, we've reached the end
          if (data.merchants.length < 25) {
            console.log(`Received fewer than 25 merchants, reached end of results`);
            break;
          }
        }

        console.log(`=== SUMMARY: Fetched ${categoryMerchants.length} merchants for "${category}" ===`);
        // Take only the first 25 merchants of the selected category
        const merchantsToDisplay = categoryMerchants.slice(0, 25);
        console.log(`Setting ${merchantsToDisplay.length} merchants to display`);
        setRealMerchants(merchantsToDisplay);
      }
    } catch (err) {
      setError('Failed to connect to Visa API');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load real merchant data on page load and when category changes
  useEffect(() => {
    fetchRealMerchants(selectedCategory);
  }, [selectedCategory]);

  // Use real merchant data
  const displayMerchants = realMerchants;

  const filteredMerchants = displayMerchants.filter((merchant) => {
    const matchesSearch = merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         merchant.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || merchant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Merchant Map</h1>
        <p className="text-gray-600">Find nearby merchants and student essentials</p>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <MapPin size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{displayMerchants.length} Merchants Near You</h3>
              <p className="text-white/90">Within 5 miles of Berkeley, CA</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{filteredMerchants.length}</p>
            <p className="text-white/90">Currently showing</p>
          </div>
        </div>
      </div>

      {/* Loading/Error Status */}
      {isLoading && (
        <div className="mb-6 flex items-center justify-center bg-blue-50 p-4 rounded-xl shadow-md">
          <RefreshCw size={20} className="inline animate-spin mr-2 text-blue-600" />
          <span className="text-blue-700 font-semibold">Loading merchants from Visa API...</span>
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 p-4 rounded-xl shadow-md">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search merchants or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-lg text-gray-900"
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
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-xl cursor-pointer"
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

                  {/* Terminal Types */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Terminal types:</p>
                    <div className="flex flex-wrap gap-2">
                      {merchant.terminalTypes.map((type) => (
                        <span
                          key={type}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            type === "Contactless"
                              ? 'bg-blue-100 text-blue-700'
                              : type === "Chip"
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Offers & spending check button */}
                  <div className="mt-4">
                    <button
                      onClick={() => setSelectedMerchant(merchant)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                    >
                      Check offers & limits
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {selectedMerchant && (
        <div className="mt-6">
          <SpendingAlert merchant={selectedMerchant} onClose={() => setSelectedMerchant(null)} />
        </div>
      )}
    </div>
  );
}
