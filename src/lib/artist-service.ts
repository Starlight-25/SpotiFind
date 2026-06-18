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

export async function fetchArtistSpotifyData(name: string): Promise<{
  topTracks: ArtistTopTrack[];
  albums: ArtistAlbum[];
}> {
  try {
    // 1. Get Spotify artist ID (artist: prefix for accurate match)
    const searchRes = await fetchSpotify(
      `/search?q=${encodeURIComponent(`artist:${name}`)}&type=artist&limit=1`
    );
    if (!searchRes.ok) {
      console.error("[artist-service] Spotify search failed:", searchRes.status);
      return { topTracks: [], albums: [] };
    }
    const searchData = await searchRes.json();
    const artistId = searchData?.artists?.items?.[0]?.id as string | undefined;
    if (!artistId) {
      console.error("[artist-service] No Spotify artist found for:", name);
      return { topTracks: [], albums: [] };
    }

    // 2. Fetch top-tracks and albums in parallel
    const [topTracksRes, albumsRes] = await Promise.all([
      fetchSpotify(`/artists/${artistId}/top-tracks?market=FR`),
      fetchSpotify(`/artists/${artistId}/albums?include_groups=album,single&limit=50`),
    ]);

    // Top tracks (Spotify returns album info with images)
    let topTracks: ArtistTopTrack[] = [];
    if (topTracksRes.ok) {
      const data = await topTracksRes.json();
      const tracks = data?.tracks as Array<{
        name: string;
        album: { name: string; images: { url: string }[] };
      }>;
      if (Array.isArray(tracks)) {
        topTracks = tracks.slice(0, 10).map(t => ({
          name: t.name,
          imageUrl: t.album?.images?.[0]?.url ?? null,
          albumName: t.album?.name ?? null,
        }));
      }
    } else {
      console.error("[artist-service] Spotify top-tracks failed:", topTracksRes.status);
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
    return { topTracks: [], albums: [] };
  }
}
