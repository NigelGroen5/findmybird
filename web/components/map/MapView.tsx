"use client";

import { MapContainer as LeafletMapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type MapViewProps = {
  center: [number, number];
  zoom?: number;
  children?: React.ReactNode;
};

/**
 * MapView component - Renders the Leaflet map container with OpenStreetMap tiles
 * This is a client component that wraps Leaflet's MapContainer and TileLayer
 */
export function MapView({ center, zoom = 13, children }: MapViewProps) {
  return (
    <LeafletMapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100vh", width: "100vw", zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </LeafletMapContainer>
  );
}
