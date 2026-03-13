import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const markersParam = searchParams.get("markers"); // "name1,lat1,lng1|name2,lat2,lng2|..."

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }
  if (!lat || !lng) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("center", `${lat},${lng}`);
  url.searchParams.set("zoom", "13");
  url.searchParams.set("size", "600x320");
  url.searchParams.set("scale", "2");
  url.searchParams.set("language", "ja");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("style", "feature:poi|visibility:simplified");

  // ユーザー現在地マーカー（青い星）
  url.searchParams.append(
    "markers",
    `color:0x4A90D9|size:mid|label:★|${lat},${lng}`
  );

  // スポットマーカー（赤の番号付き）
  if (markersParam) {
    const spots = markersParam.split("|").slice(0, 8);
    spots.forEach((spot, i) => {
      const parts = spot.split(",");
      if (parts.length >= 3) {
        const spotLat = parts[parts.length - 2];
        const spotLng = parts[parts.length - 1];
        url.searchParams.append(
          "markers",
          `color:red|size:mid|label:${i + 1}|${spotLat},${spotLng}`
        );
      }
    });
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return NextResponse.json(
        { error: "Maps API error" },
        { status: response.status }
      );
    }
    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch map" }, { status: 500 });
  }
}
