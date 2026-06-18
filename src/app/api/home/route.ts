import { NextResponse } from "next/server";

const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";
const AUDIODB_BASE = "https://www.theaudiodb.com/api/v1/json";

function getLastfmKey() {
  const key = process.env.LASTFM_API_KEY;
  if (!key) throw new Error("Missing LASTFM_API_KEY");
  return key;
}

function getAudioDbKey() {
  return process.env.THEAUDIODB_API_KEY ?? "123";
}

function pickImage(images: { "#text": string; size: string }[]): string {
  return (
    images?.find((i) => i.size === "extralarge")?.["#text"] ||
    images?.find((i) => i.size === "large")?.["#text"] ||
    images?.find((i) => i["#text"])?.["#text"] ||
    ""
  );
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

export async function GET() {
  try {
    const key = getLastfmKey();
    const [artistsRes, albumsRes] = await Promise.all([
      fetch(`${LASTFM_BASE}?method=chart.getTopArtists&limit=10&api_key=${key}&format=json`, { cache: "no-store" }),
      fetch(`${LASTFM_BASE}?method=tag.getTopAlbums&tag=pop&limit=10&api_key=${key}&format=json`, { cache: "no-store" }),
    ]);

    const artistsData = await artistsRes.json();
    const albumsData = await albumsRes.json();

    const rawArtists: Record<string, unknown>[] = artistsData.artists?.artist ?? [];
    const enrichedArtists = await Promise.all(rawArtists.map(enrichArtistThumb));

    const rawAlbums: Record<string, unknown>[] = albumsData.albums?.album ?? [];
    const albums = rawAlbums.map((a) => ({
      name: a.name as string,
      artist: (a.artist as { name: string })?.name ?? "",
      image: pickImage(a.image as { "#text": string; size: string }[]),
    }));

    return NextResponse.json({ artists: enrichedArtists, albums });
  } catch (err) {
    console.error("[home route]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
