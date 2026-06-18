import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get("artist");
  const track = req.nextUrl.searchParams.get("track");
  if (!artist || !track) return NextResponse.json({ error: "missing params" }, { status: 400 });

  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no api key" }, { status: 500 });

  try {
    const qs = new URLSearchParams({ method: "track.getInfo", artist, track, api_key: apiKey, format: "json" });
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${qs}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ listeners: null, duration: null });
    const data = await res.json();
    const t = data?.track;
    return NextResponse.json({
      listeners: (t?.listeners as string | undefined) ?? null,
      duration: (t?.duration as string | undefined) ?? null,
      album: (t?.album?.title as string | undefined) ?? null,
    });
  } catch {
    return NextResponse.json({ listeners: null, duration: null });
  }
}
