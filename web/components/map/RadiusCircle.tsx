"use client";

import { Circle } from "react-leaflet";

type RadiusCircleProps = {
  center: [number, number];
  radius: number; // in meters
};

/**
 * RadiusCircle component - Displays a circle with a 15km radius around the user's location
 */
export function RadiusCircle({ center, radius }: RadiusCircleProps) {
  return (
    <Circle
      center={center}
      radius={radius}
      pathOptions={{
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
      }}
    />
  );
}
