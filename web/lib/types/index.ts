/**
 * Shared TypeScript types and interfaces
 */

// Example placeholder types
export type Coordinates = {
  lat: number;
  lng: number;
};

export type Observation = {
  id: string;
  speciesCode: string;
  commonName: string;
  scientificName: string;
  count: number | null;
  observedAt: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
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
