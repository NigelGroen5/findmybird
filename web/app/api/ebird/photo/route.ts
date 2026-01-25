import { NextResponse } from "next/server";

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
          if (wikiData.type === 'standard' && !wikiData.title.toLowerCase().includes('disambiguation')) {
            imageUrl = wikiData?.originalimage?.source || wikiData?.thumbnail?.source || null;
            if (imageUrl) {
              console.log(`✓ Found Wikipedia image for ${speciesCode} (${commonName}): ${imageUrl.substring(0, 100)}...`);
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

        const results = json?.results || json?.data || json || [];
        const result = Array.isArray(results) ? results[0] : results;

        if (result) {
          imageUrl = result.mediaUrl || result.assetUrl || result.url || result.downloadUrl
            || result.thumbnailUrl || result.imageUrl || result.photoUrl || null;

          if (!imageUrl && result.media) {
            imageUrl = result.media.url || result.media.mediaUrl || result.media.assetUrl || null;
          }
          if (!imageUrl && result.asset) {
            imageUrl = result.asset.url || result.asset.mediaUrl || null;
          }
          if (!imageUrl && result.thumbnail) {
            imageUrl = result.thumbnail.url || result.thumbnail.mediaUrl || null;
          }

          const assetId = result.assetId || result.id || result.mediaId || result.asset?.id;
          if (!imageUrl && assetId) {
            const numericId = String(assetId).replace(/^ML/i, '');
            if (/^\d+$/.test(numericId)) {
              imageUrl = `https://cdn.download.ams.birds.cornell.edu/api/v2/asset/${numericId}/thumb/640`;
            }
          }

          if (imageUrl) {
            console.log(`✓ Found Macaulay Library image for ${speciesCode}`);
          }
        }
      }
    } catch (e) {
      console.error(`Error querying Macaulay Library for ${speciesCode}:`, e);
    }

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const speciesCode = searchParams.get("speciesCode");
  const commonName = searchParams.get("commonName");
  const scientificName = searchParams.get("scientificName");

  if (!speciesCode) {
    return NextResponse.json(
      { error: "Missing speciesCode parameter" },
      { status: 400 }
    );
  }

  try {
    const imageUrl = await getBirdPhoto(speciesCode, commonName || undefined, scientificName || undefined);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error in photo endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch bird photo" },
      { status: 500 }
    );
  }
}