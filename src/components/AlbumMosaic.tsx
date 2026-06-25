"use client";

import MosaicCard from "@/components/MosaicCard";
import type { ExploreAlbum } from "@/app/api/explore/route";

interface Props {
  albums: ExploreAlbum[];
  loading: boolean;
}

export default function AlbumMosaic({ albums, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-border rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <p className="text-center text-muted text-sm py-12">Aucun album trouvé pour ce genre.</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {albums.map((album, i) => (
        <MosaicCard key={`${album.artist}-${album.name}-${i}`} album={album} />
      ))}
    </div>
  );
}
