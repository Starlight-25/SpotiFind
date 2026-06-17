import type { LastfmTrackDetail } from "@/lib/music-types";
import TrackRow from "@/components/TrackRow";

interface TrackListProps {
  tracks: LastfmTrackDetail[];
}

export default function TrackList({ tracks }: TrackListProps) {
  if (tracks.length === 0) {
    return <p className="text-sm text-muted py-4">Aucune piste disponible.</p>;
  }
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
        Tracklist
      </h2>
      {tracks.map((track, i) => (
        <TrackRow
          key={track.name + i}
          rank={Number(track["@attr"]?.rank ?? i + 1)}
          name={track.name}
          duration={track.duration}
        />
      ))}
    </div>
  );
}
