import Image from "next/image";
import type { SearchResults, SpotifyTrack, SpotifyArtist, SpotifyAlbum } from "@/lib/spotify-types";

function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function TrackCard({ track }: { track: SpotifyTrack }) {
  const cover = track.album.images[2]?.url ?? track.album.images[0]?.url;
  return (
    <div className="flex items-center gap-3 py-2">
      {cover && (
        <Image src={cover} alt={track.album.name} width={40} height={40} className="rounded flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{track.name}</p>
        <p className="text-xs text-muted truncate">{track.artists.map(a => a.name).join(", ")}</p>
      </div>
      <span className="ml-auto text-xs text-muted flex-shrink-0">{formatDuration(track.duration_ms)}</span>
    </div>
  );
}

function ArtistCard({ artist }: { artist: SpotifyArtist }) {
  const image = artist.images[2]?.url ?? artist.images[0]?.url;
  return (
    <div className="flex items-center gap-3 py-2">
      {image ? (
        <Image src={image} alt={artist.name} width={40} height={40} className="rounded-full flex-shrink-0 object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-border flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{artist.name}</p>
        <p className="text-xs text-muted truncate">{artist.genres.slice(0, 2).join(", ")}</p>
      </div>
    </div>
  );
}

function AlbumCard({ album }: { album: SpotifyAlbum }) {
  const cover = album.images[2]?.url ?? album.images[0]?.url;
  return (
    <div className="flex items-center gap-3 py-2">
      {cover && (
        <Image src={cover} alt={album.name} width={40} height={40} className="rounded flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{album.name}</p>
        <p className="text-xs text-muted truncate">{album.artists.map(a => a.name).join(", ")} · {album.release_date.slice(0, 4)}</p>
      </div>
    </div>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="divide-y divide-border">
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
          : results.tracks.map(t => <TrackCard key={t.id} track={t} />)}
      </Column>
      <Column title="Artists">
        {results.artists.length === 0
          ? <p className="text-sm text-muted py-2">No results</p>
          : results.artists.map(a => <ArtistCard key={a.id} artist={a} />)}
      </Column>
      <Column title="Albums">
        {results.albums.length === 0
          ? <p className="text-sm text-muted py-2">No results</p>
          : results.albums.map(a => <AlbumCard key={a.id} album={a} />)}
      </Column>
    </div>
  );
}
