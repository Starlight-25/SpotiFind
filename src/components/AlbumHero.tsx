import Image from "next/image";
import Link from "next/link";
import type { LastfmImage } from "@/lib/music-types";
import BackButton from "@/components/BackButton";

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
  playcount?: string;
  listeners?: string;
}

export default function AlbumHero({ name, artist, images, playcount, listeners }: AlbumHeroProps) {
  const cover = getBestImage(images);
  return (
    <div className="flex items-end gap-6 mb-8">
      <div className="relative flex-shrink-0">
        <div className="absolute top-0 -left-8">
          <BackButton />
        </div>
        {cover ? (
          <Image
            src={cover}
            alt={name}
            width={200}
            height={200}
            className="rounded shadow-md object-cover photo-reveal"
          />
        ) : (
          <div className="w-[200px] h-[200px] rounded bg-border photo-reveal" />
        )}
      </div>
      <div className="min-w-0 reveal-ltr">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Album</p>
        <h1 className="text-3xl font-bold text-foreground">{name}</h1>
        <Link
          href={`/artist/${encodeURIComponent(artist)}`}
          className="text-lg text-muted mt-1 truncate hover:text-foreground hover:underline transition-colors"
        >
          {artist}
        </Link>
        <div className="flex gap-4 mt-2">
          {playcount && (
            <p className="text-xs text-muted">{Number(playcount).toLocaleString("fr-FR")} plays</p>
          )}
        </div>
      </div>
    </div>
  );
}
