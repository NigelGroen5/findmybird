"use client";

import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/constants";
import { parseCsvRow } from "@/lib/utils";

interface Bird {
  name: string;
  scientific: string;
  taxon: string;
  family: string;
}

type Props = {
  speciesCode: string | null;
  onClose: () => void;
};

export function BirdInfoModal({ speciesCode, onClose }: Props) {
  const [bird, setBird] = useState<Bird | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!speciesCode) {
      setBird(null);
      setImageUrl(null);
      return;
    }
    async function getSpecies(code: string) {
      setLoading(true);
      setImageUrl(null);
      try {
        const response = await fetch("/birds.csv");
        const data = await response.text();
        const rows = data.split("\n").filter(Boolean);
        const birdRow = rows.slice(1).find((r) => parseCsvRow(r)[2] === code);

        if (!birdRow) {
          setBird(null);
          return;
        }

        const birdValues = parseCsvRow(birdRow);
        const birdObj: Bird = {
          scientific: birdValues[0],
          name: birdValues[1],
          taxon: birdValues[3],
          family: birdValues[7],
        };

        setBird(birdObj);

        const params = new URLSearchParams({
          speciesCode: code,
          commonName: birdObj.name,
          scientificName: birdObj.scientific,
        });
        const res = await fetch(`${API_ENDPOINTS.EBIRD_PHOTO}?${params}`);
        const { imageUrl: url } = await res.json();
        setImageUrl(url ?? null);
      } catch (error) {
        console.error(error);
        setBird(null);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    }

    getSpecies(speciesCode);
  }, [speciesCode]);

  if (!speciesCode) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      aria-label="Close modal"
    >
      <div
        className="bg-gradient-to-br from-white to-emerald-50/30 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-emerald-200/50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bird-modal-title"
      >
        <div className="sticky top-0 bg-gradient-to-br from-white to-emerald-50/30 border-b border-emerald-200/50 px-6 py-4 flex justify-between items-center rounded-t-3xl backdrop-blur-sm">
          <h2 id="bird-modal-title" className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Species Info
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-emerald-100/50 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="p-6">
          {loading && <p className="text-emerald-600 font-medium">Loading…</p>}
          {!loading && !bird && <p className="text-red-600 font-medium">Bird not found</p>}
          {!loading && bird && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-emerald-950">{bird.name}</h3>
                <p className="text-base text-emerald-900">
                  <strong className="text-emerald-700">Scientific name:</strong> {bird.scientific}
                </p>
                <p className="text-base text-emerald-900">
                  <strong className="text-emerald-700">Taxon order:</strong> {bird.taxon}
                </p>
                <p className="text-base text-emerald-900">
                  <strong className="text-emerald-700">Family:</strong> {bird.family}
                </p>
              </div>
              <div className="flex justify-center">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={`Photo of ${bird.name}`}
                    className="w-full max-w-[240px] h-auto rounded-2xl object-cover shadow-lg border-2 border-emerald-100"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
