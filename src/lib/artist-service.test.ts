import { fetchArtistTopTracks, fetchArtistAlbums } from "./artist-service";
import { invalidateToken } from "./spotify";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  invalidateToken();
});

describe("fetchArtistTopTracks", () => {
  it("returns top 10 tracks from Last.fm", async () => {
    process.env.LASTFM_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        toptracks: {
          track: [
            { name: "Track A", playcount: "1000000" },
            { name: "Track B", playcount: "800000" },
          ],
        },
      }),
    });

    const tracks = await fetchArtistTopTracks("Radiohead");
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toEqual({ name: "Track A", playcount: "1000000" });
  });

  it("returns empty array when Last.fm errors", async () => {
    process.env.LASTFM_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    const tracks = await fetchArtistTopTracks("Unknown");
    expect(tracks).toEqual([]);
  });
});

describe("fetchArtistAlbums", () => {
  it("returns albums sorted by release_date descending", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";

    // token fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "tok", expires_in: 3600 }),
    });
    // Spotify search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        artists: { items: [{ id: "artist123" }] },
      }),
    });
    // Spotify albums
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          { name: "Album Old", release_date: "2010-01-01", images: [{ url: "http://img2" }] },
          { name: "Album New", release_date: "2023-06-15", images: [{ url: "http://img1" }] },
        ],
      }),
    });

    const albums = await fetchArtistAlbums("Radiohead");
    expect(albums[0].name).toBe("Album New");
    expect(albums[1].name).toBe("Album Old");
  });

  it("returns empty array when artist not found on Spotify", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "tok", expires_in: 3600 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ artists: { items: [] } }),
    });

    const albums = await fetchArtistAlbums("NonExistent");
    expect(albums).toEqual([]);
  });
});
