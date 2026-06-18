import { fetchSpotify } from "@/lib/spotify";
import type { ArtistTopTrack, ArtistAlbum } from "@/lib/music-types";

export interface ArtistDetail {
  name: string;
  thumb: string | null;
}

export async function fetchArtistByName(name: string): Promise<ArtistDetail | null> {
  try {
    const key = process.env.THEAUDIODB_API_KEY ?? "123";
    const url = `https://www.theaudiodb.com/api/v1/json/${key}/search.php?s=${encodeURIComponent(name)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const artist = data.artists?.[0];
    if (!artist) return null;
    return {
      name: artist.strArtist as string,
      thumb: (artist.strArtistThumb as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function fetchArtistTopTracks(name: string): Promise<ArtistTopTrack[]> {
  try {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) return [];
    const qs = new URLSearchParams({
      method: "artist.getTopTracks",
      artist: name,
      limit: "10",
      api_key: apiKey,
      format: "json",
    });
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${qs}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    const tracks = data?.toptracks?.track;
    if (!Array.isArray(tracks)) return [];
    return tracks.map((t: { name: string; playcount: string }) => ({
      name: t.name,
      playcount: t.playcount,
    }));
  } catch {
    return [];
  }
}

export async function fetchArtistAlbums(name: string): Promise<ArtistAlbum[]> {
  try {
    const searchRes = await fetchSpotify(
      `/search?q=${encodeURIComponent(name)}&type=artist&limit=1`
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const artistId = searchData?.artists?.items?.[0]?.id as string | undefined;
    if (!artistId) return [];

    const albumsRes = await fetchSpotify(
      `/artists/${artistId}/albums?include_groups=album&limit=50`
    );
    if (!albumsRes.ok) return [];
    const albumsData = await albumsRes.json();
    const items = albumsData?.items as Array<{
      name: string;
      release_date: string;
      images: { url: string }[];
    }>;
    if (!Array.isArray(items)) return [];

    return items
      .map(a => ({
        name: a.name,
        release_date: a.release_date,
        imageUrl: a.images?.[0]?.url ?? null,
      }))
      .sort((a, b) => b.release_date.localeCompare(a.release_date));
  } catch {
    return [];
  }
}
