import { fetchAlbumByName, fetchAlbumForTrack } from "@/lib/album-service";
import { decodeAlbumSlug } from "@/lib/album-utils";
import AlbumHero from "@/components/AlbumHero";
import TrackList from "@/components/TrackList";

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
    return <p className="p-8 text-muted">Album introuvable.</p>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <AlbumHero name={album.name} artist={album.artist} images={album.image} />
      <TrackList tracks={album.tracks} />
    </main>
  );
}
