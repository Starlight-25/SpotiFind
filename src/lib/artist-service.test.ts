import { fetchArtistSpotifyData } from "./artist-service";
import { invalidateToken } from "./spotify";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  invalidateToken();
});

describe("fetchArtistSpotifyData", () => {
  it("returns topTracks with imageUrl and albumName", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";

    // token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "tok", expires_in: 3600 }),
    });
    // search artist
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ artists: { items: [{ id: "artist123" }] } }),
    });
    // top-tracks
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        tracks: [
          { name: "Creep", album: { name: "Pablo Honey", images: [{ url: "http://img1" }] } },
          { name: "Karma Police", album: { name: "OK Computer", images: [{ url: "http://img2" }] } },
        ],
      }),
    });
    // albums
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          { name: "Pablo Honey", release_date: "1993-02-22", images: [{ url: "http://cover1" }] },
          { name: "OK Computer", release_date: "1997-05-21", images: [{ url: "http://cover2" }] },
        ],
      }),
    });

    const result = await fetchArtistSpotifyData("Radiohead");

    expect(result.topTracks).toHaveLength(2);
    expect(result.topTracks[0]).toEqual({
      name: "Creep",
      imageUrl: "http://img1",
      albumName: "Pablo Honey",
    });

    expect(result.albums).toHaveLength(2);
    expect(result.albums[0].name).toBe("OK Computer");
    expect(result.albums[1].name).toBe("Pablo Honey");
  });

  it("returns empty arrays when artist not found on Spotify", async () => {
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

    const result = await fetchArtistSpotifyData("NonExistent");
    expect(result.topTracks).toEqual([]);
    expect(result.albums).toEqual([]);
  });

  it("returns empty arrays when Spotify search fails", async () => {
    process.env.SPOTIFY_CLIENT_ID = "id";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "tok", expires_in: 3600 }),
    });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

    const result = await fetchArtistSpotifyData("Radiohead");
    expect(result.topTracks).toEqual([]);
    expect(result.albums).toEqual([]);
  });
});
