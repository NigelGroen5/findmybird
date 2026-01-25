"use client";

import { Marker, Popup } from "react-leaflet";

type UserMarkerProps = {
  latitude: number;
  longitude: number;
};

/**
 * UserMarker component - Displays a marker at the user's location
 */
export default function UserMarker({ latitude, longitude }: UserMarkerProps) {
  return (
    <Marker position={[latitude, longitude]}>
      <Popup>
        <div className="text-center">
          <strong>Your Location</strong>
          <br />
          <span className="text-sm text-gray-600">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        </div>
      </Popup>
    </Marker>
  );
}
