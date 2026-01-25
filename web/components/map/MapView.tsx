"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Spot } from "@/lib/types";

import UserMarker from "./UserMarker";
import RadiusCircle from "./RadiusCircle";

// Fix Leaflet default icon paths for Next.js (must be done before any markers are created)
if (typeof window !== "undefined") {
  delete (Icon.Default.prototype as any)._getIconUrl;
  Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Component to update map center when props change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);

  return null;
}

type MapViewProps = {
  latitude: number;
  longitude: number;
  spots?: Spot[];
};

export default function MapView({ latitude, longitude, spots = [] }: MapViewProps) {
  const center: [number, number] = [latitude, longitude];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <ChangeView center={center} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <UserMarker latitude={latitude} longitude={longitude} />
      <RadiusCircle latitude={latitude} longitude={longitude} />

      {spots.map((spot) => (
        <Marker key={spot.locId} position={[spot.lat, spot.lng]}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{spot.locName}</div>
              <div className="text-gray-600">{spot.numSpeciesAllTime} species</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
