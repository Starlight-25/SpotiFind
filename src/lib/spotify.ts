const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let cache: TokenCache | null = null;

export function isTokenExpired(): boolean {
  if (!cache) return true;
  return Date.now() >= cache.expiresAt;
}

export function getTokenExpiresIn(): number | null {
  if (!cache) return null;
  const remaining = cache.expiresAt - Date.now();
  return remaining > 0 ? Math.floor(remaining / 1000) : 0;
}

export function invalidateToken(): void {
  cache = null;
}

async function fetchNewToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment variables."
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify token request failed (${response.status}): ${error}`);
  }

  const data = await response.json();

  // expires_in is in seconds; keep a 30 s safety margin
  cache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  };

  return cache.accessToken;
}

export async function getSpotifyToken(): Promise<string> {
  if (!isTokenExpired()) {
    return cache!.accessToken;
  }
  return fetchNewToken();
}

/**
 * Fetch wrapper for the Spotify API.
 * Automatically refreshes the token and retries once on 401.
 */
export async function fetchSpotify(path: string): Promise<Response> {
  const token = await getSpotifyToken();

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    // Token was revoked server-side before expected expiry — force refresh
    invalidateToken();
    const freshToken = await getSpotifyToken();

    return fetch(`https://api.spotify.com/v1${path}`, {
      headers: { Authorization: `Bearer ${freshToken}` },
      cache: "no-store",
    });
  }

  return res;
}
