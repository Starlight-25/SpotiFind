import { NextRequest, NextResponse } from "next/server";

const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";
const AUDIODB_BASE = "https://www.theaudiodb.com/api/v1/json";

function getLastfmKey() {
  const key = process.env.LASTFM_API_KEY;
  if (!key) throw new Error("Missing LASTFM_API_KEY in environment variables.");
  return key;
}

function getAudioDbKey() {
  return process.env.THEAUDIODB_API_KEY ?? "123";
}

async function lastfmSearch(method: string, field: string, query: string, limit = 10) {
  const url = `${LASTFM_BASE}?method=${method}&${field}=${encodeURIComponent(query)}&api_key=${getLastfmKey()}&format=json&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Last.fm error ${res.status} for method=${method}`);
  return res.json();
}

async function enrichTrackImage(track: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const url = `${LASTFM_BASE}?method=track.getInfo&track=${encodeURIComponent(track.name as string)}&artist=${encodeURIComponent(track.artist as string)}&api_key=${getLastfmKey()}&format=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return track;
    const data = await res.json();
    const albumImages = data.track?.album?.image;
    const duration = data.track?.duration as string | undefined;
    const enriched = { ...track };
    if (Array.isArray(albumImages) && albumImages.some((i: { "#text": string }) => i["#text"])) {
      enriched.image = albumImages;
    }
    if (duration) enriched.duration = duration;
    return enriched;
  } catch {
    return track;
  }
}

async function enrichArtistThumb(artist: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const url = `${AUDIODB_BASE}/${getAudioDbKey()}/search.php?s=${encodeURIComponent(artist.name as string)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return artist;
    const data = await res.json();
    const thumb = data.artists?.[0]?.strArtistThumb as string | undefined;
    if (thumb) return { ...artist, thumb };
    return artist;
  } catch {
    return artist;
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ error: "Missing `q` query parameter." }, { status: 400 });

  try {
    const [tracksData, artistsData, albumsData] = await Promise.all([
      lastfmSearch("track.search", "track", query, 20),
      lastfmSearch("artist.search", "artist", query),
      lastfmSearch("album.search", "album", query, 20),
    ]);

    const rawTracks: Record<string, unknown>[] = tracksData.results?.trackmatches?.track ?? [];
    const rawArtists: Record<string, unknown>[] = artistsData.results?.artistmatches?.artist ?? [];

    const [enrichedTracks, enrichedArtists] = await Promise.all([
      Promise.all(rawTracks.map(enrichTrackImage)),
      Promise.all(rawArtists.map(enrichArtistThumb)),
    ]);

    return NextResponse.json({
      tracks: enrichedTracks,
      artists: enrichedArtists,
      albums: albumsData.results?.albummatches?.album ?? [],
    });
  } catch (err) {
    console.error("[search route]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
