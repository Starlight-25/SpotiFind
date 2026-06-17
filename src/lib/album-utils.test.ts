import { encodeAlbumSlug, decodeAlbumSlug } from "@/lib/album-utils";

describe("encodeAlbumSlug", () => {
  it("produces a URL-safe string (no spaces, no raw pipes)", () => {
    const slug = encodeAlbumSlug("The Beatles", "Abbey Road");
    expect(slug).not.toContain(" ");
    expect(slug).not.toContain("|");
  });
});

describe("decodeAlbumSlug", () => {
  it("works with the raw encoded slug (Next.js did not pre-decode)", () => {
    const slug = encodeAlbumSlug("Daft Punk", "Discovery");
    expect(decodeAlbumSlug(slug)).toEqual({ artist: "Daft Punk", name: "Discovery" });
  });

  it("works when Next.js pre-decoded the path param", () => {
    const slug = encodeAlbumSlug("Daft Punk", "Discovery");
    const preDecoded = decodeURIComponent(slug);
    expect(decodeAlbumSlug(preDecoded)).toEqual({ artist: "Daft Punk", name: "Discovery" });
  });

  it("handles names with special characters including % after pre-decoding", () => {
    const slug = encodeAlbumSlug("100% Hits", "Greatest");
    const preDecoded = decodeURIComponent(slug);
    expect(decodeAlbumSlug(preDecoded)).toEqual({ artist: "100% Hits", name: "Greatest" });
  });

  it("handles special characters like slashes", () => {
    const slug = encodeAlbumSlug("AC/DC", "Back in Black");
    expect(decodeAlbumSlug(slug)).toEqual({ artist: "AC/DC", name: "Back in Black" });
  });

  it("throws on slug without separator", () => {
    expect(() => decodeAlbumSlug("nodivider")).toThrow("Invalid album slug");
  });
});
