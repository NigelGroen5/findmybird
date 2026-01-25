"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Spot } from "@/lib/types";

import UserMarker from "./UserMarker";
import RadiusCircle from "./RadiusCircle";

// Component for a hotspot marker with hover popup
function HotspotMarker({ 
  spot, 
  isSelected, 
  defaultIcon, 
  highlightedIcon, 
  onSpotSelect 
}: { 
  spot: Spot; 
  isSelected: boolean; 
  defaultIcon: Icon; 
  highlightedIcon: Icon; 
  onSpotSelect?: (spotId: string | null) => void;
}) {
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <Marker
      position={[spot.lat, spot.lng]}
      icon={isSelected ? highlightedIcon : defaultIcon}
      eventHandlers={{
        mouseover: (e) => {
          // Clear any pending close timeout
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
          e.target.openPopup();
        },
        mouseout: (e) => {
          // Only close if not selected (keep open if clicked)
          if (!isSelected) {
            // Add a small delay before closing to allow moving to popup
            closeTimeoutRef.current = setTimeout(() => {
              e.target.closePopup();
            }, 150);
          }
        },
        click: () => {
          if (onSpotSelect) {
            onSpotSelect(isSelected ? null : spot.locId);
          }
        },
      }}
    >
      <Popup
        eventHandlers={{
          add: (e) => {
            // When popup is added, attach mouse events to popup element
            const popupElement = e.popup?.getElement();
            if (popupElement) {
              const handleMouseEnter = () => {
                // Clear close timeout when mouse enters popup
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                  closeTimeoutRef.current = null;
                }
              };
              
              const handleMouseLeave = () => {
                // Close popup when mouse leaves popup (unless selected)
                if (!isSelected) {
                  closeTimeoutRef.current = setTimeout(() => {
                    const marker = e.popup?._source;
                    if (marker) {
                      marker.closePopup();
                    }
                  }, 150);
                }
              };
              
              popupElement.addEventListener('mouseenter', handleMouseEnter);
              popupElement.addEventListener('mouseleave', handleMouseLeave);
              
              // Cleanup on remove
              e.popup.on('remove', () => {
                popupElement.removeEventListener('mouseenter', handleMouseEnter);
                popupElement.removeEventListener('mouseleave', handleMouseLeave);
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                }
              });
            }
          },
        }}
      >
        <div className="min-w-[200px]">
          {spot.imageUrl && (
            <img
              src={spot.imageUrl}
              alt={spot.locName}
              className="w-full h-32 object-cover rounded-lg mb-2 border border-gray-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              loading="lazy"
            />
          )}
          <div className="text-sm">
            <div className="font-semibold">{spot.locName}</div>
            <div className="text-gray-600">{spot.numSpeciesAllTime} species</div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

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
  radius?: number;
};

export default function MapView({ 
  latitude, 
  longitude, 
  spots = [], 
  selectedSpotId,
  onSpotSelect,
  radius = 10
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
      <RadiusCircle latitude={latitude} longitude={longitude} radiusKm={radius} />

      {spots.map((spot) => {
        const isSelected = selectedSpotId === spot.locId;
        return (
          <HotspotMarker
            key={spot.locId}
            spot={spot}
            isSelected={isSelected}
            defaultIcon={defaultIcon}
            highlightedIcon={highlightedIcon}
            onSpotSelect={onSpotSelect}
          />
        );
      })}
    </MapContainer>
  );
}
