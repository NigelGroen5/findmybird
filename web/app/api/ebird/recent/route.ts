import { NextResponse } from "next/server";

function asNum(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
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
  const back = asNum(url.searchParams.get("back"), 7);

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
  return NextResponse.json({ observations: data });
}
