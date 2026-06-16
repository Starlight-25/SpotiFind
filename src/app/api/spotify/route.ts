import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

const SPOTIFY_API = "https://api.spotify.com/v1";

/**
 * Proxy route: forwards requests to the Spotify API server-side.
 * The access token is injected here and never sent to the browser.
 *
 * Usage: GET /api/spotify?path=/search?q=...&type=track
 */
export async function GET(req: NextRequest) {
  const spotifyPath = req.nextUrl.searchParams.get("path");

  if (!spotifyPath) {
    return NextResponse.json({ error: "Missing `path` query parameter." }, { status: 400 });
  }

  let token: string;
  try {
    token = await getSpotifyToken();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const url = `${SPOTIFY_API}${spotifyPath}`;

  const spotifyRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await spotifyRes.json();

  if (!spotifyRes.ok) {
    return NextResponse.json(data, { status: spotifyRes.status });
  }

  return NextResponse.json(data);
}
