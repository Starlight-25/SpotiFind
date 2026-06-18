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

type LastfmImage = { "#text": string; size: string };

function pickLastfmImage(images: LastfmImage[] | undefined): string | null {
  if (!Array.isArray(images)) return null;
  const url =
    images.find((i) => i.size === "extralarge")?.["#text"] ||
    images.find((i) => i.size === "large")?.["#text"] ||
    images.find((i) => i["#text"])?.["#text"] ||
    "";
  // Filter out Last.fm's known "no image" placeholder hashes
  if (!url || url.includes("2a96cbd8b46e442fc41c2b86b821562f")) return null;
  return url;
}

async function fetchLastfmTrackInfo(
  artist: string,
  track: string,
  apiKey: string
): Promise<{ imageUrl: string | null; albumName: string | null }> {
  try {
    const qs = new URLSearchParams({
      method: "track.getInfo",
      artist,
      track,
      api_key: apiKey,
      format: "json",
    });
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${qs}`, { cache: "no-store" });
    if (!res.ok) return { imageUrl: null, albumName: null };
    const data = await res.json();
    const album = data?.track?.album;
    return {
      imageUrl: pickLastfmImage(album?.image),
      albumName: (album?.title as string | undefined) ?? null,
    };
  } catch {
    return { imageUrl: null, albumName: null };
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

    // Fetch track.getInfo in parallel to get real album art + album name
    const enriched = await Promise.all(
      (tracks as { name: string }[]).slice(0, 10).map((t) =>
        fetchLastfmTrackInfo(name, t.name, apiKey).then((info) => ({
          name: t.name,
          imageUrl: info.imageUrl,
          albumName: info.albumName,
        }))
      )
    );
    return enriched;
  } catch {
    return [];
  }
}

async function fetchAudioDbYears(artist: string): Promise<Map<string, string>> {
  // Returns a map of lowercase album name → "YYYY-01-01" release date
  try {
    // discography.php is only available on the public free key "2"
    const res = await fetch(
      `https://www.theaudiodb.com/api/v1/json/2/discography.php?s=${encodeURIComponent(artist)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return new Map();
    const data = await res.json();
    const entries = data?.album as Array<{ strAlbum: string; intYearReleased: string }> | undefined;
    if (!Array.isArray(entries)) return new Map();
    const map = new Map<string, string>();
    for (const e of entries) {
      if (e.strAlbum && e.intYearReleased) {
        map.set(e.strAlbum.toLowerCase(), `${e.intYearReleased}-01-01`);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

async function fetchLastfmTopAlbums(name: string): Promise<ArtistAlbum[]> {
  try {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) return [];

    // Fetch Last.fm albums + TheAudioDB years in parallel (2 calls total)
    const [lfmRes, yearMap] = await Promise.all([
      fetch(
        `https://ws.audioscrobbler.com/2.0/?${new URLSearchParams({
          method: "artist.getTopAlbums",
          artist: name,
          limit: "20",
          api_key: apiKey,
          format: "json",
        })}`,
        { cache: "no-store" }
      ),
      fetchAudioDbYears(name),
    ]);

    if (!lfmRes.ok) return [];
    const data = await lfmRes.json();
    const albums = data?.topalbums?.album;
    if (!Array.isArray(albums)) return [];

    const enriched = (albums as { name: string; image: LastfmImage[] }[]).map((a) => ({
      name: a.name,
      release_date: yearMap.get(a.name.toLowerCase()) ?? "",
      imageUrl: pickLastfmImage(a.image),
    }));

    // Sort most recent first — albums without a date go to the end
    return enriched.sort((a, b) => {
      if (!a.release_date && !b.release_date) return 0;
      if (!a.release_date) return 1;
      if (!b.release_date) return -1;
      return b.release_date.localeCompare(a.release_date);
    });
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
      const [topTracks, albums] = await Promise.all([
        fetchLastfmTopTracks(name),
        fetchLastfmTopAlbums(name),
      ]);
      return { topTracks, albums };
    }
    const searchData = await searchRes.json();
    const artistId = searchData?.artists?.items?.[0]?.id as string | undefined;
    if (!artistId) {
      console.error("[artist-service] No Spotify artist found for:", name);
      const [topTracks, albums] = await Promise.all([
        fetchLastfmTopTracks(name),
        fetchLastfmTopAlbums(name),
      ]);
      return { topTracks, albums };
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
      } else {
        console.error("[artist-service] Spotify top-tracks returned empty array");
      }
    } else {
      console.error("[artist-service] Spotify top-tracks failed:", topTracksRes.status);
    }
    if (topTracks.length === 0) {
      console.error("[artist-service] Falling back to Last.fm top tracks for:", name);
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
    if (albums.length === 0) {
      albums = await fetchLastfmTopAlbums(name);
    }

    return { topTracks, albums };
  } catch (err) {
    console.error("[artist-service] fetchArtistSpotifyData threw:", err);
    const [topTracks, albums] = await Promise.all([
      fetchLastfmTopTracks(name),
      fetchLastfmTopAlbums(name),
    ]);
    return { topTracks, albums };
  }
}
