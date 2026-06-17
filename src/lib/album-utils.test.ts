import { encodeAlbumSlug, decodeAlbumSlug } from "@/lib/album-utils";

describe("encodeAlbumSlug / decodeAlbumSlug", () => {
  it("round-trips artist and name", () => {
    const slug = encodeAlbumSlug("Daft Punk", "Discovery");
    expect(decodeAlbumSlug(slug)).toEqual({ artist: "Daft Punk", name: "Discovery" });
  });

  it("handles special characters", () => {
    const slug = encodeAlbumSlug("AC/DC", "Back in Black");
    expect(decodeAlbumSlug(slug)).toEqual({ artist: "AC/DC", name: "Back in Black" });
  });

  it("produces a URL-safe string (no spaces, no pipes)", () => {
    const slug = encodeAlbumSlug("The Beatles", "Abbey Road");
    expect(slug).not.toContain(" ");
    expect(slug).not.toContain("|");
  });

  it("throws on slug without separator", () => {
    expect(() => decodeAlbumSlug("nodivider")).toThrow("Invalid album slug");
  });
});
