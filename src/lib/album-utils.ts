const SEP = "|||";

export function encodeAlbumSlug(artist: string, name: string): string {
  return encodeURIComponent(artist + SEP + name);
}

export function decodeAlbumSlug(slug: string): { artist: string; name: string } {
  const idx = slug.indexOf(SEP);
  if (idx === -1) throw new Error(`Invalid album slug: ${slug}`);
  return { artist: slug.slice(0, idx), name: slug.slice(idx + SEP.length) };
}
