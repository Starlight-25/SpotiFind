import type { FavouriteItem } from "@/lib/music-types";

export function buildFavouriteId(kind: FavouriteItem["kind"], name: string, artist?: string): string {
  return artist ? `${kind}:${artist}:${name}` : `${kind}:${name}`;
}
