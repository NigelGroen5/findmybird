"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/constants";
import { useRouter } from "next/navigation";

interface Bird {
  name: string;
  scientific: string;
  taxon: string;
  family: string;
}
export function BackButton(){
  const router = useRouter();
  const [hover, setHover] = useState(false);
  return (
    <button onClick = {() => router.push("/")} 
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
    style = {{
      borderRadius: "10px",
       padding: "10px",
       color: hover ? "#646464" : "#a8a8a8", 
       cursor: "pointer",
      marginBottom: "20px",
       transition: "color 0.3s",
      }}><strong> ← Go back to map</strong>
      </button>
  )
}

export default function BirdInfo() {
  
  const params = useParams();
  const speciesCode = params.speciesCode as string;

  const [bird, setBird] = useState<Bird | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!speciesCode) {
      setLoading(false);
      setBird(null);
      setImageUrl(null);
      return;
    }
    async function getSpecies(code: string) {
      try {
        setImageUrl(null);
        const response = await fetch("/birds.csv");
        const data = await response.text();

        const rows = data.split("\n").filter(Boolean);

        const birdRow = rows
          .slice(1)
          .find((r) => r.split(",")[2] === code);

        if (!birdRow) {
          setBird(null);
          setLoading(false);
          return;
        }

        const birdValues = birdRow.split(",");

        const birdObj: Bird = {
          scientific: birdValues[0], // speciesCode column
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

  return (
    
    <main className="container mx-auto p-6">
    <BackButton />
      {loading && <p className="mt-5">Loading…</p>}
      {!loading && !bird && <p className="mt-5 text-red-500">Bird not found</p>}
      {!loading && bird && (
        <>
        <div className="bg-white rounded-2xl shadow-md p-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-2 text-gray-700">
          <h1 className="text-4xl font-bold mb-3">{bird.name} Species Information</h1>
          <p className="text-lg mb-5">
            <strong>Scientific Name: </strong>
            {bird.scientific}
          </p>

          <p className="text-lg mb-3">
            <strong>Taxon Order: </strong>
            {bird.taxon}
          </p>
          <p className="text-lg mb-3">
            <strong>Family: </strong>
            {bird.family}
          </p>
          </div>
         <div className="flex justify-center">
          {imageUrl && (
            <img src={imageUrl} alt={`Photo of ${bird.name}`} className="w-full max-w-sm rounded-2xl shadow-sm" style={{ width: "100%", height: "auto", borderRadius: "20px"}}/>
          )}
          </div>
          </div>
          </div>
        </>
      )}
    </main>
  );
}
