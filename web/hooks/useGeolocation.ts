"use client";

import { useEffect, useState } from "react";

type GeolocationState = {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
};

/**
 * Custom hook for handling browser geolocation
 * Handles all permission states: loading, denied, error, and success
 */
export function useGeolocation(): GeolocationState {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  useEffect(() => {
    // Check if geolocation is supported
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    // Request geolocation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success: user granted permission and location is available
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLoading(false);
        setError(null);
        setPermissionDenied(false);
      },
      (err) => {
        // Handle different error cases
        setLoading(false);
        setLatitude(null);
        setLongitude(null);

        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermissionDenied(true);
            setError("Location permission denied. Please enable location access.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out.");
            break;
          default:
            setError("An unknown error occurred while retrieving location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return {
    latitude,
    longitude,
    loading,
    error,
    permissionDenied,
  };
}
