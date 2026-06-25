import { NextRequest, NextResponse } from "next/server";

const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";

function getLastfmKey() {
  const key = process.env.LASTFM_API_KEY;
  if (!key) throw new Error("Missing LASTFM_API_KEY");
  return key;
}

export interface ExploreAlbum {
  name: string;
  artist: string;
  imageUrl: string;
}

export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre");
  const page = req.nextUrl.searchParams.get("page") ?? "1";

  if (!genre) {
    return NextResponse.json({ error: "Missing `genre` parameter." }, { status: 400 });
  }

  try {
    const url = `${LASTFM_BASE}?method=tag.getTopAlbums&tag=${encodeURIComponent(genre)}&api_key=${getLastfmKey()}&format=json&limit=9&page=${page}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Last.fm error ${res.status}`);

    const data = await res.json();
    const raw: Array<{ name: string; artist: { name: string }; image: Array<{ "#text": string; size: string }> }> =
      data.albums?.album ?? [];

    const albums: ExploreAlbum[] = raw.map(a => ({
      name: a.name,
      artist: a.artist.name,
      imageUrl:
        a.image.find(i => i.size === "extralarge")?.["#text"] ||
        a.image.find(i => i.size === "large")?.["#text"] ||
        "",
    }));

    return NextResponse.json({ albums });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
