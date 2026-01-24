import dynamic from "next/dynamic";

/**
 * Map page route - Server component that dynamically imports the map
 * Using dynamic import with ssr: false to avoid SSR issues with Leaflet
 */
const MapContainer = dynamic(
  () => import("@/components/map/MapContainer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  return <MapContainer />;
}
