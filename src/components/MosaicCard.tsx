"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useFavourites } from "@/hooks/useFavourites";
import { buildFavouriteId } from "@/lib/favourite-utils";
import { encodeAlbumSlug } from "@/lib/album-utils";
import type { ExploreAlbum } from "@/app/api/explore/route";

interface Props {
  album: ExploreAlbum;
}

export default function MosaicCard({ album }: Props) {
  const { isFavourite, toggle } = useFavourites();
  const [pulsing, setPulsing] = useState(false);
  const lastClickRef = useRef<number>(0);

  const favId = buildFavouriteId("album", album.name, album.artist);
  const isFav = isFavourite(favId);
  const href = `/album/${encodeAlbumSlug(album.artist, album.name)}`;

  function handleClick() {
    const now = Date.now();
    const delta = now - lastClickRef.current;
    lastClickRef.current = now;

    if (delta < 300) {
      // Double-clic : simulation lecture
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1000);
    } else {
      // Simple clic : toggle favori
      toggle({
        id: favId,
        kind: "album",
        name: album.name,
        artist: album.artist,
        imageUrl: album.imageUrl || undefined,
        href,
        addedAt: Date.now(),
      });
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`relative aspect-square cursor-pointer group rounded-lg overflow-hidden select-none ${
        pulsing ? "animate-pulse ring-2 ring-spotify" : ""
      } ${isFav ? "ring-2 ring-spotify" : ""}`}
    >
      {album.imageUrl ? (
        <Image
          src={album.imageUrl}
          alt={album.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 33vw, 200px"
        />
      ) : (
        <div className="w-full h-full bg-border flex items-center justify-center text-muted text-2xl font-bold">
          {album.name.charAt(0)}
        </div>
      )}

      {/* Overlay au hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
        <p className="text-white text-xs font-semibold truncate">{album.name}</p>
        <p className="text-white/70 text-xs truncate">{album.artist}</p>
      </div>

      {/* Badge favori */}
      {isFav && (
        <div className="absolute top-1.5 right-1.5 text-base leading-none">💚</div>
      )}

      {/* Badge lecture simulée */}
      {pulsing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/70 rounded-full p-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
