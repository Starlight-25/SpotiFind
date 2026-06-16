import { NextRequest, NextResponse } from "next/server";
import { fetchSpotify } from "@/lib/spotify";

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

  let res: Response;
  try {
    res = await fetchSpotify(spotifyPath);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
