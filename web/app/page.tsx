"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { API_ENDPOINTS } from "@/lib/constants";
import type { Observation, Spot } from "@/lib/types";
import { LocationBar, type LocationOption } from "@/components/map/LocationBar";
import { BirdInfoModal } from "@/components/bird/BirdInfoModal";

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
    <main className="min-h-screen bg-stone-50">
      {/* Hero Header - More Natural */}
      <div className="relative overflow-hidden bg-gradient-to-b from-stone-100 via-emerald-50/30 to-stone-50 border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-8">
          <div className="flex flex-col items-start">
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-3 tracking-tight">
              FindMyBird
            </h1>
            <p className="text-lg text-stone-700 mb-6 max-w-2xl leading-relaxed">
              A simple tool to find birds spotted near you. See what's been seen recently, explore local hotspots, and learn about the birds in your area.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-stone-600">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ontario, Canada
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Updated daily
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                eBird data
              </span>
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
              <div className="h-[600px] rounded-lg overflow-hidden border border-stone-200 bg-white">
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
            <div className="flex gap-1 mb-6 border-b border-stone-200">
              <button
                onClick={() => setActiveTab("birds")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "birds"
                    ? "text-stone-900 border-stone-900"
                    : "text-stone-600 border-transparent hover:text-stone-900 hover:border-stone-300"
                }`}
              >
                Birds ({recentBirds.length})
              </button>
              <button
                onClick={() => setActiveTab("spots")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "spots"
                    ? "text-stone-900 border-stone-900"
                    : "text-stone-600 border-transparent hover:text-stone-900 hover:border-stone-300"
                }`}
              >
                Hotspots ({Math.min(25, spots.length)})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {geoLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-stone-300 border-t-stone-600"></div>
                  <p className="mt-3 text-sm text-stone-600">Getting your location...</p>
                </div>
              )}
              {loading && !geoLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-stone-300 border-t-stone-600"></div>
                  <p className="mt-3 text-sm text-stone-600">Loading data...</p>
                </div>
              )}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Birds Tab */}
              {activeTab === "birds" && !loading && !geoLoading && (
                <>
                  {recentBirds.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-stone-600">No birds found. Try a different location or increase the search radius.</p>
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
                            className="group p-4 bg-white rounded-lg border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all flex gap-4 items-center cursor-pointer"
                          >
                            {bird.imageUrl ? (
                              <>
                                <img
                                  src={bird.imageUrl}
                                  alt={bird.commonName}
                                  className="w-16 h-16 object-cover rounded border border-stone-200"
                                  onError={(e) => {
                                    console.error(`Failed to load image for ${bird.commonName}: ${bird.imageUrl}`);
                                    e.currentTarget.style.display = 'none';
                                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (placeholder) placeholder.style.display = 'flex';
                                  }}
                                />
                                <div className="w-16 h-16 bg-stone-100 rounded flex items-center justify-center text-xs text-stone-500 border border-stone-200" style={{ display: 'none' }}>
                                  No photo
                                </div>
                              </>
                            ) : (
                              <div className="w-16 h-16 bg-stone-100 rounded flex items-center justify-center text-xs text-stone-500 border border-stone-200">
                                No photo
                              </div>
                            )}

                            <div className="flex-1">
                              <div className="font-medium text-stone-900">{bird.commonName}</div>
                            </div>
                            <div className="text-xs text-stone-500 ml-2 whitespace-nowrap">{timeAgo}</div>
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
                    <div className="text-center py-12">
                      <p className="text-sm text-stone-600">No hotspots found. Try a different location.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {spots.slice(0, spotsToShow).map((spot) => (
                          <div
                            key={spot.locId}
                            onClick={() => setSelectedSpotId(spot.locId)}
                            className={`p-4 bg-white rounded-lg border transition-all cursor-pointer flex gap-3 items-center ${
                              selectedSpotId === spot.locId
                                ? "border-stone-400 shadow-md"
                                : "border-stone-200 hover:border-stone-300 hover:shadow-sm"
                            }`}
                          >
                            {spot.imageUrl && (
                              <img
                                src={spot.imageUrl}
                                alt={spot.locName}
                                className="w-20 h-20 object-cover rounded border border-stone-200 flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                loading="lazy"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-stone-900 mb-1">{spot.locName}</div>
                              <div className="text-xs text-stone-600">{spot.numSpeciesAllTime} species recorded</div>
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
                          className="mt-4 w-full px-4 py-2 text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 rounded-lg border border-stone-300 hover:border-stone-400 transition-colors"
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

      {/* About Section - More Natural */}
      <div className="bg-stone-50/50 border-y border-stone-200/40 py-10">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-serif text-stone-900 mb-4">About</h2>
          <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed space-y-4">
            <p>
              This site pulls data from eBird, a global database of bird observations maintained by the Cornell Lab of Ornithology. 
              It shows you recent sightings in your area, helping you discover what birds are around and where to find them.
            </p>
            <p>
              The map shows birding hotspots—places where many species have been recorded over time. Click on any hotspot to see 
              how many species have been seen there. The bird list shows recent observations from the past week, with photos when available.
            </p>
            <p className="text-sm text-stone-600 italic">
              Data is updated daily from eBird. All observations are submitted by birders in the community.
            </p>
          </div>
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