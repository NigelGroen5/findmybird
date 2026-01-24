import { NextResponse } from "next/server";
import { asNum } from "@/lib/utils";

export async function GET(req: Request) {
  const key = process.env.EBIRD_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Missing EBIRD_API_KEY in environment" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const lat = asNum(url.searchParams.get("lat"), 45.5017);
  const lng = asNum(url.searchParams.get("lng"), -73.5673);
  const dist = asNum(url.searchParams.get("dist"), 10);

  const ebirdUrl =
    `https://api.ebird.org/v2/ref/hotspot/geo` +
    `?lat=${encodeURIComponent(lat)}` +
    `&lng=${encodeURIComponent(lng)}` +
    `&dist=${encodeURIComponent(dist)}`;

  const resp = await fetch(ebirdUrl, {
    headers: {
      "X-eBirdApiToken": key,
    },
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json(
      {
        error: "eBird request failed",
        status: resp.status,
        details: text.slice(0, 300),
      },
      { status: 502 }
    );
  }

  const csvText = await resp.text();
  
  // Parse CSV format: locId,countryCode,subnational1Code,subnational2Code,lat,lng,locName,lastObsDt,numSpeciesAllTime,numObservations
  const lines = csvText.trim().split("\n");
  const spots = lines.map((line) => {
    // Handle quoted fields (locName might contain commas)
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        parts.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    parts.push(current);

    return {
      locId: parts[0],
      countryCode: parts[1],
      subnational1Code: parts[2],
      subnational2Code: parts[3],
      lat: parseFloat(parts[4]),
      lng: parseFloat(parts[5]),
      locName: parts[6].replace(/"/g, ""),
      lastObsDt: parts[7],
      numSpeciesAllTime: parseInt(parts[8], 10),
      numObservations: parseInt(parts[9], 10),
    };
  });

  return NextResponse.json({ spots });
}
