import Image from "next/image";
import Link from "next/link";
import { encodeAlbumSlug } from "@/lib/album-utils";
import type { ArtistTopTrack } from "@/lib/music-types";
import HeartButton from "@/components/HeartButton";
import { buildFavouriteId } from "@/lib/favourite-utils";

interface ArtistTopTracksProps {
  tracks: ArtistTopTrack[];
  artistName: string;
}

export default function ArtistTopTracks({ tracks, artistName }: ArtistTopTracksProps) {
  if (tracks.length === 0) return null;
  return (
    <section className="w-full">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
        Top Tracks
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
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">{track.name}</span>
              {track.albumName && (
                <span className="text-xs text-muted flex-shrink-0 truncate max-w-[120px] hidden sm:block">{track.albumName}</span>
              )}
            </div>
            {track.playcount && (
              <span className="text-xs text-muted flex-shrink-0 hidden md:block tabular-nums">
                {Number(track.playcount).toLocaleString("fr-FR")} plays
              </span>
            )}
            {track.duration && Number(track.duration) > 0 && (
              <span className="text-xs text-muted flex-shrink-0 tabular-nums">
                {Math.floor(Number(track.duration) / 1000 / 60)}:{String(Math.floor((Number(track.duration) / 1000) % 60)).padStart(2, "0")}
              </span>
            )}
            <HeartButton
              id={buildFavouriteId("track", track.name, artistName)}
              kind="track"
              name={track.name}
              artist={artistName}
              imageUrl={track.imageUrl ?? undefined}
              href={track.albumName ? `/album/${encodeAlbumSlug(artistName, track.albumName)}` : `/artist/${encodeURIComponent(artistName)}`}
            />
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
