import { NextRequest, NextResponse } from "next/server";

const BASE = "https://ws.audioscrobbler.com/2.0/";

async function lastfmSearch(method: string, field: string, query: string, limit = 5) {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error("Missing LASTFM_API_KEY in environment variables.");

  const url = `${BASE}?method=${method}&${field}=${encodeURIComponent(query)}&api_key=${apiKey}&format=json&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Last.fm error ${res.status} for method=${method}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing `q` query parameter." }, { status: 400 });
  }

  try {
    const [tracksData, artistsData, albumsData] = await Promise.all([
      lastfmSearch("track.search", "track", query),
      lastfmSearch("artist.search", "artist", query),
      lastfmSearch("album.search", "album", query),
    ]);

    return NextResponse.json({
      tracks: tracksData.results?.trackmatches?.track ?? [],
      artists: artistsData.results?.artistmatches?.artist ?? [],
      albums: albumsData.results?.albummatches?.album ?? [],
    });
  } catch (err) {
    console.error("[search route]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
