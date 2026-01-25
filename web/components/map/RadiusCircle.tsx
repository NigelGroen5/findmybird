"use client";

import { Circle } from "react-leaflet";

type RadiusCircleProps = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
};

/**
 * RadiusCircle component - Displays a circle around the user's location
 */
export default function RadiusCircle({ latitude, longitude, radiusKm = 5 }: RadiusCircleProps) {
  const radiusMeters = radiusKm * 1000;
  return (
    <Circle
      center={[latitude, longitude]}
      radius={radiusMeters}
      pathOptions={{
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
      }}
    />
  );
}
