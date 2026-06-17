const SEP = "|||";

export function encodeAlbumSlug(artist: string, name: string): string {
  return encodeURIComponent(artist + SEP + name);
}

export function decodeAlbumSlug(slug: string): { artist: string; name: string } {
  // Normalize: try decoding in case Next.js didn't pre-decode the path param.
  // If decoding fails (literal % in name after pre-decode), use the slug as-is.
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    // keep s = slug
  }
  const idx = s.indexOf(SEP);
  if (idx === -1) throw new Error(`Invalid album slug: ${slug}`);
  return { artist: s.slice(0, idx), name: s.slice(idx + SEP.length) };
}
