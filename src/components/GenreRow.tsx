"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useFavourites } from "@/hooks/useFavourites";
import { buildFavouriteId } from "@/lib/favourite-utils";
import { encodeAlbumSlug } from "@/lib/album-utils";
import type { ExploreAlbum } from "@/app/api/explore/route";

interface Props {
  genre: string;
}

export default function GenreRow({ genre }: Props) {
  const [albums, setAlbums] = useState<ExploreAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFavourite, toggle } = useFavourites();

  useEffect(() => {
    fetch(`/api/explore?genre=${encodeURIComponent(genre)}&page=1`)
      .then(r => r.json())
      .then(data => setAlbums((data.albums ?? []).slice(0, 5)))
      .catch(() => setAlbums([]))
      .finally(() => setLoading(false));
  }, [genre]);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-widest px-4">{genre}</h2>
      <div className="flex gap-2 px-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-24 aspect-square bg-border rounded-lg animate-pulse" />
            ))
          : albums.map((album, i) => {
              const favId = buildFavouriteId("album", album.name, album.artist);
              const isFav = isFavourite(favId);
              const href = `/album/${encodeAlbumSlug(album.artist, album.name)}`;
              return (
                <div
                  key={i}
                  onClick={() =>
                    toggle({
                      id: favId,
                      kind: "album",
                      name: album.name,
                      artist: album.artist,
                      imageUrl: album.imageUrl || undefined,
                      href,
                      addedAt: Date.now(),
                    })
                  }
                  className={`relative flex-shrink-0 w-24 aspect-square rounded-lg overflow-hidden cursor-pointer group ${isFav ? "ring-2 ring-spotify" : ""}`}
                >
                  {album.imageUrl ? (
                    <Image
                      src={album.imageUrl}
                      alt={album.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full bg-border flex items-center justify-center text-muted font-bold">
                      {album.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                    <p className="text-white text-[10px] font-semibold truncate">{album.name}</p>
                    <p className="text-white/70 text-[10px] truncate">{album.artist}</p>
                  </div>
                  {isFav && (
                    <div className="absolute top-1 right-1 text-xs leading-none">💚</div>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
}
