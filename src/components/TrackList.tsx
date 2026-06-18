import React from "react";
import type { LastfmTrackDetail } from "@/lib/music-types";
import TrackRow from "@/components/TrackRow";
import EmptyState from "@/components/EmptyState";
import { buildFavouriteId } from "@/lib/favourite-utils";

interface TrackListProps {
  tracks: LastfmTrackDetail[];
  albumArtist?: string;
  albumImageUrl?: string;
  albumHref?: string;
}

export default function TrackList({ tracks, albumArtist, albumImageUrl, albumHref }: TrackListProps) {
  if (tracks.length === 0) {
    return <EmptyState title="Aucune piste disponible" subtitle="Cet album ne contient pas de tracklist dans notre base." />;
  }
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
        Tracklist
      </h2>
      <div className="divide-y divide-border">
        {tracks.map((track, i) => (
          <div
            key={track.name + i}
            className="track-enter"
            style={{ "--track-delay": `${Math.min(i * 40, 600)}ms` } as React.CSSProperties}
          >
            <TrackRow
              rank={Number(track["@attr"]?.rank ?? i + 1)}
              name={track.name}
              duration={track.duration}
              playcount={track.playcount}
              favouriteItem={albumArtist && albumHref ? {
                id: buildFavouriteId("track", track.name, albumArtist),
                kind: "track",
                name: track.name,
                artist: albumArtist,
                imageUrl: albumImageUrl,
                href: albumHref,
              } : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
