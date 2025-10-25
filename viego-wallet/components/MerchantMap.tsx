"use client";

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useState } from 'react';

interface Merchant {
  id: number;
  name: string;
  category: string;
  distance: string;
  address: string;
  acceptsViego: boolean;
  paymentMethods: string[];
  position: {
    lat: number;
    lng: number;
  };
}

interface MerchantMapProps {
  merchants: Merchant[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function MerchantMap({ merchants, center, zoom = 14 }: MerchantMapProps) {
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Default center (Berkeley, CA)
  const defaultCenter = { lat: 37.8715, lng: -122.2730 };
  const mapCenter = center || defaultCenter;

  if (!apiKey) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
        <p className="text-red-600 font-semibold">
          Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border-4 border-white">
        <Map
          defaultCenter={mapCenter}
          defaultZoom={zoom}
          mapId="merchant-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {merchants.map((merchant) => (
            <AdvancedMarker
              key={merchant.id}
              position={merchant.position}
              onClick={() => setSelectedMerchant(merchant)}
            >
              <Pin
                background={merchant.acceptsViego ? "#22c55e" : "#94a3b8"}
                borderColor={merchant.acceptsViego ? "#15803d" : "#64748b"}
                glyphColor={merchant.acceptsViego ? "#dcfce7" : "#f1f5f9"}
              />
            </AdvancedMarker>
          ))}

          {selectedMerchant && (
            <InfoWindow
              position={selectedMerchant.position}
              onCloseClick={() => setSelectedMerchant(null)}
            >
              <div className="p-2">
                <h3 className="font-bold text-gray-900 mb-1">{selectedMerchant.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedMerchant.address}</p>
                <p className="text-xs text-blue-600 font-semibold mb-2">{selectedMerchant.distance}</p>
                {selectedMerchant.acceptsViego ? (
                  <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                    <span className="text-xs font-semibold text-green-700">✓ Accepts Viego Card</span>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
                    <span className="text-xs font-semibold text-gray-600">Viego Card not accepted</span>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </APIProvider>
  );
}
