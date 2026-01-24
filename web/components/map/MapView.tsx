"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Spot } from "@/lib/types";

import UserMarker from "./UserMarker";
import RadiusCircle from "./RadiusCircle";

type MapViewProps = {
  latitude: number;
  longitude: number;
  spots?: Spot[];
};

export default function MapView({ latitude, longitude, spots = [] }: MapViewProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
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
