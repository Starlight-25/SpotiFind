import React from "react";
import Image from "next/image";
import Link from "next/link";
import { encodeAlbumSlug } from "@/lib/album-utils";
import EmptyState from "@/components/EmptyState";
import HeartButton from "@/components/HeartButton";
import ArtistScroller from "@/components/ArtistScroller";
import ScrollAnimator from "@/components/ScrollAnimator";
import { buildFavouriteId } from "@/lib/favourite-utils";
import type { SearchResults, LastfmTrack, LastfmArtist, LastfmAlbum, LastfmImage } from "@/lib/music-types";

function getImage(images: LastfmImage[], size: "large" | "extralarge" = "large") {
  const img = images?.find(i => i.size === size);
  return img?.["#text"] || images?.find(i => i["#text"])?.["#text"] || "";
}

function TrackCard({ track }: { track: LastfmTrack }) {
  const cover = getImage(track.image);
  const albumHref = `/album/${encodeAlbumSlug(track.artist, track.name)}?isTrack=1`;
  return (
    <Link
      href={albumHref}
      className="flex items-center gap-3 py-2 px-2 rounded hover:bg-border transition-colors"
    >
      {cover ? (
        <Image src={cover} alt={track.name} width={40} height={40} className="rounded flex-shrink-0 object-cover" />
      ) : (
        <div className="w-10 h-10 rounded bg-border flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{track.name}</p>
        <p className="text-xs text-muted truncate">{track.artist}</p>
      </div>
      <span className="ml-auto text-xs text-muted flex-shrink-0 tabular-nums w-10 text-right">
        {track.duration && Number(track.duration) > 0
          ? `${Math.floor(Number(track.duration) / 1000 / 60)}:${String(Math.floor((Number(track.duration) / 1000) % 60)).padStart(2, "0")}`
          : ""}
      </span>
      <HeartButton
        id={buildFavouriteId("track", track.name, track.artist)}
        kind="track"
        name={track.name}
        artist={track.artist}
        imageUrl={cover || undefined}
        href={albumHref}
      />
    </Link>
  );
}

function ArtistCard({ artist, index = 0 }: { artist: LastfmArtist; index?: number }) {
  const cover = artist.thumb || getImage(artist.image);
  return (
    <Link
      href={`/artist/${encodeURIComponent(artist.name)}`}
      className="group flex flex-col items-center gap-2 flex-shrink-0 min-w-[calc(20%-0.8rem)] [scroll-snap-align:start] artist-appear"
      style={{ "--appear-delay": `${index * 80}ms` } as React.CSSProperties}
    >
      {cover ? (
        <Image src={cover} alt={artist.name} width={112} height={112} className="rounded-full object-cover w-28 h-28 group-hover:brightness-75 transition-all" />
      ) : (
        <div className="w-28 h-28 rounded-full bg-border group-hover:bg-[#d0d0ca] flex items-center justify-center text-muted text-3xl font-bold uppercase transition-colors">
          {artist.name.charAt(0)}
        </div>
      )}
      <p className="text-xs font-medium text-foreground text-center leading-tight line-clamp-2 w-full">{artist.name}</p>
    </Link>
  );
}

function AlbumCard({ album }: { album: LastfmAlbum }) {
  const cover = getImage(album.image);
  return (
    <Link
      href={`/album/${encodeAlbumSlug(album.artist, album.name)}`}
      className="flex items-center gap-3 py-2 px-2 rounded hover:bg-border transition-colors"
    >
      {cover ? (
        <Image src={cover} alt={album.name} width={40} height={40} className="rounded flex-shrink-0 object-cover" />
      ) : (
        <div className="w-10 h-10 rounded bg-border flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{album.name}</p>
        <p className="text-xs text-muted truncate">{album.artist}</p>
      </div>
    </Link>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-0">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border flex-shrink-0">
        {title}
      </h2>
      <div className="flex-1 divide-y divide-border px-2">
        {children}
      </div>
    </div>
  );
}

export default function SearchResults({ results }: { results: SearchResults }) {
  return (
    <div className="mt-8 flex-1 min-h-0 flex flex-col">
      <ScrollAnimator deps={[results]} />
      {/* Artists — full width, 5 visible, horizontal scroll */}
      <div className="flex-shrink-0 mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 pb-2 border-b border-border">
          Artists
        </h2>
        {results.artists.length === 0 ? (
          <EmptyState title="Aucun artiste trouvé" subtitle="Essaie un autre nom." />
        ) : (
          <ArtistScroller>
            {results.artists.map((a, i) => <ArtistCard key={a.mbid || i} artist={a} index={i} />)}
          </ArtistScroller>
        )}
      </div>

      {/* Tracks + Albums — fill remaining height to bottom */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Column title="Tracks">
          {results.tracks.length === 0
            ? <EmptyState title="Aucun titre trouvé" subtitle="Essaie un autre nom." />
            : results.tracks.map((t, i) => (
              <div key={t.mbid || i} className="scroll-fade-in">
                <TrackCard track={t} />
              </div>
            ))}
        </Column>
        <Column title="Albums">
          {results.albums.length === 0
            ? <EmptyState title="Aucun album trouvé" subtitle="Essaie un autre nom." />
            : results.albums.map((a, i) => (
              <div key={a.mbid || i} className="scroll-fade-in">
                <AlbumCard album={a} />
              </div>
            ))}
        </Column>
      </div>
    </div>
  );
}
