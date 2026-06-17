const SEP = "|||";

export function encodeAlbumSlug(artist: string, name: string): string {
  return encodeURIComponent(artist + SEP + name);
}

export function decodeAlbumSlug(slug: string): { artist: string; name: string } {
  const decoded = decodeURIComponent(slug);
  const idx = decoded.indexOf(SEP);
  if (idx === -1) throw new Error(`Invalid album slug: ${slug}`);
  return { artist: decoded.slice(0, idx), name: decoded.slice(idx + SEP.length) };
}
