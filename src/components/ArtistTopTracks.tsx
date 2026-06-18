import type { ArtistTopTrack } from "@/lib/music-types";

interface ArtistTopTracksProps {
  tracks: ArtistTopTrack[];
}

function formatPlaycount(count: string): string {
  const n = Number(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

export default function ArtistTopTracks({ tracks }: ArtistTopTracksProps) {
  if (tracks.length === 0) return null;
  return (
    <section className="w-full">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
        Top titres
      </h2>
      {tracks.map((track, i) => (
        <div
          key={track.name + i}
          className="flex items-center gap-4 py-3 border-b border-border last:border-0"
        >
          <span className="w-6 text-right text-sm text-muted flex-shrink-0 tabular-nums">
            {i + 1}
          </span>
          <span className="flex-1 text-sm font-medium text-foreground truncate">{track.name}</span>
          <span className="text-xs text-muted flex-shrink-0 tabular-nums">
            {formatPlaycount(track.playcount)}
          </span>
        </div>
      ))}
    </section>
  );
}
