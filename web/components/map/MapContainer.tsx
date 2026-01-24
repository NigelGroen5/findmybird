"use client";

import { useGeolocation } from "@/hooks/useGeolocation";
import { MapView } from "./MapView";
import { UserMarker } from "./UserMarker";
import { RadiusCircle } from "./RadiusCircle";

const RADIUS_METERS = 15000; // 15km

/**
 * MapContainer component - Client component that handles geolocation and renders the map
 * This is separated from the page to allow for dynamic import with SSR disabled
 */
export default function MapContainer() {
  const { latitude, longitude, loading, error, permissionDenied } =
    useGeolocation();

  // Loading state - requesting location
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Requesting location permission...</p>
          <p className="text-sm text-gray-500 mt-2">
            Please allow location access to view the map
          </p>
        </div>
      </div>
    );
  }

  // Permission denied state
  if (permissionDenied) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-2xl font-bold mb-2">Location Permission Denied</h2>
          <p className="text-gray-600 mb-4">
            To view the map, please enable location access in your browser
            settings and refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Error state - location unavailable
  if (error || latitude === null || longitude === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Location Unavailable</h2>
          <p className="text-gray-600 mb-4">{error || "Unable to retrieve your location"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Success state - render the map
  const center: [number, number] = [latitude, longitude];

  return (
    <div className="h-screen w-screen relative" style={{ height: "100vh", width: "100vw" }}>
      <MapView center={center}>
        <UserMarker position={center} />
        <RadiusCircle center={center} radius={RADIUS_METERS} />
      </MapView>
    </div>
  );
}
