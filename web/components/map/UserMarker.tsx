"use client";

import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { useEffect } from "react";

type UserMarkerProps = {
  latitude: number;
  longitude: number;
};

/**
 * UserMarker component - Displays a marker at the user's location
 * Fixes the default marker icon issue with Next.js/Leaflet
 */
export default function UserMarker({ latitude, longitude }: UserMarkerProps) {
  useEffect(() => {
    // Fix for default marker icon issue in Next.js
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

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
