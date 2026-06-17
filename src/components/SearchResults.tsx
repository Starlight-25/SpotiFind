import Image from "next/image";
import Link from "next/link";
import { encodeAlbumSlug } from "@/lib/album-utils";
import type { SearchResults, LastfmTrack, LastfmArtist, LastfmAlbum, LastfmImage } from "@/lib/music-types";

function getImage(images: LastfmImage[], size: "large" | "extralarge" = "large") {
  const img = images?.find(i => i.size === size);
  return img?.["#text"] || images?.find(i => i["#text"])?.["#text"] || "";
}

function TrackCard({ track }: { track: LastfmTrack }) {
  const cover = getImage(track.image);
  return (
    <Link
      href={`/album/${encodeAlbumSlug(track.artist, track.name)}?isTrack=1`}
      className="flex items-center gap-3 py-2 rounded hover:bg-border transition-colors"
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
      {track.listeners && (
        <span className="ml-auto text-xs text-muted flex-shrink-0">
          {Number(track.listeners).toLocaleString()} listeners
        </span>
      )}
    </Link>
  );
}

function ArtistCard({ artist }: { artist: LastfmArtist }) {
  const cover = artist.thumb || getImage(artist.image);
  return (
    <div className="flex items-center gap-3 py-2">
      {cover ? (
        <Image src={cover} alt={artist.name} width={40} height={40} className="rounded-full flex-shrink-0 object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-border flex-shrink-0 flex items-center justify-center text-muted text-xs font-bold uppercase">
          {artist.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{artist.name}</p>
        {artist.listeners && (
          <p className="text-xs text-muted truncate">{Number(artist.listeners).toLocaleString()} listeners</p>
        )}
      </div>
    </div>
  );
}

function AlbumCard({ album }: { album: LastfmAlbum }) {
  const cover = getImage(album.image);
  return (
    <Link
      href={`/album/${encodeAlbumSlug(album.artist, album.name)}`}
      className="flex items-center gap-3 py-2 rounded hover:bg-border transition-colors"
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
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export default function SearchResults({ results }: { results: SearchResults }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
      <Column title="Tracks">
        {results.tracks.length === 0
          ? <p className="text-sm text-muted py-2">No results</p>
          : results.tracks.map((t, i) => <TrackCard key={t.mbid || i} track={t} />)}
      </Column>
      <Column title="Artists">
        {results.artists.length === 0
          ? <p className="text-sm text-muted py-2">No results</p>
          : results.artists.map((a, i) => <ArtistCard key={a.mbid || i} artist={a} />)}
      </Column>
      <Column title="Albums">
        {results.albums.length === 0
          ? <p className="text-sm text-muted py-2">No results</p>
          : results.albums.map((a, i) => <AlbumCard key={a.mbid || i} album={a} />)}
      </Column>
    </div>
  );
}
