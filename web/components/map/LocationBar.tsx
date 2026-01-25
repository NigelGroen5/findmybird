"use client";

import { useState } from "react";

export type LocationOption = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type LocationBarProps = {
  currentLocation: LocationOption | null;
  onLocationChange: (location: LocationOption) => void;
  onUseCurrentLocation: () => void;
  isUsingCurrentLocation: boolean;
};

const ONTARIO_CITIES: LocationOption[] = [
  { id: "toronto", name: "Toronto", latitude: 43.6532, longitude: -79.3832 },
  { id: "ottawa", name: "Ottawa", latitude: 45.4215, longitude: -75.6972 },
  { id: "hamilton", name: "Hamilton", latitude: 43.2557, longitude: -79.8711 },
  { id: "london", name: "London", latitude: 42.9849, longitude: -81.2453 },
  { id: "kitchener", name: "Kitchener", latitude: 43.4516, longitude: -80.4925 },
  { id: "windsor", name: "Windsor", latitude: 42.3149, longitude: -83.0364 },
  { id: "sudbury", name: "Sudbury", latitude: 46.4927, longitude: -80.994 },
  { id: "thunder-bay", name: "Thunder Bay", latitude: 48.3809, longitude: -89.2477 },
  { id: "kingston", name: "Kingston", latitude: 44.2312, longitude: -76.486 },
  { id: "guelph", name: "Guelph", latitude: 43.5448, longitude: -80.2482 },
  { id: "barrie", name: "Barrie", latitude: 44.3894, longitude: -79.6903 },
  { id: "sarnia", name: "Sarnia", latitude: 42.9742, longitude: -82.4056 },
];

export function LocationBar({
  currentLocation,
  onLocationChange,
  onUseCurrentLocation,
  isUsingCurrentLocation,
}: LocationBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayText = isUsingCurrentLocation
    ? "my current location"
    : currentLocation?.name || "Select a city";

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm z-50 relative">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium whitespace-nowrap">
            Find Birds near
          </span>
          <div className="relative flex-1 max-w-xs">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-4 py-2 text-left bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
            >
              <span className={isUsingCurrentLocation ? "font-semibold text-blue-600" : ""}>
                {displayText}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-auto">
                  <button
                    onClick={() => {
                      onUseCurrentLocation();
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      isUsingCurrentLocation
                        ? "bg-blue-50 font-semibold text-blue-600"
                        : ""
                    }`}
                  >
                    My Current Location
                  </button>
                  <div className="border-t border-gray-200" />
                  {ONTARIO_CITIES.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        onLocationChange(city);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                        !isUsingCurrentLocation &&
                        currentLocation?.id === city.id
                          ? "bg-blue-50 font-semibold text-blue-600"
                          : ""
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
