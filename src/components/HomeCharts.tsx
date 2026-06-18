"use client";

import Image from "next/image";
import Link from "next/link";
import { encodeAlbumSlug } from "@/lib/album-utils";
import { useHomeCharts, type HomeArtist, type HomeAlbum } from "@/hooks/useHomeCharts";
import ArtistScroller from "@/components/ArtistScroller";
import ScrollAnimator from "@/components/ScrollAnimator";

function ArtistCard({ artist }: { artist: HomeArtist }) {
  return (
    <Link
      href={`/artist/${encodeURIComponent(artist.name)}`}
      className="group flex flex-col items-center gap-2 flex-shrink-0 min-w-[calc(20%-0.8rem)]"
    >
      {artist.thumb ? (
        <Image src={artist.thumb} alt={artist.name} width={112} height={112} className="rounded-full object-cover w-28 h-28 group-hover:brightness-75 transition-all" />
      ) : (
        <div className="w-28 h-28 rounded-full bg-border group-hover:bg-[#d0d0ca] flex items-center justify-center text-muted text-3xl font-bold uppercase transition-colors">
          {artist.name.charAt(0)}
        </div>
      )}
      <p className="text-xs font-medium text-foreground text-center leading-tight line-clamp-2 w-full">{artist.name}</p>
    </Link>
  );
}

function AlbumCard({ album }: { album: HomeAlbum }) {
  return (
    <Link
      href={`/album/${encodeAlbumSlug(album.artist, album.name)}`}
      className="flex flex-col rounded-xl hover:bg-border transition-colors p-1 -m-1"
    >
      {album.image ? (
        <Image src={album.image} alt={album.name} width={144} height={144} className="rounded-xl object-cover w-full aspect-square" />
      ) : (
        <div className="w-full aspect-square rounded bg-border flex items-center justify-center text-muted text-4xl font-bold uppercase">
          {album.name.charAt(0)}
        </div>
      )}
      <p className="text-xs font-medium text-foreground mt-2 leading-tight line-clamp-2">{album.name}</p>
      <p className="text-xs text-muted mt-0.5 truncate">{album.artist}</p>
    </Link>
  );
}

export default function HomeCharts() {
  const { data, loading, error } = useHomeCharts();

  if (loading) return <p className="text-sm text-muted text-center mt-8">Chargement…</p>;
  if (error) return null;
  if (!data) return null;

  return (
    <div className="mt-8 flex-1 min-h-0 flex flex-col">
      <ScrollAnimator deps={[data]} />
      {/* Top artistes */}
      <div className="flex-shrink-0 mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 pb-2 border-b border-border">
          Trending Artists
        </h2>
        <ArtistScroller>
          {data.artists.map((a, i) => <ArtistCard key={a.mbid || i} artist={a} />)}
        </ArtistScroller>
      </div>

      {/* Nouveaux albums */}
      <div className="flex-shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 pb-2 border-b border-border">
          Trending Albums
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {data.albums.map((a, i) => (
            <div key={i} className="scroll-fade-in">
              <AlbumCard album={a} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
