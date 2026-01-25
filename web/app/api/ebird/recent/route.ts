import { NextResponse } from "next/server";
import { asNum } from "@/lib/utils";

const photoCache = new Map<string, string | null>();

async function getBirdPhoto(speciesCode: string, commonName?: string, scientificName?: string): Promise<string | null> {
  if (photoCache.has(speciesCode)) {
    return photoCache.get(speciesCode)!;
  }

  try {
    let imageUrl: string | null = null;

    // Method 1: Try Wikipedia/Wikimedia Commons first (more reliable)
    if (commonName) {
      try {
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(commonName.replace(/\s+/g, '_'))}`;
        const wikiRes = await fetch(wikiUrl, {
          headers: {
            "User-Agent": "find-my-bird/1.0",
          },
        });
        
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          // Verify it's actually about a bird (check if it's a disambiguation or wrong page)
          if (wikiData.type === 'standard' && !wikiData.title.toLowerCase().includes('disambiguation')) {
            imageUrl = wikiData?.thumbnail?.source || wikiData?.originalimage?.source || null;
            if (imageUrl) {
              // Resize Wikipedia thumbnail to a reasonable size
              if (imageUrl.includes('thumb/')) {
                imageUrl = imageUrl.replace(/\/\d+px-/, '/300px-');
              }
              console.log(`✓ Found Wikipedia image for ${speciesCode} (${commonName})`);
              photoCache.set(speciesCode, imageUrl);
              return imageUrl;
            }
          }
        }
      } catch (e) {
        // Continue to next method
      }
    }

    // Method 2: Try Macaulay Library search API with taxonCode
    try {
      const url = `https://search.macaulaylibrary.org/api/v1/search?taxonCode=${encodeURIComponent(speciesCode)}&mediaType=photo&pageSize=1&sort=rating_rank_desc`;
      
      const res = await fetch(url, {
        headers: {
          "User-Agent": "find-my-bird",
          "Accept": "application/json",
        },
      });

      if (res.ok) {
        const json = await res.json();
        
        // Debug: log the full response structure for first request
        if (!photoCache.has('_debug_logged')) {
          console.log(`Macaulay Library API response for ${speciesCode}:`, JSON.stringify(json, null, 2).slice(0, 1000));
          photoCache.set('_debug_logged', 'true');
        }
        
        const results = json?.results || json?.data || json || [];
        const result = Array.isArray(results) ? results[0] : results;
        
        if (result) {
          // Try all possible field names
          imageUrl = result.mediaUrl || result.assetUrl || result.url || result.downloadUrl 
            || result.thumbnailUrl || result.imageUrl || result.photoUrl || null;
          
          // Check nested objects
          if (!imageUrl && result.media) {
            imageUrl = result.media.url || result.media.mediaUrl || result.media.assetUrl || null;
          }
          if (!imageUrl && result.asset) {
            imageUrl = result.asset.url || result.asset.mediaUrl || null;
          }
          if (!imageUrl && result.thumbnail) {
            imageUrl = result.thumbnail.url || result.thumbnail.mediaUrl || null;
          }
          
          // Try constructing from asset ID
          const assetId = result.assetId || result.id || result.mediaId || result.asset?.id;
          if (!imageUrl && assetId) {
            const numericId = String(assetId).replace(/^ML/i, '');
            if (/^\d+$/.test(numericId)) {
              imageUrl = `https://cdn.download.ams.birds.cornell.edu/api/v2/asset/${numericId}/thumb/640`;
            }
          }
          
          if (imageUrl) {
            console.log(`✓ Found Macaulay Library image for ${speciesCode}`);
          } else {
            console.warn(`No image URL found for ${speciesCode} in Macaulay Library. Available keys:`, Object.keys(result));
          }
        }
      } else {
        console.error(`Macaulay Library API error for ${speciesCode}: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      console.error(`Error querying Macaulay Library for ${speciesCode}:`, e);
    }

    // Ensure URL is absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https://search.macaulaylibrary.org${imageUrl}`;
    }

    photoCache.set(speciesCode, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error(`Error fetching photo for ${speciesCode}:`, error);
    photoCache.set(speciesCode, null);
    return null;
  }
}

const RATE_LIMIT = 30; // requests
const WINDOW_MS = 60_000;

const rateMap = new Map<string, { count: number; ts: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now - entry.ts > WINDOW_MS) {
    rateMap.set(ip, { count: 1, ts: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

// Cache eBird responses per location
const obsCache = new Map<
  string,
  { ts: number; data: any } // ts = timestamp, data = observationsWithPhotos
>();


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
  const back = asNum(url.searchParams.get("back"), 7);

  const cacheKey = `${lat}:${lng}:${dist}:${back}`;

  const ip = req.headers.get("x-forwarded-for") ?? "local";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }


  const ebirdUrl =
    `https://api.ebird.org/v2/data/obs/geo/recent` +
    `?lat=${encodeURIComponent(lat)}` +
    `&lng=${encodeURIComponent(lng)}` +
    `&dist=${encodeURIComponent(dist)}` +
    `&back=${encodeURIComponent(back)}`;

  const resp = await fetch(ebirdUrl, {
    headers: {
      "X-eBirdApiToken": key,
    },
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`eBird API error: ${resp.status} ${resp.statusText}`, text.slice(0, 300));
    return NextResponse.json(
      {
        error: "eBird request failed",
        status: resp.status,
        details: text.slice(0, 300),
      },
      { status: 502 }
    );
  }

  const data = await resp.json();
  console.log(`eBird API response: received ${Array.isArray(data) ? data.length : 'non-array'} items`);

  // Check if we got any data from eBird
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('eBird API returned no observations');
    return NextResponse.json({
      meta: {
        count: 0,
        cached: false,
      },
      observations: [],
    });
  }

  console.log(`eBird API returned ${data.length} observations`);

  // Create a map of species codes to their names (for photo lookup)
  const speciesInfoMap = new Map<string, { commonName: string; scientificName: string }>();
  data.forEach((o: any) => {
    if (!speciesInfoMap.has(o.speciesCode)) {
      speciesInfoMap.set(o.speciesCode, {
        commonName: o.comName,
        scientificName: o.sciName,
      });
    }
  });

  // Attach photos (limit unique species to avoid spam)
  const uniqueSpecies = Array.from(
    new Set(data.map((o: any) => o.speciesCode))
  ).slice(0, 20);

  const photoMap = new Map<string, string | null>();
  

  const photoDebug: Record<string, { found: boolean; url: string | null }> = {};
  
  // Fetch photos with timeout to prevent blocking
  try {
    await Promise.all(
      uniqueSpecies.map(async (code) => {
        try {
          const speciesInfo = speciesInfoMap.get(code as string);
          const photo = await Promise.race([
            getBirdPhoto(
              code as string,
              speciesInfo?.commonName,
              speciesInfo?.scientificName
            ),
            new Promise<string | null>((resolve) => 
              setTimeout(() => resolve(null), 5000) // 5 second timeout per photo
            )
          ]);
          photoMap.set(code as string, photo);
          photoDebug[code] = { found: !!photo, url: photo };
          // Debug logging
          if (photo) {
            console.log(`✓ Found photo for ${code} (${speciesInfo?.commonName || 'unknown'}): ${photo}`);
          } else {
            console.log(`✗ No photo found for ${code} (${speciesInfo?.commonName || 'unknown'})`);
          }
        } catch (error) {
          console.error(`Error fetching photo for ${code}:`, error);
          photoMap.set(code as string, null);
          photoDebug[code] = { found: false, url: null };
        }
      })
    );
  } catch (error) {
    console.error('Error in photo fetching batch:', error);
    // Continue anyway - photos are optional
  }
  
  // Log summary
  const foundCount = Object.values(photoDebug).filter(p => p.found).length;
  console.log(`Photo fetch summary: ${foundCount}/${uniqueSpecies.length} species have photos`);

  interface NormalizedObservation {
    id: string;           // unique ID (species + timestamp)
    speciesCode: string;  // eBird species code
    commonName: string;   // eBird common name
    scientificName: string; // scientific name
    count: number | null;   // how many birds seen
    observedAt: string;     // timestamp of observation
    lat: number;
    lng: number;
    imageUrl: string | null;
  }

  const normalizedObservations: NormalizedObservation[] = data.map((o: any) => ({
    id: `${o.speciesCode}-${o.obsDt}`,
    speciesCode: o.speciesCode,
    commonName: o.comName,
    scientificName: o.sciName,
    count: o.howMany ?? null,
    observedAt: o.obsDt,
    lat: o.lat,
    lng: o.lng,
    imageUrl: photoMap.get(o.speciesCode) ?? null,
  }));


  const observationsWithPhotos = data.map((o: any) => ({
    ...o,
    imageUrl: photoMap.get(o.speciesCode) ?? null,
  }));

  const cached = obsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 5 * 60_000) { // 5 minutes
    return NextResponse.json({
      meta: {
        count: cached.data.length,
        cached: true,
      },
      observations: cached.data,
    });
  }

  obsCache.set(cacheKey, {
    ts: Date.now(),
    data: normalizedObservations,
  });



  return NextResponse.json({
    meta: {
      count: normalizedObservations.length,
      cached: false,
      photoStats: {
        totalSpecies: uniqueSpecies.length,
        photosFound: Object.values(photoDebug).filter(p => p.found).length,
        debug: process.env.NODE_ENV === 'development' ? photoDebug : undefined,
      },
    },
    observations: normalizedObservations,
  });


  }
