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

async function fetchLastfmTopTracks(name: string): Promise<ArtistTopTrack[]> {
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
    return tracks.map((t: { name: string; image: { "#text": string; size: string }[] }) => ({
      name: t.name,
      imageUrl:
        t.image?.find((i) => i.size === "large")?.["#text"] ||
        t.image?.find((i) => i["#text"])?.["#text"] ||
        null,
      albumName: null,
    }));
  } catch {
    return [];
  }
}

export async function fetchArtistSpotifyData(name: string): Promise<{
  topTracks: ArtistTopTrack[];
  albums: ArtistAlbum[];
}> {
  try {
    // 1. Get Spotify artist ID — plain name search, no field filter
    const searchRes = await fetchSpotify(
      `/search?q=${encodeURIComponent(name)}&type=artist&limit=1`
    );
    if (!searchRes.ok) {
      console.error("[artist-service] Spotify search failed:", searchRes.status);
      const fallback = await fetchLastfmTopTracks(name);
      return { topTracks: fallback, albums: [] };
    }
    const searchData = await searchRes.json();
    const artistId = searchData?.artists?.items?.[0]?.id as string | undefined;
    if (!artistId) {
      console.error("[artist-service] No Spotify artist found for:", name);
      const fallback = await fetchLastfmTopTracks(name);
      return { topTracks: fallback, albums: [] };
    }

    // 2. Fetch top-tracks and albums in parallel
    const [topTracksRes, albumsRes] = await Promise.all([
      fetchSpotify(`/artists/${artistId}/top-tracks?market=FR`),
      fetchSpotify(`/artists/${artistId}/albums?include_groups=album,single&limit=50`),
    ]);

    // Top tracks — Spotify includes album name + cover, fallback to Last.fm
    let topTracks: ArtistTopTrack[] = [];
    if (topTracksRes.ok) {
      const data = await topTracksRes.json();
      const tracks = data?.tracks as Array<{
        name: string;
        album: { name: string; images: { url: string }[] };
      }>;
      if (Array.isArray(tracks) && tracks.length > 0) {
        topTracks = tracks.slice(0, 10).map(t => ({
          name: t.name,
          imageUrl: t.album?.images?.[0]?.url ?? null,
          albumName: t.album?.name ?? null,
        }));
      }
    }
    if (topTracks.length === 0) {
      topTracks = await fetchLastfmTopTracks(name);
    }

    // Albums sorted newest first
    let albums: ArtistAlbum[] = [];
    if (albumsRes.ok) {
      const data = await albumsRes.json();
      const items = data?.items as Array<{
        name: string;
        release_date: string;
        images: { url: string }[];
      }>;
      if (Array.isArray(items)) {
        albums = items
          .map(a => ({
            name: a.name,
            release_date: a.release_date,
            imageUrl: a.images?.[0]?.url ?? null,
          }))
          .sort((a, b) => b.release_date.localeCompare(a.release_date));
      }
    } else {
      console.error("[artist-service] Spotify albums failed:", albumsRes.status);
    }

    return { topTracks, albums };
  } catch (err) {
    console.error("[artist-service] fetchArtistSpotifyData threw:", err);
    const fallback = await fetchLastfmTopTracks(name);
    return { topTracks: fallback, albums: [] };
  }
}
