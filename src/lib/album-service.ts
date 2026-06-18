import type { AlbumDetail, LastfmImage, LastfmTrackDetail } from "@/lib/music-types";

const BASE = "https://ws.audioscrobbler.com/2.0/";

async function lastfmGet(params: Record<string, string>): Promise<unknown> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error("Missing LASTFM_API_KEY");
  const qs = new URLSearchParams({ ...params, api_key: apiKey, format: "json" });
  const res = await fetch(`${BASE}?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Last.fm error ${res.status}`);
  return res.json();
}

function normalizeTracks(raw: unknown): LastfmTrackDetail[] {
  if (!raw) return [];
  return Array.isArray(raw) ? (raw as LastfmTrackDetail[]) : [(raw as LastfmTrackDetail)];
}

export async function fetchAlbumByName(
  artist: string,
  album: string
): Promise<AlbumDetail | null> {
  try {
    const data = (await lastfmGet({ method: "album.getInfo", artist, album })) as {
      album?: {
        name: string;
        artist: string;
        image: LastfmImage[];
        tracks?: { track: unknown };
        playcount?: string;
        listeners?: string;
      };
    };
    const raw = data?.album;
    if (!raw) return null;
    const tracks = normalizeTracks(raw.tracks?.track);
    const tracksWithListeners = await Promise.all(
      tracks.map(async (track) => {
        try {
          const info = (await lastfmGet({ method: "track.getInfo", artist: raw.artist, track: track.name })) as {
            track?: { listeners?: string };
          };
          return { ...track, listeners: info?.track?.listeners };
        } catch {
          return track;
        }
      })
    );
    return {
      name: raw.name,
      artist: raw.artist,
      image: raw.image ?? [],
      tracks: tracksWithListeners,
      playcount: raw.playcount,
      listeners: raw.listeners,
    };
  } catch (err) {
    console.error("[album-service] fetchAlbumByName", err);
    return null;
  }
}

export async function fetchAlbumForTrack(
  artist: string,
  track: string
): Promise<AlbumDetail | null> {
  try {
    const data = (await lastfmGet({ method: "track.getInfo", artist, track })) as {
      track?: { album?: { title: string } };
    };
    const albumName = data?.track?.album?.title;
    if (!albumName) return null;
    return fetchAlbumByName(artist, albumName);
  } catch (err) {
    console.error("[album-service] fetchAlbumForTrack", err);
    return null;
  }
}
