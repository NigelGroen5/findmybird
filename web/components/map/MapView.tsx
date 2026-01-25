"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Spot } from "@/lib/types";

import UserMarker from "./UserMarker";
import RadiusCircle from "./RadiusCircle";

// Component to update map center when props change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);

  return null;
}

// Component to pan to selected spot
function PanToSpot({ spot }: { spot: Spot | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (spot) {
      map.setView([spot.lat, spot.lng], Math.max(map.getZoom(), 14), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [map, spot]);

  return null;
}

type MapViewProps = {
  latitude: number;
  longitude: number;
  spots?: Spot[];
  selectedSpotId?: string | null;
  onSpotSelect?: (spotId: string | null) => void;
};

export default function MapView({ 
  latitude, 
  longitude, 
  spots = [], 
  selectedSpotId,
  onSpotSelect 
}: MapViewProps) {
  const center: [number, number] = [latitude, longitude];
  const selectedSpot = spots.find(s => s.locId === selectedSpotId) || null;

  // Create custom icons for normal and highlighted markers
  const defaultIcon = new Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const highlightedIcon = new Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [35, 55],
    iconAnchor: [17, 55],
    popupAnchor: [1, -34],
    className: "highlighted-marker",
  });

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <ChangeView center={center} />
      {selectedSpot && <PanToSpot spot={selectedSpot} />}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <UserMarker latitude={latitude} longitude={longitude} />
      <RadiusCircle latitude={latitude} longitude={longitude} />

      {spots.map((spot) => {
        const isSelected = selectedSpotId === spot.locId;
        return (
          <Marker
            key={spot.locId}
            position={[spot.lat, spot.lng]}
            icon={isSelected ? highlightedIcon : defaultIcon}
            eventHandlers={{
              click: () => {
                if (onSpotSelect) {
                  onSpotSelect(isSelected ? null : spot.locId);
                }
              },
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{spot.locName}</div>
                <div className="text-gray-600">{spot.numSpeciesAllTime} species</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
