import Image from "next/image";
import { fetchArtistByName } from "@/lib/artist-service";

interface PageProps {
  params: { id: string };
}

export default async function ArtistPage({ params }: PageProps) {
  const name = decodeURIComponent(params.id);
  const artist = await fetchArtistByName(name);

  if (!artist) {
    return <p className="p-8 text-muted">Artiste introuvable.</p>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center gap-6">
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
      <h1 className="text-3xl font-semibold text-foreground text-center">{artist.name}</h1>
    </main>
  );
}
