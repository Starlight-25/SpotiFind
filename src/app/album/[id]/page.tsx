import { fetchAlbumByName, fetchAlbumForTrack } from "@/lib/album-service";
import { decodeAlbumSlug } from "@/lib/album-utils";
import AlbumHero from "@/components/AlbumHero";
import TrackList from "@/components/TrackList";
import EmptyState from "@/components/EmptyState";
import BackButton from "@/components/BackButton";
import HistoriqueTracker from "@/components/HistoriqueTracker";

interface PageProps {
  params: { id: string };
  searchParams: { isTrack?: string };
}

export default async function AlbumPage({ params, searchParams }: PageProps) {
  let artist: string, name: string;
  try {
    ({ artist, name } = decodeAlbumSlug(params.id));
  } catch {
    return <p className="p-8 text-muted">Lien invalide.</p>;
  }

  const album =
    searchParams.isTrack === "1"
      ? await fetchAlbumForTrack(artist, name)
      : await fetchAlbumByName(artist, name);

  if (!album) {
    if (searchParams.isTrack === "1") {
      return (
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="rounded-lg border border-border bg-surface p-6 text-center">
            <p className="text-foreground font-medium mb-1">Album non disponible</p>
            <p className="text-sm text-muted">
              Ce morceau n&apos;est pas rattaché à un album dans la base Last.fm.
            </p>
          </div>
        </main>
      );
    }
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState title="Album introuvable" subtitle="Cet album n'existe pas dans notre base de données." />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <HistoriqueTracker item={{
        id: `album:${params.id}`,
        kind: "album",
        label: `${album.name} — ${album.artist}`,
        href: `/album/${params.id}`,
        imageUrl: album.image.find(i => i.size === "large")?.["#text"],
      }} />
      <AlbumHero name={album.name} artist={album.artist} images={album.image} playcount={album.playcount} listeners={album.listeners} />
      <TrackList
        tracks={album.tracks}
        albumArtist={album.artist}
        albumImageUrl={album.image.find(i => i.size === "large")?.["#text"]}
        albumHref={`/album/${params.id}`}
      />
    </main>
  );
}
