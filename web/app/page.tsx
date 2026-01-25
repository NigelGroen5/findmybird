"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { API_ENDPOINTS } from "@/lib/constants";
import type { Observation, Spot } from "@/lib/types";
import { LocationBar, type LocationOption } from "@/components/map/LocationBar";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <div className="bg-gray-100 rounded flex items-center justify-center">Loading map...</div>,
});

export default function Page() {
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(true);
  const [activeTab, setActiveTab] = useState<"birds" | "spots">("birds");

  async function loadAt(lat: number, lng: number) {
    setError("");
    setLoading(true);
    try {
      const [birdsRes, spotsRes] = await Promise.all([
        fetch(
          `${API_ENDPOINTS.EBIRD_RECENT}?lat=${lat}&lng=${lng}&dist=10&back=7`
        ),
        fetch(
          `${API_ENDPOINTS.EBIRD_HOTSPOTS}?lat=${lat}&lng=${lng}&dist=10`
        ),
      ]);

      if (!birdsRes.ok) {
        const text = await birdsRes.text();
        setError(`API error ${birdsRes.status}: ${text.slice(0, 120)}`);
        setLoading(false);
        return;
      }

      if (!spotsRes.ok) {
        const text = await spotsRes.text();
        setError(`API error ${spotsRes.status}: ${text.slice(0, 120)}`);
        setLoading(false);
        return;
      }

      const birdsJson = await birdsRes.json();
      const spotsJson = await spotsRes.json();
      
      // Debug: log full response
      console.log('Birds API Response:', birdsJson);
      
      // Check for errors in birds response
      if (birdsJson.error) {
        setError(`API Error: ${birdsJson.error}${birdsJson.details ? ` - ${birdsJson.details}` : ''}`);
        setObservations([]);
      } else {
        const obs = birdsJson.observations || [];
        
        // Debug: log photo stats and sample imageUrls
        if (birdsJson.meta?.photoStats) {
          console.log('Photo stats:', birdsJson.meta.photoStats);
        }
        console.log(`Received ${obs.length} observations from API`);
        const withPhotos = obs.filter((o: Observation) => o.imageUrl);
        console.log(`${withPhotos.length} observations have imageUrl`);
        if (withPhotos.length > 0) {
          console.log('Sample imageUrls:', withPhotos.slice(0, 3).map((o: Observation) => ({ name: o.commonName, url: o.imageUrl })));
        }
        
        setObservations(obs);
      }
      
      setSpots(spotsJson.spots || []);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  const handleLocationChange = (location: LocationOption) => {
    setSelectedLocation(location);
    setIsUsingCurrentLocation(false);
    loadAt(location.latitude, location.longitude);
  };

  const handleUseCurrentLocation = () => {
    setSelectedLocation(null);
    setIsUsingCurrentLocation(true);
    if (latitude != null && longitude != null) {
      loadAt(latitude, longitude);
    }
  };

  // Load birds when geolocation is available (only if using current location)
  useEffect(() => {
    if (isUsingCurrentLocation && latitude != null && longitude != null && !loading) {
      loadAt(latitude, longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, isUsingCurrentLocation]);

  // Determine which coordinates to use
  const displayLat = isUsingCurrentLocation ? latitude : selectedLocation?.latitude;
  const displayLng = isUsingCurrentLocation ? longitude : selectedLocation?.longitude;
  const showMap = displayLat != null && displayLng != null;

  return (
    <main className="min-h-screen bg-gray-50/50">
      <LocationBar
        currentLocation={selectedLocation}
        onLocationChange={handleLocationChange}
        onUseCurrentLocation={handleUseCurrentLocation}
        isUsingCurrentLocation={isUsingCurrentLocation}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Map Section */}
          {showMap && (
            <div className="w-1/2 flex-shrink-0">
              <div className="h-[600px] rounded-2xl overflow-hidden shadow-lg border border-gray-200/50 bg-white">
                <MapView latitude={displayLat!} longitude={displayLng!} spots={spots} />
              </div>
            </div>
          )}

          {/* Birds and Spots List Section */}
          <div className={`${showMap ? "w-1/2" : "w-full"} flex flex-col`}>
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-gray-200/50">
              <button
                onClick={() => setActiveTab("birds")}
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === "birds"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Birds ({observations.length})
              </button>
              <button
                onClick={() => setActiveTab("spots")}
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === "spots"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Hotspots ({spots.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {geoLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900"></div>
                  <p className="mt-3 text-sm text-gray-500">Getting your location...</p>
                </div>
              )}
              {loading && !geoLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900"></div>
                  <p className="mt-3 text-sm text-gray-500">Loading data...</p>
                </div>
              )}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Birds Tab */}
              {activeTab === "birds" && !loading && !geoLoading && (
                <>
                  {observations.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-gray-400">No birds found. Try a different location.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {observations.map((o, i) => (
                        <div
                          key={i}
                          className="p-4 bg-white rounded-xl border border-gray-200/50 hover:border-gray-300 hover:shadow-sm transition-all flex gap-4 items-center"
                        >
                          {o.imageUrl ? (
                            <>
                              <img
                                src={o.imageUrl}
                                alt={o.commonName}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  console.error(`Failed to load image for ${o.commonName}: ${o.imageUrl}`);
                                  e.currentTarget.style.display = 'none';
                                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                              />
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500" style={{ display: 'none' }}>
                                No photo
                              </div>
                            </>
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                              No photo
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{o.commonName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Spots Tab */}
              {activeTab === "spots" && !loading && !geoLoading && (
                <>
                  {spots.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-gray-400">No hotspots found.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {spots.map((spot) => (
                        <div
                          key={spot.locId}
                          className="p-4 bg-white rounded-xl border border-gray-200/50 hover:border-gray-300 hover:shadow-sm transition-all"
                        >
                          <div className="font-medium text-gray-900 mb-1">{spot.locName}</div>
                          <div className="text-xs text-gray-500">{spot.numSpeciesAllTime} species recorded</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}