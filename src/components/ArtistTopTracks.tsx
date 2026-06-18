import Image from "next/image";
import Link from "next/link";
import { encodeAlbumSlug } from "@/lib/album-utils";
import type { ArtistTopTrack } from "@/lib/music-types";

interface ArtistTopTracksProps {
  tracks: ArtistTopTrack[];
  artistName: string;
}

export default function ArtistTopTracks({ tracks, artistName }: ArtistTopTracksProps) {
  if (tracks.length === 0) return null;
  return (
    <section className="w-full">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
        Top titres
      </h2>
      {tracks.map((track, i) => {
        const row = (
          <div className="flex items-center gap-3 py-3 border-b border-border last:border-0 group-hover:opacity-75 transition-opacity">
            <span className="w-5 text-right text-sm text-muted flex-shrink-0 tabular-nums">{i + 1}</span>
            {track.imageUrl ? (
              <Image
                src={track.imageUrl}
                alt={track.albumName ?? track.name}
                width={40}
                height={40}
                className="rounded flex-shrink-0 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-border flex-shrink-0" />
            )}
            <span className="flex-1 text-sm font-medium text-foreground truncate">{track.name}</span>
            {track.albumName && (
              <span className="text-xs text-muted flex-shrink-0 truncate max-w-[140px] hidden sm:block">
                {track.albumName}
              </span>
            )}
          </div>
        );

        return track.albumName ? (
          <Link
            key={track.name + i}
            href={`/album/${encodeAlbumSlug(artistName, track.albumName)}`}
            className="group block"
          >
            {row}
          </Link>
        ) : (
          <div key={track.name + i}>{row}</div>
        );
      })}
    </section>
  );
}
