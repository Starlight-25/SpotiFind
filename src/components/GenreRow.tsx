"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useFavourites } from "@/hooks/useFavourites";
import { buildFavouriteId } from "@/lib/favourite-utils";
import { encodeAlbumSlug } from "@/lib/album-utils";
import ScrollAnimator from "@/components/ScrollAnimator";

interface ExploreAlbum {
  name: string;
  artist: string;
  imageUrl: string;
}

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
    <div className="flex-shrink-0">
      <ScrollAnimator deps={[albums]} />
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 pb-2 border-b border-border reveal-ltr">
        Trending Albums — {genre}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="w-full aspect-square bg-border rounded-xl animate-pulse" />
                <div className="h-3 bg-border rounded animate-pulse w-3/4" />
                <div className="h-3 bg-border rounded animate-pulse w-1/2" />
              </div>
            ))
          : albums.map((album, i) => {
              const favId = buildFavouriteId("album", album.name, album.artist);
              const isFav = isFavourite(favId);
              const href = `/album/${encodeAlbumSlug(album.artist, album.name)}`;
              return (
                <div
                  key={i}
                  className="scroll-fade-in"
                >
                  <div
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
                    className="flex flex-col rounded-xl hover:bg-border transition-colors p-1 -m-1 cursor-pointer"
                  >
                    <div className="relative w-full aspect-square">
                      {album.imageUrl ? (
                        <Image
                          src={album.imageUrl}
                          alt={album.name}
                          fill
                          className="rounded-xl object-cover"
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-border flex items-center justify-center text-muted text-4xl font-bold uppercase">
                          {album.name.charAt(0)}
                        </div>
                      )}
                      {isFav && (
                        <div className="absolute top-1.5 right-1.5 text-base leading-none">💚</div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground mt-2 leading-tight line-clamp-2">{album.name}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">{album.artist}</p>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
