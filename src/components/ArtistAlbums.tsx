import Image from "next/image";
import Link from "next/link";
import { encodeAlbumSlug } from "@/lib/album-utils";
import type { ArtistAlbum } from "@/lib/music-types";

interface ArtistAlbumsProps {
  albums: ArtistAlbum[];
  artistName: string;
}

function releaseYear(date: string): string {
  const year = date.slice(0, 4);
  return year.length === 4 ? year : "";
}

export default function ArtistAlbums({ albums, artistName }: ArtistAlbumsProps) {
  if (albums.length === 0) return null;
  return (
    <section className="w-full">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4 pb-2 border-b border-border">
        Albums
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {albums.map((album, i) => (
          <Link
            key={album.name + i}
            href={`/album/${encodeAlbumSlug(artistName, album.name)}`}
            className="group flex flex-col gap-2 rounded-xl hover:bg-border transition-colors p-1 -m-1"
          >
            {album.imageUrl ? (
              <Image
                src={album.imageUrl}
                alt={album.name}
                width={180}
                height={180}
                className="w-full aspect-square object-cover rounded shadow-sm"
              />
            ) : (
              <div className="w-full aspect-square rounded bg-border flex items-center justify-center text-muted text-3xl font-bold uppercase">
                {album.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:underline">
                {album.name}
              </p>
              <p className="text-xs text-muted">{releaseYear(album.release_date)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
