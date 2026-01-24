"use client";

import { useState } from "react";

const presets = {
  Montreal: { lat: 45.5017, lng: -73.5673 },
  Toronto: { lat: 43.6532, lng: -79.3832 },
};


export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [observations, setObservations] = useState<any[]>([]);


  async function loadAt(lat: number, lng: number) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/ebird/recent?lat=${lat}&lng=${lng}&dist=10&back=7`
      );
      const json = await res.json();
      setObservations(json.observations || []);
    } catch (e: any) {
      setError(e?.message || "Fetch failed");
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
            `/api/ebird/recent?lat=${latitude}&lng=${longitude}&dist=10&back=7`
          );

          if (!res.ok) {
            const text = await res.text();
            setError(`API error ${res.status}: ${text.slice(0, 120)}`);
            setLoading(false);
            return;
          }

          const json = await res.json();
          setObservations(json.observations || []);
        } catch (e: any) {
          setError(e?.message || "Unknown error");
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
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 36, fontWeight: "bold" }}>Birding</h1>
      <p style={{ marginTop: 12, fontSize: 18 }}>
        Find birds near you.
      </p>

      <button
        onClick={useMyLocation}
        style={{ marginTop: 20, padding: "8px 12px" }}
      >
        Use my location
      </button>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={() => loadAt(presets.Montreal.lat, presets.Montreal.lng)}>
          Use Montreal
        </button>
        <button onClick={() => loadAt(presets.Toronto.lat, presets.Toronto.lng)}>
          Use Toronto
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul style={{ marginTop: 20 }}>
        {observations.slice(0, 10).map((o, i) => (
          <li key={i}>{o.comName}</li>
        ))}
      </ul>
    </main>
  );
}