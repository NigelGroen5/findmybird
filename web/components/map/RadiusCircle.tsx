"use client";

import { Circle } from "react-leaflet";

const RADIUS_METERS = 15000; // 15km

type RadiusCircleProps = {
  latitude: number;
  longitude: number;
};

/**
 * RadiusCircle component - Displays a circle with a 15km radius around the user's location
 */
export default function RadiusCircle({ latitude, longitude }: RadiusCircleProps) {
  return (
    <Circle
      center={[latitude, longitude]}
      radius={RADIUS_METERS}
      pathOptions={{
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
      }}
    />
  );
}
