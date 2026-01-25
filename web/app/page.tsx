"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { API_ENDPOINTS } from "@/lib/constants";
import type { Observation, Spot } from "@/lib/types";
import { LocationBar, type LocationOption } from "@/components/map/LocationBar";
import { BirdInfoModal } from "@/components/bird/BirdInfoModal";
import { Birdle } from "@/components/birdle/Birdle";
import { FlappyBird } from "@/components/flappy/FlappyBird";
import { AngryBirds } from "@/components/angry/AngryBirds";

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
  const [spotsToShow, setSpotsToShow] = useState(5);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [radius, setRadius] = useState(5);
  const [selectedSpeciesCode, setSelectedSpeciesCode] = useState<string | null>(null);

  async function loadAt(lat: number, lng: number, searchRadius?: number) {
    const radiusToUse = searchRadius ?? radius;
    setError("");
    setLoading(true);
    try {
      const [birdsRes, spotsRes] = await Promise.all([
        fetch(
          `${API_ENDPOINTS.EBIRD_RECENT}?lat=${lat}&lng=${lng}&dist=${radiusToUse}&back=7`
        ),
        fetch(
          `${API_ENDPOINTS.EBIRD_HOTSPOTS}?lat=${lat}&lng=${lng}&dist=${radiusToUse}`
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
      
      // Sort spots by numSpeciesAllTime (highest to lowest)
      const sortedSpots = (spotsJson.spots || []).sort((a: Spot, b: Spot) => {
        return b.numSpeciesAllTime - a.numSpeciesAllTime;
      });
      setSpots(sortedSpots);
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
    setSelectedSpotId(null);
    setSpotsToShow(5);
    loadAt(location.latitude, location.longitude);
  };

  const handleUseCurrentLocation = () => {
    setSelectedLocation(null);
    setIsUsingCurrentLocation(true);
    setSelectedSpotId(null);
    setSpotsToShow(5);
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

  const uniqueBirds = observations.reduce((acc, obs) => {
    const existing = acc.get(obs.commonName);
    if (!existing || new Date(obs.observedAt) > new Date(existing.observedAt)) {
      acc.set(obs.commonName, obs);
    }
    return acc;
  }, new Map<string, Observation>());

  const recentBirds = Array.from(uniqueBirds.values()).sort(
    (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
  );

  return (
    <main className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50/40 to-amber-50/30 border-b border-emerald-100/50">
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-6 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-emerald-950 tracking-tight">
                FindMyBird
              </h1>
              <p className="text-emerald-700/80 text-sm font-medium tracking-wide">
                Discover birds near you in real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      <LocationBar
        currentLocation={selectedLocation}
        onLocationChange={handleLocationChange}
        onUseCurrentLocation={handleUseCurrentLocation}
        isUsingCurrentLocation={isUsingCurrentLocation}
        radius={radius}
        onRadiusChange={(newRadius) => {
          setRadius(newRadius);
          if (displayLat != null && displayLng != null) {
            loadAt(displayLat, displayLng, newRadius);
          }
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Map Section */}
          {showMap && (
            <div className="w-1/2 flex-shrink-0">
              <div className="h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-emerald-200/30 bg-white ring-1 ring-emerald-100/20">
                <MapView
                  latitude={displayLat!}
                  longitude={displayLng!}
                  spots={spots.slice(0, spotsToShow)}
                  selectedSpotId={selectedSpotId}
                  onSpotSelect={setSelectedSpotId}
                  radius={radius}
                />
              </div>
            </div>
          )}

          {/* Birds and Spots List Section */}
          <div className={`${showMap ? "w-1/2" : "w-full"} flex flex-col`}>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-200/40 shadow-sm">
              <button
                onClick={() => setActiveTab("birds")}
                className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === "birds"
                    ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/20"
                    : "text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50/50"
                }`}
              >
                Birds ({recentBirds.length})
              </button>
              <button
                onClick={() => setActiveTab("spots")}
                className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === "spots"
                    ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/20"
                    : "text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50/50"
                }`}
              >
                Trending spots ({Math.min(25, spots.length)})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {geoLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-200 border-t-emerald-600"></div>
                  <p className="mt-4 text-sm font-medium text-emerald-700">Getting your location...</p>
                </div>
              )}
              {loading && !geoLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-200 border-t-emerald-600"></div>
                  <p className="mt-4 text-sm font-medium text-emerald-700">Loading data...</p>
                </div>
              )}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 shadow-sm">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {/* Birds Tab */}
              {activeTab === "birds" && !loading && !geoLoading && (
                <>
                  {recentBirds.length === 0 ? (
                    <div className="text-center py-12 bg-white/50 rounded-2xl border border-emerald-100/50">
                      <svg className="w-16 h-16 mx-auto text-emerald-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-sm font-medium text-emerald-600">No birds found. Try a different location.</p>
                    </div>
                  ) : (
                    <div className="max-h-[530px] overflow-y-auto space-y-3 pr-2 pb-2">
                      {recentBirds.map((bird, i) => {
                        const observationDate = new Date(bird.observedAt);
                        const now = new Date();
                        const diffHours = Math.floor((now.getTime() - observationDate.getTime()) / (1000 * 60 * 60));
                        const diffDays = Math.floor(diffHours / 24);

                        let timeAgo = '';
                        if (diffHours < 1) {
                          timeAgo = 'Just now';
                        } else if (diffHours < 24) {
                          timeAgo = `${diffHours}h ago`;
                        } else if (diffDays === 1) {
                          timeAgo = 'Yesterday';
                        } else {
                          timeAgo = `${diffDays}d ago`;
                        }

                        return (
                          <div
                            key={i}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedSpeciesCode(bird.speciesCode)}
                            onKeyDown={(e) => e.key === "Enter" && setSelectedSpeciesCode(bird.speciesCode)}
                            className="group p-4 bg-white rounded-2xl border border-emerald-100/40 hover:border-emerald-300/60 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex gap-4 items-center cursor-pointer"
                          >
                            {bird.imageUrl ? (
                              <>
                                <img
                                  src={bird.imageUrl}
                                  alt={bird.commonName}
                                  className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-100 shadow-md group-hover:shadow-lg transition-shadow"
                                  onError={(e) => {
                                    console.error(`Failed to load image for ${bird.commonName}: ${bird.imageUrl}`);
                                    e.currentTarget.style.display = 'none';
                                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (placeholder) placeholder.style.display = 'flex';
                                  }}
                                />
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center text-xs font-medium text-emerald-700 border-2 border-emerald-100" style={{ display: 'none' }}>
                                  No photo
                                </div>
                              </>
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center text-xs font-medium text-emerald-700 border-2 border-emerald-100">
                                No photo
                              </div>
                            )}

                            <div className="flex-1">
                              <div className="font-semibold text-emerald-950 group-hover:text-emerald-700 transition-colors">{bird.commonName}</div>
                            </div>
                            <div className="text-xs font-medium text-emerald-600/70 ml-2 whitespace-nowrap bg-emerald-50/50 px-2.5 py-1 rounded-full">{timeAgo}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Spots Tab */}
              {activeTab === "spots" && !loading && !geoLoading && (
                <>
                  {spots.length === 0 ? (
                    <div className="text-center py-12 bg-white/50 rounded-2xl border border-emerald-100/50">
                      <svg className="w-16 h-16 mx-auto text-emerald-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm font-medium text-emerald-600">No Trending spots found.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {spots.slice(0, spotsToShow).map((spot) => (
                          <div
                            key={spot.locId}
                            onClick={() => setSelectedSpotId(spot.locId)}
                            className={`group p-4 bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex gap-3 items-center ${
                              selectedSpotId === spot.locId
                                ? "border-teal-400 shadow-xl ring-2 ring-teal-200/50 -translate-y-0.5"
                                : "border-emerald-100/40 hover:border-emerald-300/60 hover:shadow-xl hover:-translate-y-0.5"
                            }`}
                          >
                            {spot.imageUrl && (
                              <img
                                src={spot.imageUrl}
                                alt={spot.locName}
                                className="w-24 h-24 object-cover rounded-xl border-2 border-emerald-100 shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                loading="lazy"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-emerald-950 mb-1.5 group-hover:text-emerald-700 transition-colors">{spot.locName}</div>
                              <div className="text-xs font-medium text-emerald-600/70 bg-emerald-50/50 px-2.5 py-1 rounded-full inline-block">{spot.numSpeciesAllTime} species recorded</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {spots.length > spotsToShow && (
                        <button
                          onClick={() => {
                            if (spotsToShow === 5) {
                              setSpotsToShow(15);
                            } else if (spotsToShow === 15) {
                              setSpotsToShow(25);
                            } else {
                              setSpotsToShow(Math.min(25, spots.length));
                            }
                          }}
                          className="mt-4 w-full px-4 py-3 text-sm font-semibold text-emerald-800 bg-white hover:bg-emerald-50 rounded-2xl border border-emerald-200/50 hover:border-emerald-300 transition-all shadow-sm hover:shadow-md"
                        >
                          {spotsToShow === 5 && `Show top 15 (${Math.min(15, spots.length)})`}
                          {spotsToShow === 15 && `Show top 25 (${Math.min(25, spots.length)})`}
                          {spotsToShow === 25 && spots.length > 25 && `Show all (${Math.min(25, spots.length)})`}
                        </button>
                      )}
                      {spotsToShow > 5 && (
                        <button
                          onClick={() => setSpotsToShow(5)}
                          className="mt-2 w-full px-4 py-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                        >
                          Show less
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">Play Bird Games</h2>
          <p className="text-sm text-emerald-700/70 font-medium">Take a break and enjoy these fun bird-themed games</p>
        </div>
        <div className="flex gap-4 justify-center items-center">
          <Birdle />
          <FlappyBird />
          <AngryBirds />
        </div>
      </div>

      {selectedSpeciesCode && (
        <BirdInfoModal
          speciesCode={selectedSpeciesCode}
          onClose={() => setSelectedSpeciesCode(null)}
        />
      )}
    </main>
  );
}