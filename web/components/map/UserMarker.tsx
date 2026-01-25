"use client";

import { Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import { useMemo } from "react";

type UserMarkerProps = {
  latitude: number;
  longitude: number;
};

/**
 * UserMarker component - Displays a marker at the user's location
 * Uses a custom blue divIcon to distinguish from hotspot markers
 */
export default function UserMarker({ latitude, longitude }: UserMarkerProps) {
  // Create a custom blue marker icon for user location
  const userIcon = useMemo(() => {
    return divIcon({
      className: "user-location-marker",
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background-color: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }, []);

  return (
    <Marker position={[latitude, longitude]} icon={userIcon}>
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
