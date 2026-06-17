import { encodeAlbumSlug, decodeAlbumSlug } from "@/lib/album-utils";

describe("encodeAlbumSlug", () => {
  it("produces a URL-safe string (no spaces, no raw pipes)", () => {
    const slug = encodeAlbumSlug("The Beatles", "Abbey Road");
    expect(slug).not.toContain(" ");
    expect(slug).not.toContain("|");
  });
});

describe("decodeAlbumSlug", () => {
  it("decodes the pre-decoded Next.js param correctly", () => {
    // Simulate what Next.js does: decode the URL segment before passing to the page
    const urlSegment = encodeAlbumSlug("Daft Punk", "Discovery");
    const nextjsParam = decodeURIComponent(urlSegment);
    expect(decodeAlbumSlug(nextjsParam)).toEqual({ artist: "Daft Punk", name: "Discovery" });
  });

  it("handles special characters including % after Next.js decoding", () => {
    const urlSegment = encodeAlbumSlug("100% Hits", "Greatest");
    const nextjsParam = decodeURIComponent(urlSegment);
    expect(decodeAlbumSlug(nextjsParam)).toEqual({ artist: "100% Hits", name: "Greatest" });
  });

  it("handles special characters like slashes", () => {
    const urlSegment = encodeAlbumSlug("AC/DC", "Back in Black");
    const nextjsParam = decodeURIComponent(urlSegment);
    expect(decodeAlbumSlug(nextjsParam)).toEqual({ artist: "AC/DC", name: "Back in Black" });
  });

  it("throws on slug without separator", () => {
    expect(() => decodeAlbumSlug("nodivider")).toThrow("Invalid album slug");
  });
});
