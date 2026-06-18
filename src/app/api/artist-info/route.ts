import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "missing name" }, { status: 400 });

  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no api key" }, { status: 500 });

  try {
    const qs = new URLSearchParams({ method: "artist.getInfo", artist: name, api_key: apiKey, format: "json" });
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${qs}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ listeners: null });
    const data = await res.json();
    const listeners = (data?.artist?.stats?.listeners as string | undefined) ?? null;
    return NextResponse.json({ listeners });
  } catch {
    return NextResponse.json({ listeners: null });
  }
}
