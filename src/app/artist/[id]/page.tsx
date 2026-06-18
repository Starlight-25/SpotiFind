import Image from "next/image";
import { fetchArtistByName, fetchArtistSpotifyData } from "@/lib/artist-service";
import ArtistTopTracks from "@/components/ArtistTopTracks";
import ArtistAlbums from "@/components/ArtistAlbums";
import ErrorBanner from "@/components/ErrorBanner";
import HeartButton from "@/components/HeartButton";
import { buildFavouriteId } from "@/lib/favourite-utils";

interface PageProps {
  params: { id: string };
}

export default async function ArtistPage({ params }: PageProps) {
  const name = decodeURIComponent(params.id);

  const [artist, { topTracks, albums }] = await Promise.all([
    fetchArtistByName(name),
    fetchArtistSpotifyData(name),
  ]);

  if (!artist) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <ErrorBanner
          message="Artiste introuvable."
          details={`Aucun résultat pour « ${name} ». Vérifie l'orthographe ou essaie un autre artiste.`}
        />
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-8">
      {artist.thumb ? (
        <Image
          src={artist.thumb}
          alt={artist.name}
          width={240}
          height={240}
          className="rounded-full object-cover w-60 h-60"
        />
      ) : (
        <div className="w-60 h-60 rounded-full bg-border flex items-center justify-center text-muted text-6xl font-bold uppercase">
          {artist.name.charAt(0)}
        </div>
      )}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold text-foreground text-center">{artist.name}</h1>
        <HeartButton
          id={buildFavouriteId("artist", artist.name)}
          kind="artist"
          name={artist.name}
          imageUrl={artist.thumb ?? undefined}
          href={`/artist/${encodeURIComponent(artist.name)}`}
        />
      </div>
      <ArtistTopTracks tracks={topTracks} artistName={artist.name} />
      <ArtistAlbums albums={albums} artistName={artist.name} />
    </main>
  );
}
