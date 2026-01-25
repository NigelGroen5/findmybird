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
  radius?: number;
  onRadiusChange?: (radius: number) => void;
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
  radius = 10,
  onRadiusChange,
}: LocationBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayText = isUsingCurrentLocation
    ? "My current location"
    : currentLocation?.name || "Select a city";

  return (
    <div className="bg-white/60 backdrop-blur-md border-b border-emerald-100/30 sticky top-0 z-50 relative shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-emerald-700/70 font-medium tracking-wide">
            Searching near
          </span>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-5 py-2.5 text-sm font-semibold text-emerald-900 bg-white/90 border border-emerald-200/60 rounded-full hover:border-emerald-300 hover:shadow-md hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 flex items-center gap-2"
            >
              <span className={isUsingCurrentLocation ? "text-emerald-900" : "text-emerald-800"}>
                {displayText}
              </span>
              <svg
                className={`w-4 h-4 text-emerald-600 transition-transform duration-200 ${
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
                <div className="absolute z-20 w-56 mt-2 bg-white border border-emerald-200/40 rounded-2xl shadow-2xl max-h-96 overflow-auto">
                  <button
                    onClick={() => {
                      onUseCurrentLocation();
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors rounded-t-2xl ${
                      isUsingCurrentLocation
                        ? "bg-emerald-50 text-emerald-900 font-semibold"
                        : "text-emerald-800 hover:bg-emerald-50/50"
                    }`}
                  >
                    My Current Location
                  </button>
                  <div className="border-t border-emerald-100/50" />
                  {ONTARIO_CITIES.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        onLocationChange(city);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        !isUsingCurrentLocation &&
                        currentLocation?.id === city.id
                          ? "bg-emerald-50 text-emerald-900 font-semibold"
                          : "text-emerald-800 hover:bg-emerald-50/50"
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Radius Control */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-emerald-200/50">
            <span className="text-xs text-emerald-700/70 font-semibold tracking-wide">Radius:</span>
            {[5, 10, 15, 25].map((r) => (
              <button
                key={r}
                onClick={() => onRadiusChange?.(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                  radius === r
                    ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/20"
                    : "bg-emerald-100/60 text-emerald-800 hover:bg-emerald-200/60"
                }`}
              >
                {r}km
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
