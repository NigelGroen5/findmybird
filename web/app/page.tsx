"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { API_ENDPOINTS } from "@/lib/constants";
import type { Observation, Spot } from "@/lib/types";

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
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"birds" | "spots">("birds");

  async function loadAt(lat: number, lng: number) {
    setError("");
    setLoading(true);
    setCurrentLat(lat);
    setCurrentLng(lng);
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

  // Load birds when geolocation is available
  useEffect(() => {
    if (latitude != null && longitude != null && currentLat === null) {
      loadAt(latitude, longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const displayLat = currentLat ?? latitude;
  const displayLng = currentLng ?? longitude;
  const showMap = displayLat != null && displayLng != null;

  return (
    <main className="flex flex-col bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <h1 className="text-4xl font-bold mb-2">Find My Bird</h1>
        <p className="text-lg text-gray-600 mb-4">Discover bird sightings near you</p>
      </div>

      <div className="flex gap-6 p-6">
        {/* Map Section */}
        {showMap && (
          <div className="h-96 w-1/2 rounded-lg overflow-hidden shadow-md border border-gray-200 flex-shrink-0">
            <MapView latitude={displayLat!} longitude={displayLng!} spots={spots} />
          </div>
        )}

        {/* Birds and Spots List Section */}
        <div className={`${showMap ? "w-1/2" : "flex-1"} flex flex-col bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden`}>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 sticky top-20 z-10 bg-white">
            <button
              onClick={() => setActiveTab("birds")}
              className={`flex-1 px-4 py-3 font-semibold transition ${
                activeTab === "birds"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Bird Sightings ({observations.length})
            </button>
            <button
              onClick={() => setActiveTab("spots")}
              className={`flex-1 px-4 py-3 font-semibold transition ${
                activeTab === "spots"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Hotspots ({spots.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {geoLoading && <p className="text-gray-500">Getting your location...</p>}
            {loading && <p className="text-gray-500">Loading data...</p>}
            {error && !loading && <p className="text-red-500 text-sm">{error}</p>}

            {/* Birds Tab */}
            {activeTab === "birds" && (
              <>
                {observations.length === 0 && !loading && !geoLoading && (
                  <p className="text-gray-400">No birds found. Try a different location.</p>
                )}
                <ul className="space-y-2">
                  {observations.map((o, i) => (
                    <li
                      key={i}
                      className="p-3 bg-gray-50 rounded hover:bg-blue-50 transition flex gap-4 items-center"
                    >
                      {o.imageUrl ? (
                        <>
                          <img
                            src={o.imageUrl}
                            alt={o.commonName}
                            className="w-16 h-16 object-cover rounded-md border"
                            onError={(e) => {
                              console.error(`Failed to load image for ${o.commonName}: ${o.imageUrl}`);
                              e.currentTarget.style.display = 'none';
                              const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500" style={{ display: 'none' }}>
                            No photo
                          </div>
                        </>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                          No photo
                        </div>
                      )}

                      <div>
                        <div className="font-semibold text-gray-900">{o.commonName}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Spots Tab */}
            {activeTab === "spots" && (
              <>
                {spots.length === 0 && !loading && !geoLoading && (
                  <p className="text-gray-400">No hotspots found.</p>
                )}
                <ul className="space-y-2">
                  {spots.map((spot) => (
                    <li key={spot.locId} className="p-3 bg-gray-50 rounded hover:bg-blue-50 transition">
                      <div className="font-semibold text-gray-900">{spot.locName}</div>
                      <div className="text-sm text-gray-600">{spot.numSpeciesAllTime} species recorded</div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}