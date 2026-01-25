/**
 * Shared TypeScript types and interfaces
 */

// Example placeholder types
export type Coordinates = {
  lat: number;
  lng: number;
};

export type Observation = {
  commonName: string;
  imageUrl?: string | null;
  // Add more fields as needed
};

export type Spot = {
  locId: string;
  locName: string;
  lat: number;
  lng: number;
  countryCode: string;
  subnational1Code: string;
  subnational2Code: string;
  numSpeciesAllTime: number;
  lastObsDt: string;
  numObservations: number;
};
