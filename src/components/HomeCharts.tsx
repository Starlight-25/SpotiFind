"use client";

import Image from "next/image";
import Link from "next/link";
import { encodeAlbumSlug } from "@/lib/album-utils";
import { useHomeCharts, type HomeArtist, type HomeAlbum } from "@/hooks/useHomeCharts";

function ArtistCard({ artist }: { artist: HomeArtist }) {
  return (
    <Link
      href={`/artist/${encodeURIComponent(artist.name)}`}
      className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[calc(20%-0.8rem)] hover:opacity-80 transition-opacity"
    >
      {artist.thumb ? (
        <Image src={artist.thumb} alt={artist.name} width={112} height={112} className="rounded-full object-cover w-28 h-28" />
      ) : (
        <div className="w-28 h-28 rounded-full bg-border flex items-center justify-center text-muted text-3xl font-bold uppercase">
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
      className="flex items-center gap-3 py-2 rounded hover:bg-border transition-colors"
    >
      {album.image ? (
        <Image src={album.image} alt={album.name} width={40} height={40} className="rounded flex-shrink-0 object-cover" />
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

export default function HomeCharts() {
  const { data, loading, error } = useHomeCharts();

  if (loading) return <p className="text-sm text-muted text-center mt-8">Chargement…</p>;
  if (error) return null;
  if (!data) return null;

  return (
    <div className="mt-8 flex-1 min-h-0 flex flex-col">
      {/* Top artistes */}
      <div className="flex-shrink-0 mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 pb-2 border-b border-border">
          Artistes du moment
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {data.artists.map((a, i) => <ArtistCard key={a.mbid || i} artist={a} />)}
        </div>
      </div>

      {/* Nouveaux albums */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border flex-shrink-0">
          Albums du moment
        </h2>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {data.albums.map((a, i) => <AlbumCard key={i} album={a} />)}
        </div>
      </div>
    </div>
  );
}
