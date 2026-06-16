import {
  getSpotifyToken,
  isTokenExpired,
  getTokenExpiresIn,
  invalidateToken,
  fetchSpotify,
} from "./spotify";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Fake token response from Spotify
const mockTokenResponse = {
  access_token: "fake_access_token_123",
  expires_in: 3600,
};

function makeTokenFetch(overrides?: Partial<typeof mockTokenResponse>) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ ...mockTokenResponse, ...overrides }),
    text: () => Promise.resolve(""),
  } as Response);
}

beforeEach(() => {
  mockFetch.mockReset();
  invalidateToken();
  process.env.SPOTIFY_CLIENT_ID = "test_client_id";
  process.env.SPOTIFY_CLIENT_SECRET = "test_client_secret";
});

// ─── isTokenExpired ───────────────────────────────────────────────────────────

describe("isTokenExpired", () => {
  test("returns true when no token is cached", () => {
    expect(isTokenExpired()).toBe(true);
  });

  test("returns false after a successful token fetch", async () => {
    mockFetch.mockReturnValueOnce(makeTokenFetch());
    await getSpotifyToken();
    expect(isTokenExpired()).toBe(false);
  });

  test("returns true after invalidateToken()", async () => {
    mockFetch.mockReturnValueOnce(makeTokenFetch());
    await getSpotifyToken();
    invalidateToken();
    expect(isTokenExpired()).toBe(true);
  });
});

// ─── getTokenExpiresIn ────────────────────────────────────────────────────────

describe("getTokenExpiresIn", () => {
  test("returns null when no token is cached", () => {
    expect(getTokenExpiresIn()).toBeNull();
  });

  test("returns a positive number of seconds after fetch", async () => {
    mockFetch.mockReturnValueOnce(makeTokenFetch());
    await getSpotifyToken();
    const remaining = getTokenExpiresIn();
    expect(remaining).not.toBeNull();
    expect(remaining!).toBeGreaterThan(0);
    expect(remaining!).toBeLessThanOrEqual(3570); // 3600 - 30s margin
  });
});

// ─── getSpotifyToken ──────────────────────────────────────────────────────────

describe("getSpotifyToken", () => {
  test("fetches a new token when cache is empty", async () => {
    mockFetch.mockReturnValueOnce(makeTokenFetch());
    const token = await getSpotifyToken();
    expect(token).toBe("fake_access_token_123");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("reuses cached token on second call", async () => {
    mockFetch.mockReturnValueOnce(makeTokenFetch());
    await getSpotifyToken();
    await getSpotifyToken();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("throws when SPOTIFY_CLIENT_ID is missing", async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    await expect(getSpotifyToken()).rejects.toThrow("Missing SPOTIFY_CLIENT_ID");
  });

  test("throws when Spotify returns a non-OK response", async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: false,
        status: 400,
        text: () => Promise.resolve("invalid_client"),
      } as Response)
    );
    await expect(getSpotifyToken()).rejects.toThrow("Spotify token request failed (400)");
  });
});

// ─── fetchSpotify ─────────────────────────────────────────────────────────────

describe("fetchSpotify", () => {
  test("calls Spotify API with Bearer token", async () => {
    mockFetch
      .mockReturnValueOnce(makeTokenFetch())
      .mockReturnValueOnce(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ tracks: [] }) } as Response)
      );

    const res = await fetchSpotify("/search?q=test&type=track");
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const apiCall = mockFetch.mock.calls[1];
    expect(apiCall[0]).toContain("api.spotify.com");
    expect(apiCall[1].headers.Authorization).toBe("Bearer fake_access_token_123");
  });

  test("retries with a new token on 401", async () => {
    mockFetch
      .mockReturnValueOnce(makeTokenFetch())                          // initial token
      .mockReturnValueOnce(Promise.resolve({ ok: true, status: 401 } as Response)) // 401 from Spotify
      .mockReturnValueOnce(makeTokenFetch({ access_token: "new_token_456" }))      // token refresh
      .mockReturnValueOnce(Promise.resolve({ ok: true, status: 200 } as Response)); // retry success

    const res = await fetchSpotify("/me");
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(4);

    const retryCall = mockFetch.mock.calls[3];
    expect(retryCall[1].headers.Authorization).toBe("Bearer new_token_456");
  });
});
