"use client";

import { useState } from "react";
import { API_ENDPOINTS } from "@/lib/constants";
import type { Observation } from "@/lib/types";

const presets = {
  Montreal: { lat: 45.5017, lng: -73.5673 },
  Toronto: { lat: 43.6532, lng: -79.3832 },
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [observations, setObservations] = useState<Observation[]>([]);

  async function loadAt(lat: number, lng: number) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${API_ENDPOINTS.EBIRD_RECENT}?lat=${lat}&lng=${lng}&dist=10&back=7`
      );
      const json = await res.json();
      setObservations(json.observations || []);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  async function useMyLocation() {
    setError("");
    setLoading(true);

    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          const res = await fetch(
            `${API_ENDPOINTS.EBIRD_RECENT}?lat=${latitude}&lng=${longitude}&dist=10&back=7`
          );

          if (!res.ok) {
            const text = await res.text();
            setError(`API error ${res.status}: ${text.slice(0, 120)}`);
            setLoading(false);
            return;
          }

          const json = await res.json();
          setObservations(json.observations || []);
        } catch (e: unknown) {
          const error = e as Error;
          setError(error?.message || "Unknown error");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
    );
  }

  return (
    <main className="container mx-auto p-10">
      <h1 className="text-4xl font-bold mb-3">Birding</h1>
      <p className="text-lg mb-5">Find birds near you.</p>

      <button
        onClick={useMyLocation}
        className="mt-5 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Use my location
      </button>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => loadAt(presets.Montreal.lat, presets.Montreal.lng)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Use Montreal
        </button>
        <button
          onClick={() => loadAt(presets.Toronto.lat, presets.Toronto.lng)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Use Toronto
        </button>
      </div>

      {loading && <p className="mt-5">Loading…</p>}
      {error && <p className="mt-5 text-red-500">{error}</p>}

      <ul className="mt-5 list-disc list-inside">
        {observations.slice(0, 10).map((o, i) => (
          <li key={i}>{o.comName}</li>
        ))}
      </ul>
    </main>
  );
}