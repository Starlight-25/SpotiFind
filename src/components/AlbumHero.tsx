import Image from "next/image";
import type { LastfmImage } from "@/lib/music-types";

function getBestImage(images: LastfmImage[]): string {
  return (
    images.find(i => i.size === "extralarge")?.["#text"] ||
    images.find(i => i.size === "large")?.["#text"] ||
    images.find(i => i["#text"])?.["#text"] ||
    ""
  );
}

interface AlbumHeroProps {
  name: string;
  artist: string;
  images: LastfmImage[];
}

export default function AlbumHero({ name, artist, images }: AlbumHeroProps) {
  const cover = getBestImage(images);
  return (
    <div className="flex items-end gap-6 mb-8">
      {cover ? (
        <Image
          src={cover}
          alt={name}
          width={200}
          height={200}
          className="rounded shadow-md flex-shrink-0 object-cover"
        />
      ) : (
        <div className="w-[200px] h-[200px] rounded bg-border flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Album</p>
        <h1 className="text-3xl font-bold text-foreground truncate">{name}</h1>
        <p className="text-lg text-muted mt-1 truncate">{artist}</p>
      </div>
    </div>
  );
}
