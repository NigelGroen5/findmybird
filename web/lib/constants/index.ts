/**
 * Shared constants
 */

// Example placeholder constants
export const DEFAULT_LOCATION = {
  lat: 45.5017,
  lng: -73.5673,
} as const;

export const API_ENDPOINTS = {
  EBIRD_RECENT: "/api/ebird/recent",
  EBIRD_HOTSPOTS: "/api/ebird/hotspots",
  EBIRD_PHOTO: "/api/ebird/photo", // ← add this line
} as const;
