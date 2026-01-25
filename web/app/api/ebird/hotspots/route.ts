import { NextResponse } from "next/server";
import { asNum } from "@/lib/utils";

// Cache for location photos
const locationPhotoCache = new Map<string, string | null>();

/**
 * Fetch a photo of a location (park, nature reserve, etc.) from Wikipedia
 * Uses location context to improve search accuracy
 */
async function getLocationPhoto(locationName: string, countryCode?: string, subnational1Code?: string): Promise<string | null> {
  // Check cache first
  const cacheKey = locationName.toLowerCase().trim();
  if (locationPhotoCache.has(cacheKey)) {
    return locationPhotoCache.get(cacheKey)!;
  }

  try {
    // Clean up location name
    const cleanName = locationName
      .replace(/\s+(Park|Reserve|Conservation|Area|Wildlife|Refuge|Sanctuary|Trail|Pathway|Pond|Lake|River|Creek|Bay|Beach|Marsh|Wetland|Swamp|Bog|Fen)$/i, '')
      .trim();
    
    // Build search variations with location context
    const searchVariations: string[] = [
      locationName, // Try exact name first
      cleanName, // Without common suffixes
    ];

    // Add variations with common park terms
    if (!locationName.toLowerCase().includes('park')) {
      searchVariations.push(`${cleanName} Park`);
    }
    if (!locationName.toLowerCase().includes('reserve')) {
      searchVariations.push(`${cleanName} Nature Reserve`);
    }
    if (!locationName.toLowerCase().includes('conservation')) {
      searchVariations.push(`${cleanName} Conservation Area`);
    }

    // Add location context if available (e.g., "Central Park, New York")
    if (subnational1Code) {
      // subnational1Code is usually a state/province code, try to expand it
      // For now, just add it as-is since we don't have a mapping
      searchVariations.push(`${locationName}, ${subnational1Code}`);
      searchVariations.push(`${cleanName} Park, ${subnational1Code}`);
    }

    // Try each variation
    for (const searchName of searchVariations) {
      try {
        const encodedName = encodeURIComponent(searchName.replace(/\s+/g, '_').replace(/,/g, ''));
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedName}`;
        const wikiRes = await fetch(wikiUrl, {
          headers: { "User-Agent": "find-my-bird/1.0" },
        });

        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          // Check if it's a valid page (not disambiguation or missing)
          if (wikiData.type === 'standard' && !wikiData.title.toLowerCase().includes('disambiguation')) {
            const imageUrl = wikiData?.originalimage?.source || wikiData?.thumbnail?.source || null;
            if (imageUrl) {
              console.log(`✓ Found Wikipedia image for "${locationName}" (searched as "${searchName}")`);
              locationPhotoCache.set(cacheKey, imageUrl);
              return imageUrl;
            }
          }
        }
      } catch (e) {
        // Try next variation
        continue;
      }
    }

    // If no Wikipedia page found, return null (don't use fallback)
    console.log(`✗ No Wikipedia image found for "${locationName}"`);
    locationPhotoCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error(`Error fetching location photo for ${locationName}:`, error);
    locationPhotoCache.set(cacheKey, null);
    return null;
  }
}

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

  // Fetch location photos for each hotspot (with timeout to prevent slow responses)
  const spotsWithPhotos = await Promise.all(
    spots.map(async (spot) => {
      try {
        const photo = await Promise.race([
          getLocationPhoto(spot.locName, spot.countryCode, spot.subnational1Code),
          new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);

        return {
          ...spot,
          imageUrl: photo,
        };
      } catch (e) {
        console.error(`Error fetching photo for hotspot ${spot.locId}:`, e);
        return {
          ...spot,
          imageUrl: null,
        };
      }
    })
  );

  return NextResponse.json({ spots: spotsWithPhotos });
}
